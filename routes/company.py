from flask import Blueprint, request, jsonify, send_file
from flask_security import auth_required, current_user
import os

from models import database, Company, PlacementDrive, Application, Student
from extensions import cache

company_blueprint = Blueprint("company", __name__)

# ── Cache TTLs ────────────────────────────────────────────────────────────────
TTL_DRIVES = 180   # 3 min — company's own drives list


def _company_drives_key(company_id):
    """Per-company cache key for the drives list."""
    return f"company:drives:{company_id}"

def _company_drive_apps_key(drive_id):
    """Per-drive cache key for the applications list."""
    return f"company:drive_apps:{drive_id}"


def get_verified_company():
    if not current_user.is_authenticated or current_user.role != "company":
        return None, (jsonify({"error": "Company access only"}), 403)
    this_company = Company.query.filter_by(user_id=current_user.id).first()
    if not this_company:
        return None, (jsonify({"error": "Company profile not found"}), 404)
    if this_company.approval_status != "approved":
        return None, (jsonify({"error": "Your company is not yet approved by admin"}), 403)
    return this_company, None


# ══════════════════════════════════════════════════════════════════════════════
#  READ ENDPOINTS  (cached)
# ══════════════════════════════════════════════════════════════════════════════

@company_blueprint.route("/my-drives", methods=["GET"])
@auth_required()
def get_my_drives():
    this_company, error = get_verified_company()
    if error:
        return error

    ck = _company_drives_key(this_company.id)
    cached = cache.get(ck)
    if cached:
        return jsonify(cached), 200

    my_drives = PlacementDrive.query.filter_by(
        company_id=this_company.id
    ).order_by(PlacementDrive.created_on.desc()).all()

    data = {"drives": [drive.to_dict() for drive in my_drives]}
    cache.set(ck, data, timeout=TTL_DRIVES)
    return jsonify(data), 200


@company_blueprint.route("/drive/<int:drive_id>/applications", methods=["GET"])
@auth_required()
def get_drive_applications(drive_id):
    this_company, error = get_verified_company()
    if error:
        return error

    chosen_drive = PlacementDrive.query.filter_by(
        id=drive_id, company_id=this_company.id
    ).first()
    if not chosen_drive:
        return jsonify({"error": "Drive not found or does not belong to your company"}), 404

    ck = _company_drive_apps_key(drive_id)
    cached = cache.get(ck)
    if cached:
        return jsonify(cached), 200

    all_applications = Application.query.filter_by(drive_id=drive_id).all()
    data = {
        "drive":        chosen_drive.to_dict(),
        "applications": [app.to_dict() for app in all_applications]
    }
    cache.set(ck, data, timeout=TTL_DRIVES)
    return jsonify(data), 200


# ══════════════════════════════════════════════════════════════════════════════
#  WRITE ENDPOINTS  (invalidate cache after each change)
# ══════════════════════════════════════════════════════════════════════════════

@company_blueprint.route("/create-drive", methods=["POST"])
@auth_required()
def create_drive():
    this_company, error = get_verified_company()
    if error:
        return error

    incoming_data = request.get_json()
    if not incoming_data:
        return jsonify({"error": "No data received"}), 400

    drive_name = incoming_data.get("drive_name", "").strip()
    job_title  = incoming_data.get("job_title",  "").strip()
    if not drive_name:
        return jsonify({"error": "Drive name is required"}), 400
    if not job_title:
        return jsonify({"error": "Job title is required"}), 400

    new_drive = PlacementDrive(
        company_id           = this_company.id,
        drive_name           = drive_name,
        job_title            = job_title,
        job_description      = incoming_data.get("job_description",      "").strip(),
        drive_date           = incoming_data.get("drive_date",           "").strip(),
        salary               = incoming_data.get("salary",               "").strip(),
        location             = incoming_data.get("location",             "").strip(),
        application_deadline = incoming_data.get("application_deadline", "").strip(),
        eligible_branches    = incoming_data.get("eligible_branches",    "").strip(),
        minimum_cgpa         = incoming_data.get("minimum_cgpa")  or None,
        eligible_year        = incoming_data.get("eligible_year") or None,
        status               = "approved"
    )
    database.session.add(new_drive)
    database.session.commit()

    # New drive → bust company drives list + admin caches
    cache.delete(_company_drives_key(this_company.id))
    cache.delete("admin:ongoing_drives")
    cache.delete("admin:stats")

    return jsonify({
        "message": f"Drive '{drive_name}' has been created successfully!",
        "drive":   new_drive.to_dict()
    }), 201


@company_blueprint.route("/drive/<int:drive_id>/cancel", methods=["POST"])
@auth_required()
def cancel_my_drive(drive_id):
    this_company, error = get_verified_company()
    if error:
        return error

    chosen_drive = PlacementDrive.query.filter_by(
        id=drive_id, company_id=this_company.id
    ).first()
    if not chosen_drive:
        return jsonify({"error": "Drive not found or does not belong to your company"}), 404
    if chosen_drive.status in ["completed", "cancelled"]:
        return jsonify({"error": "This drive is already closed and cannot be cancelled."}), 400

    chosen_drive.status = "cancelled"
    database.session.commit()

    cache.delete(_company_drives_key(this_company.id))
    cache.delete(_company_drive_apps_key(drive_id))
    cache.delete("admin:ongoing_drives")
    cache.delete("admin:stats")

    return jsonify({
        "message": f"Drive '{chosen_drive.drive_name}' has been cancelled."
    }), 200


@company_blueprint.route("/drive/<int:drive_id>/mark-complete", methods=["POST"])
@auth_required()
def mark_my_drive_complete(drive_id):
    this_company, error = get_verified_company()
    if error:
        return error

    chosen_drive = PlacementDrive.query.filter_by(
        id=drive_id, company_id=this_company.id
    ).first()
    if not chosen_drive:
        return jsonify({"error": "Drive not found or does not belong to your company"}), 404

    chosen_drive.status = "completed"
    database.session.commit()

    cache.delete(_company_drives_key(this_company.id))
    cache.delete(_company_drive_apps_key(drive_id))
    cache.delete("admin:ongoing_drives")
    cache.delete("admin:stats")

    return jsonify({
        "message": f"Drive '{chosen_drive.drive_name}' has been marked as complete."
    }), 200


@company_blueprint.route("/application/<int:application_id>/update-status", methods=["POST"])
@auth_required()
def update_application_status(application_id):
    this_company, error = get_verified_company()
    if error:
        return error

    incoming_data = request.get_json()
    if not incoming_data:
        return jsonify({"error": "No data received"}), 400

    new_status       = incoming_data.get("status", "").strip().lower()
    allowed_statuses = ["applied", "shortlisted", "selected", "rejected"]
    if new_status not in allowed_statuses:
        return jsonify({"error": f"Status must be one of: {', '.join(allowed_statuses)}"}), 400

    chosen_application = Application.query.get(application_id)
    if not chosen_application:
        return jsonify({"error": "Application not found"}), 404

    drive_belongs_to_us = PlacementDrive.query.filter_by(
        id=chosen_application.drive_id, company_id=this_company.id
    ).first()
    if not drive_belongs_to_us:
        return jsonify({"error": "This application does not belong to your company's drives"}), 403

    chosen_application.status = new_status
    database.session.commit()

    cache.delete(_company_drive_apps_key(chosen_application.drive_id))
    cache.delete("admin:applications")

    return jsonify({
        "message":     f"Application status updated to '{new_status}'.",
        "application": chosen_application.to_dict()
    }), 200


@company_blueprint.route("/bulk-update-statuses", methods=["POST"])
@auth_required()
def bulk_update_statuses():
    this_company, error = get_verified_company()
    if error:
        return error

    incoming_data = request.get_json()
    if not incoming_data or "updates" not in incoming_data:
        return jsonify({"error": "No updates received"}), 400

    updates_list     = incoming_data.get("updates", [])
    allowed_statuses = ["applied", "shortlisted", "selected", "rejected"]
    affected_drives  = set()

    for each_update in updates_list:
        app_id     = each_update.get("application_id")
        new_status = each_update.get("status", "").strip().lower()
        if not app_id or new_status not in allowed_statuses:
            continue
        chosen_application = Application.query.get(app_id)
        if not chosen_application:
            continue
        drive_belongs_to_us = PlacementDrive.query.filter_by(
            id=chosen_application.drive_id, company_id=this_company.id
        ).first()
        if drive_belongs_to_us:
            chosen_application.status = new_status
            affected_drives.add(chosen_application.drive_id)

    database.session.commit()

    # Bust cache for every drive that was updated
    for drive_id in affected_drives:
        cache.delete(_company_drive_apps_key(drive_id))
    cache.delete("admin:applications")

    return jsonify({
        "message": f"Saved statuses for {len(updates_list)} application(s)."
    }), 200


# ══════════════════════════════════════════════════════════════════════════════
#  FILE SERVE  (no caching — binary response)
# ══════════════════════════════════════════════════════════════════════════════

@company_blueprint.route("/student-resume/<int:student_id>", methods=["GET"])
@auth_required()
def view_resume(student_id):
    this_company, error = get_verified_company()
    if error:
        return error

    chosen_student = Student.query.get(student_id)
    if not chosen_student:
        return jsonify({"error": "Student not found"}), 404
    if not chosen_student.resume_path:
        return jsonify({"error": "This student has not uploaded a resume yet."}), 404

    full_file_path = os.path.join(os.getcwd(), chosen_student.resume_path)
    if not os.path.exists(full_file_path):
        return jsonify({"error": "Resume file not found on server."}), 404

    return send_file(full_file_path, as_attachment=False)