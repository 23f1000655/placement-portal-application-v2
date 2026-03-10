from flask import Blueprint, request, jsonify, send_file
from flask_security import auth_required, current_user
import os
import re
from models import database, Student, Company, PlacementDrive, Application
from extensions import cache

student_blueprint = Blueprint("student", __name__)

# ── Cache TTLs ────────────────────────────────────────────────────────────────
TTL_COMPANIES = 300   # 5 min  — approved company list, changes rarely
TTL_COMPANY   = 120   # 2 min  — per-student company detail (includes already_applied)
TTL_APPS      = 60    # 1 min  — student's own applications, want near-realtime
TTL_HISTORY   = 120   # 2 min  — history view


def _student_company_key(company_id, student_id):
    """Per-student, per-company detail cache key."""
    return f"student:company:{company_id}:{student_id}"

def _student_apps_key(student_id):
    return f"student:apps:{student_id}"

def _student_history_key(student_id):
    return f"student:history:{student_id}"

# ══════════════════════════════════════════════════════════════════════════════
#  ELIGIBILITY TEXT PARSER
# ══════════════════════════════════════════════════════════════════════════════

def parse_eligibility(text):
    result = {
        'cgpa_op':    None,
        'cgpa_val':   None,
        'year_val':   None,
        'year_is_min': False,
        'branches':   []
    }
    if not text:
        return result

    t = (text
         .replace('≥', '>=')
         .replace('≤', '<=')
         .replace('⩾', '>=')
         .replace('⩽', '<='))

    cgpa_match = re.search(
        r'cgpa\s*(>=|<=|>|<|=)\s*(\d+\.?\d*)',
        t, re.IGNORECASE
    )
    if cgpa_match:
        result['cgpa_op']  = cgpa_match.group(1)
        result['cgpa_val'] = float(cgpa_match.group(2))

    above_match = re.search(
        r'(\d+)(st|nd|rd|th)?\s*year\s*(and\s*above|or\s*above|\+)',
        t, re.IGNORECASE
    )
    year_match = re.search(r'(\d+)(st|nd|rd|th)?\s*year', t, re.IGNORECASE)
    if not year_match:
        year_match = re.search(r'year\s*(\d+)', t, re.IGNORECASE)
    if year_match:
        result['year_val']    = int(year_match.group(1))
        result['year_is_min'] = bool(above_match)

    clean = re.sub(r'cgpa\s*(>=|<=|>|<|=)\s*\d+\.?\d*', '', t, flags=re.IGNORECASE)
    clean = re.sub(r'(\d+)(st|nd|rd|th)?\s*year(\s*(and|or)\s*above|\+)?',
                   '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'year\s*\d+(\s*(and|or)\s*above|\+)?',
                   '', clean, flags=re.IGNORECASE)

    stopwords = {
        'students', 'student', 'only', 'and', 'or', 'above',
        'minimum', 'min', 'required', 'all', 'any', 'with', 'having',
        'branches', 'branch', 'year', 'years', 'above'
    }
    parts = [p.strip() for p in clean.split(',') if p.strip()]
    result['branches'] = [
        p for p in parts
        if p.lower() not in stopwords and len(p) > 1
    ]
    return result


def cgpa_passes(student_cgpa_raw, op, required_val):
    if student_cgpa_raw is None:
        return False
    val = float(student_cgpa_raw)
    return {
        '>':  val > required_val,
        '>=': val >= required_val,
        '<':  val < required_val,
        '<=': val <= required_val,
        '=':  val == required_val,
    }.get(op, True)


# ══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def get_verified_student():
    if not current_user.is_authenticated or current_user.role != "student":
        return None, (jsonify({"error": "Student access only"}), 403)
    this_student = Student.query.filter_by(user_id=current_user.id).first()
    if not this_student:
        return None, (jsonify({"error": "Student profile not found"}), 404)
    return this_student, None


# ══════════════════════════════════════════════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@student_blueprint.route("/profile", methods=["GET"])
@auth_required()
def get_profile():
    this_student, error = get_verified_student()
    if error:
        return error
    return jsonify({"student": this_student.to_dict()}), 200


@student_blueprint.route("/update-profile", methods=["POST"])
@auth_required()
def update_profile():
    this_student, error = get_verified_student()
    if error:
        return error
    incoming_data = request.get_json()
    if not incoming_data:
        return jsonify({"error": "No data received"}), 400
    if incoming_data.get("full_name", "").strip():
        this_student.full_name = incoming_data["full_name"].strip()
    if "branch" in incoming_data:
        this_student.branch = incoming_data["branch"].strip()
    if "cgpa" in incoming_data:
        this_student.cgpa = incoming_data["cgpa"] or None
    if "study_year" in incoming_data:
        this_student.study_year = incoming_data["study_year"] or None
    if "phone" in incoming_data:
        this_student.phone = incoming_data["phone"].strip()
    if "skills" in incoming_data:
        this_student.skills = incoming_data["skills"].strip()
    database.session.commit()

    # Profile change may affect eligibility checks stored in company detail cache
    # Bust all company detail caches for this student (wildcard not supported in
    # simple Redis cache, so we track via the apps + history keys instead)
    cache.delete(_student_apps_key(this_student.id))
    cache.delete(_student_history_key(this_student.id))
    cache.delete("admin:students")

    return jsonify({
        "message": "Profile updated successfully.",
        "student": this_student.to_dict()
    }), 200


@student_blueprint.route("/companies", methods=["GET"])
@auth_required()
def get_all_companies():
    this_student, error = get_verified_student()
    if error:
        return error

    search_query = request.args.get("search", "").strip().lower()

    # Only cache the unfiltered list; search results vary per query
    if not search_query:
        cached = cache.get("student:companies")
        if cached:
            return jsonify(cached), 200

    all_approved     = Company.query.filter_by(approval_status="approved").all()
    active_companies = [c for c in all_approved if not c.user.is_blacklisted]

    if search_query:
        active_companies = [
            c for c in active_companies
            if search_query in c.company_name.lower()
            or search_query in (c.about or "").lower()
        ]

    result = []
    for c in active_companies:
        company_dict = c.to_dict()
        company_dict["open_drives_count"] = PlacementDrive.query.filter_by(
            company_id=c.id, status="approved"
        ).count()
        result.append(company_dict)

    data = {"companies": result}

    if not search_query:
        cache.set("student:companies", data, timeout=TTL_COMPANIES)

    return jsonify(data), 200


@student_blueprint.route("/company/<int:company_id>", methods=["GET"])
@auth_required()
def get_company_detail(company_id):
    this_student, error = get_verified_student()
    if error:
        return error

    search_query = request.args.get("search", "").strip().lower()
    ck = _student_company_key(company_id, this_student.id)

    # Only cache non-search requests
    if not search_query:
        cached = cache.get(ck)
        if cached:
            return jsonify(cached), 200

    chosen_company = Company.query.get(company_id)
    if not chosen_company:
        return jsonify({"error": "Company not found"}), 404

    open_drives = PlacementDrive.query.filter_by(
        company_id=company_id, status="approved"
    ).order_by(PlacementDrive.created_on.desc()).all()

    if search_query:
        open_drives = [
            d for d in open_drives
            if search_query in d.drive_name.lower()
            or search_query in d.job_title.lower()
            or search_query in (d.location or "").lower()
            or search_query in (d.salary or "").lower()
            or search_query in (d.eligible_branches or "").lower()
        ]

    already_applied_ids = {
        app.drive_id for app in
        Application.query.filter_by(student_id=this_student.id).all()
    }

    drives_data = []
    for drive in open_drives:
        drive_dict = drive.to_dict()
        drive_dict["already_applied"] = drive.id in already_applied_ids
        drives_data.append(drive_dict)

    data = {
        "company": chosen_company.to_dict(),
        "drives":  drives_data
    }

    if not search_query:
        cache.set(ck, data, timeout=TTL_COMPANY)

    return jsonify(data), 200


@student_blueprint.route("/apply/<int:drive_id>", methods=["POST"])
@auth_required()
def apply_to_drive(drive_id):
    this_student, error = get_verified_student()
    if error:
        return error

    chosen_drive = PlacementDrive.query.get(drive_id)
    if not chosen_drive:
        return jsonify({"error": "Drive not found"}), 404
    if chosen_drive.status != "approved":
        return jsonify({"error": "This drive is not open for applications"}), 400

    duplicate = Application.query.filter_by(
        student_id=this_student.id, drive_id=drive_id
    ).first()
    if duplicate:
        return jsonify({"error": "You have already applied to this drive"}), 409

    parsed   = parse_eligibility(chosen_drive.eligible_branches or "")
    cgpa_op  = parsed['cgpa_op']
    cgpa_val = parsed['cgpa_val']
    if cgpa_op is None and chosen_drive.minimum_cgpa is not None:
        cgpa_op  = '>='
        cgpa_val = float(chosen_drive.minimum_cgpa)

    if cgpa_op and cgpa_val is not None:
        if this_student.cgpa is None:
            return jsonify({
                "error": (
                    f"This drive requires CGPA {cgpa_op} {cgpa_val}. "
                    f"Please update your profile with your CGPA before applying."
                )
            }), 403
        if not cgpa_passes(this_student.cgpa, cgpa_op, cgpa_val):
            return jsonify({
                "error": (
                    f"Your CGPA ({this_student.cgpa}) does not meet the requirement "
                    f"(CGPA {cgpa_op} {cgpa_val}) for this drive."
                )
            }), 403

    req_year    = parsed['year_val']
    year_is_min = parsed['year_is_min']
    if req_year is None and chosen_drive.eligible_year is not None:
        req_year    = int(chosen_drive.eligible_year)
        year_is_min = False

    if req_year is not None:
        if this_student.study_year is None:
            qualifier = f"Year {req_year}+" if year_is_min else f"Year {req_year}"
            return jsonify({
                "error": (
                    f"This drive is for {qualifier} students. "
                    f"Please update your profile with your current year before applying."
                )
            }), 403
        student_year = int(this_student.study_year)
        passes_year  = (student_year >= req_year) if year_is_min else (student_year == req_year)
        if not passes_year:
            qualifier = f"Year {req_year} and above" if year_is_min else f"Year {req_year}"
            return jsonify({
                "error": (
                    f"This drive is open for {qualifier} students only "
                    f"(your year: Year {student_year})."
                )
            }), 403

    if parsed['branches']:
        student_branch = (this_student.branch or "").strip().lower()
        if not student_branch:
            return jsonify({
                "error": (
                    "This drive has branch restrictions. "
                    "Please update your profile with your branch before applying."
                )
            }), 403
        allowed_lower = [b.lower() for b in parsed['branches']]
        branch_ok = any(
            student_branch in b or b in student_branch
            for b in allowed_lower
        )
        if not branch_ok:
            return jsonify({
                "error": (
                    f"Your branch ({this_student.branch}) is not eligible for this drive. "
                    f"Eligible: {', '.join(parsed['branches'])}"
                )
            }), 403

    uploaded_file = request.files.get("resume")
    if not uploaded_file or uploaded_file.filename == "":
        return jsonify({"error": "Please upload your resume (PDF) to apply"}), 400
    if not uploaded_file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are accepted as resume"}), 400

    upload_folder = os.path.join(os.getcwd(), "static", "uploads", "resumes")
    os.makedirs(upload_folder, exist_ok=True)
    saved_filename = f"student_{this_student.id}_resume.pdf"
    save_path      = os.path.join(upload_folder, saved_filename)
    uploaded_file.save(save_path)
    this_student.resume_path = os.path.join("static", "uploads", "resumes", saved_filename)
    database.session.flush()

    new_application = Application(
        student_id=this_student.id,
        drive_id=drive_id,
        status="applied"
    )
    database.session.add(new_application)
    database.session.commit()

    # Applying changes: student's app list, history, and the company detail
    # page for this student (already_applied flag changed)
    cache.delete(_student_apps_key(this_student.id))
    cache.delete(_student_history_key(this_student.id))
    cache.delete(_student_company_key(chosen_drive.company_id, this_student.id))
    cache.delete("admin:applications")

    return jsonify({
        "message":     f"Successfully applied to {chosen_drive.drive_name}!",
        "application": new_application.to_dict()
    }), 201


@student_blueprint.route("/my-resume", methods=["GET"])
@auth_required()
def serve_my_resume():
    this_student, error = get_verified_student()
    if error:
        return error
    if not this_student.resume_path:
        return jsonify({"error": "No resume uploaded yet"}), 404
    full_path = os.path.join(os.getcwd(), this_student.resume_path)
    if not os.path.exists(full_path):
        return jsonify({"error": "Resume file not found on server"}), 404
    return send_file(full_path, mimetype="application/pdf")


@student_blueprint.route("/my-applications", methods=["GET"])
@auth_required()
def get_my_applications():
    this_student, error = get_verified_student()
    if error:
        return error

    ck     = _student_apps_key(this_student.id)
    cached = cache.get(ck)
    if cached:
        return jsonify(cached), 200

    all_apps = Application.query.filter_by(
        student_id=this_student.id
    ).order_by(Application.applied_on.desc()).all()

    data = {"applications": [app.to_dict() for app in all_apps]}
    cache.set(ck, data, timeout=TTL_APPS)
    return jsonify(data), 200


@student_blueprint.route("/history", methods=["GET"])
@auth_required()
def get_history():
    this_student, error = get_verified_student()
    if error:
        return error

    ck     = _student_history_key(this_student.id)
    cached = cache.get(ck)
    if cached:
        return jsonify(cached), 200

    all_apps = Application.query.filter_by(
        student_id=this_student.id
    ).order_by(Application.applied_on.desc()).all()

    history_rows = []
    for each_app in all_apps:
        drive          = each_app.drive
        display_result = "cancelled" if (drive and drive.status == "cancelled") else each_app.status
        history_rows.append({
            "application_id": each_app.id,
            "drive_name":     drive.drive_name            if drive                   else "—",
            "job_title":      drive.job_title             if drive                   else "—",
            "location":       drive.location              if drive                   else "—",
            "company_name":   drive.company.company_name  if drive and drive.company else "—",
            "applied_on":     each_app.applied_on.isoformat(),
            "interview_date": each_app.interview_date,
            "status":         display_result
        })

    data = {
        "student": this_student.to_dict(),
        "history": history_rows
    }
    cache.set(ck, data, timeout=TTL_HISTORY)
    return jsonify(data), 200


# ══════════════════════════════════════════════════════════════════════════════
#  ASYNC CSV EXPORT  (Milestone c)
# ══════════════════════════════════════════════════════════════════════════════

@student_blueprint.route("/export-csv", methods=["POST"])
@auth_required()
def trigger_csv_export():
    """
    Student clicks 'Export History' → queues a Celery task.
    The task builds a CSV and emails it to the student.
    Returns 202 immediately so the UI shows a 'check your email' banner.
    """
    this_student, error = get_verified_student()
    if error:
        return error

    from tasks import export_applications_csv
    export_applications_csv.delay(this_student.id)

    return jsonify({
        "message": (
            "Your export is being prepared. "
            f"You will receive a CSV at {this_student.user.email} shortly!"
        )
    }), 202