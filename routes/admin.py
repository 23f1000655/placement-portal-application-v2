from flask import Blueprint, request, jsonify, send_file
from flask_security import auth_required, current_user
import os

from models import database, User, Student, Company, PlacementDrive, Application

admin_blueprint = Blueprint("admin", __name__)


def only_admin():
    if not current_user.is_authenticated or current_user.role != "admin":
        return jsonify({"error": "Admin access only"}), 403
    return None


@admin_blueprint.route("/stats", methods=["GET"])
@auth_required()
def get_dashboard_stats():
    blocked = only_admin()
    if blocked:
        return blocked
    return jsonify({
        "total_students":    Student.query.count(),
        "total_companies":   Company.query.filter_by(approval_status="approved").count(),
        "total_drives":      PlacementDrive.query.filter_by(status="approved").count(),
        "pending_approvals": Company.query.filter_by(approval_status="pending").count()
    }), 200


@admin_blueprint.route("/companies", methods=["GET"])
@auth_required()
def get_all_companies():
    blocked = only_admin()
    if blocked:
        return blocked

    search_query  = request.args.get("search", "").strip().lower()
    all_companies = Company.query.filter(Company.approval_status == "approved").all()

    if search_query:
        all_companies = [
            c for c in all_companies
            if search_query in c.company_name.lower()
            or search_query in (c.user.email or "").lower()
        ]

    return jsonify({"companies": [c.to_dict() for c in all_companies]}), 200


@admin_blueprint.route("/pending-companies", methods=["GET"])
@auth_required()
def get_pending_companies():
    blocked = only_admin()
    if blocked:
        return blocked
    waiting = Company.query.filter_by(approval_status="pending").all()
    return jsonify({"companies": [c.to_dict() for c in waiting]}), 200


@admin_blueprint.route("/students", methods=["GET"])
@auth_required()
def get_all_students():
    blocked = only_admin()
    if blocked:
        return blocked

    search_query = request.args.get("search", "").strip().lower()
    all_students = Student.query.all()

    if search_query:
        all_students = [
            s for s in all_students
            if search_query in s.full_name.lower()
            or search_query in (s.user.email or "").lower()
            or search_query in (s.branch or "").lower()
        ]

    return jsonify({"students": [s.to_dict() for s in all_students]}), 200


@admin_blueprint.route("/ongoing-drives", methods=["GET"])
@auth_required()
def get_ongoing_drives():
    blocked = only_admin()
    if blocked:
        return blocked

    search_query  = request.args.get("search", "").strip().lower()
    active_drives = PlacementDrive.query.filter_by(status="approved").all()

    if search_query:
        active_drives = [
            d for d in active_drives
            if search_query in d.drive_name.lower()
            or search_query in d.job_title.lower()
            or search_query in (d.company.company_name if d.company else "").lower()
            or search_query in (d.location or "").lower()
        ]

    return jsonify({"drives": [d.to_dict() for d in active_drives]}), 200


@admin_blueprint.route("/applications", methods=["GET"])
@auth_required()
def get_all_applications():
    blocked = only_admin()
    if blocked:
        return blocked
    every_application = Application.query.all()
    return jsonify({
        "applications": [a.to_dict() for a in every_application]
    }), 200


@admin_blueprint.route("/approve-company/<int:company_id>", methods=["POST"])
@auth_required()
def approve_company(company_id):
    blocked = only_admin()
    if blocked:
        return blocked
    chosen_company = Company.query.get(company_id)
    if not chosen_company:
        return jsonify({"error": "Company not found"}), 404
    chosen_company.approval_status = "approved"
    for drive in PlacementDrive.query.filter_by(company_id=company_id).all():
        if drive.status == "pending":
            drive.status = "approved"
    database.session.commit()
    return jsonify({
        "message": f"{chosen_company.company_name} has been approved.",
        "company": chosen_company.to_dict()
    }), 200


@admin_blueprint.route("/reject-company/<int:company_id>", methods=["POST"])
@auth_required()
def reject_company(company_id):
    blocked = only_admin()
    if blocked:
        return blocked
    chosen_company = Company.query.get(company_id)
    if not chosen_company:
        return jsonify({"error": "Company not found"}), 404
    chosen_company.approval_status = "rejected"
    database.session.commit()
    return jsonify({
        "message": f"{chosen_company.company_name} has been rejected.",
        "company": chosen_company.to_dict()
    }), 200


@admin_blueprint.route("/blacklist-company/<int:company_id>", methods=["POST"])
@auth_required()
def blacklist_company(company_id):
    blocked = only_admin()
    if blocked:
        return blocked
    chosen_company = Company.query.get(company_id)
    if not chosen_company:
        return jsonify({"error": "Company not found"}), 404
    company_user = User.query.get(chosen_company.user_id)
    if company_user:
        company_user.is_blacklisted = True
        company_user.active = False
    for drive in PlacementDrive.query.filter_by(company_id=company_id).all():
        drive.status = "cancelled"
    database.session.commit()
    return jsonify({
        "message": f"{chosen_company.company_name} has been blacklisted and all their drives cancelled."
    }), 200


@admin_blueprint.route("/unblacklist-company/<int:company_id>", methods=["POST"])
@auth_required()
def unblacklist_company(company_id):
    blocked = only_admin()
    if blocked:
        return blocked
    chosen_company = Company.query.get(company_id)
    if not chosen_company:
        return jsonify({"error": "Company not found"}), 404
    company_user = User.query.get(chosen_company.user_id)
    if company_user:
        company_user.is_blacklisted = False
        company_user.active = True
    database.session.commit()
    return jsonify({"message": f"{chosen_company.company_name} has been reinstated."}), 200


@admin_blueprint.route("/blacklist-student/<int:student_id>", methods=["POST"])
@auth_required()
def blacklist_student(student_id):
    blocked = only_admin()
    if blocked:
        return blocked
    chosen_student = Student.query.get(student_id)
    if not chosen_student:
        return jsonify({"error": "Student not found"}), 404
    student_user = User.query.get(chosen_student.user_id)
    if student_user:
        student_user.is_blacklisted = True
        student_user.active = False
    database.session.commit()
    return jsonify({"message": f"{chosen_student.full_name} has been blacklisted."}), 200


@admin_blueprint.route("/unblacklist-student/<int:student_id>", methods=["POST"])
@auth_required()
def unblacklist_student(student_id):
    blocked = only_admin()
    if blocked:
        return blocked
    chosen_student = Student.query.get(student_id)
    if not chosen_student:
        return jsonify({"error": "Student not found"}), 404
    student_user = User.query.get(chosen_student.user_id)
    if student_user:
        student_user.is_blacklisted = False
        student_user.active = True
    database.session.commit()
    return jsonify({"message": f"{chosen_student.full_name} has been reinstated."}), 200


@admin_blueprint.route("/mark-drive-complete/<int:drive_id>", methods=["POST"])
@auth_required()
def mark_drive_complete(drive_id):
    blocked = only_admin()
    if blocked:
        return blocked
    chosen_drive = PlacementDrive.query.get(drive_id)
    if not chosen_drive:
        return jsonify({"error": "Drive not found"}), 404
    chosen_drive.status = "completed"
    database.session.commit()
    return jsonify({
        "message": f"Drive '{chosen_drive.drive_name}' has been marked as complete."
    }), 200


@admin_blueprint.route("/student-resume/<int:student_id>", methods=["GET"])
@auth_required()
def view_student_resume(student_id):
    blocked = only_admin()
    if blocked:
        return blocked
    chosen_student = Student.query.get(student_id)
    if not chosen_student:
        return jsonify({"error": "Student not found"}), 404
    if not chosen_student.resume_path:
        return jsonify({"error": "This student has not uploaded a resume yet."}), 404
    full_file_path = os.path.join(os.getcwd(), chosen_student.resume_path)
    if not os.path.exists(full_file_path):
        return jsonify({"error": "Resume file not found on server."}), 404
    return send_file(full_file_path, as_attachment=False)