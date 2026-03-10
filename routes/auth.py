from flask import Blueprint, request, jsonify, current_app
from flask_security import auth_required, current_user, login_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

from models import database, User, Student, Company


auth_blueprint = Blueprint("auth", __name__)


@auth_blueprint.route("/register", methods=["POST"])
def register():
    incoming_data = request.get_json()

    if not incoming_data:
        return jsonify({"error": "No data received"}), 400

    entered_email    = incoming_data.get("email", "").strip().lower()
    entered_password = incoming_data.get("password", "")
    chosen_role      = incoming_data.get("role", "").strip().lower()

    if not entered_email:
        return jsonify({"error": "Email is required"}), 400
    if not entered_password:
        return jsonify({"error": "Password cannot be empty"}), 400
    if len(entered_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if chosen_role not in ["student", "company"]:
        return jsonify({"error": "Role must be either student or company"}), 400

    email_taken = User.query.filter_by(email=entered_email).first()
    if email_taken:
        return jsonify({"error": "An account with this email already exists. Please login."}), 409

    selected_role = current_app.user_datastore.find_role(chosen_role)

    new_user = User(
        email          = entered_email,
        password       = generate_password_hash(entered_password),
        active         = True,
        fs_uniquifier  = str(uuid.uuid4())
    )
    new_user.roles.append(selected_role)

    database.session.add(new_user)
    database.session.flush()

    if chosen_role == "student":
        entered_name = incoming_data.get("full_name", "").strip()
        if not entered_name:
            database.session.rollback()
            return jsonify({"error": "Full name is required"}), 400

        student_details = Student(
            user_id    = new_user.id,
            full_name  = entered_name,
            branch     = incoming_data.get("branch", "").strip(),
            cgpa       = incoming_data.get("cgpa"),
            study_year = incoming_data.get("year"),
            phone      = incoming_data.get("phone", "").strip()
        )
        database.session.add(student_details)

    else:
        entered_company_name = incoming_data.get("company_name", "").strip()
        if not entered_company_name:
            database.session.rollback()
            return jsonify({"error": "Company name is required"}), 400

        company_details = Company(
            user_id         = new_user.id,
            company_name    = entered_company_name,
            hr_contact      = incoming_data.get("hr_contact", "").strip(),
            website         = incoming_data.get("website", "").strip(),
            about           = incoming_data.get("description", "").strip(),
            approval_status = "pending"
        )
        database.session.add(company_details)

    database.session.commit()
    login_user(new_user)

    user_info = new_user.to_dict()
    if chosen_role == "student":
        user_info["profile"] = new_user.student_profile.to_dict()
    else:
        user_info["profile"] = new_user.company_profile.to_dict()

    return jsonify({
        "message": "Registration successful. Welcome to HireSphere!",
        "user":    user_info
    }), 201


@auth_blueprint.route("/login", methods=["POST"])
def login():
    incoming_data = request.get_json()

    if not incoming_data:
        return jsonify({"error": "No data received"}), 400

    entered_email    = incoming_data.get("email", "").strip().lower()
    entered_password = incoming_data.get("password", "")

    if not entered_email or not entered_password:
        return jsonify({"error": "Both email and password are required"}), 400

    matched_user = User.query.filter_by(email=entered_email).first()

    if not matched_user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not check_password_hash(matched_user.password, entered_password):
        return jsonify({"error": "Invalid email or password"}), 401

    if not matched_user.active:
        return jsonify({"error": "Your account has been deactivated. Contact admin."}), 403

    if matched_user.is_blacklisted:
        return jsonify({"error": "Your account is restricted. Contact admin."}), 403

    login_user(matched_user)

    user_info = matched_user.to_dict()
    if matched_user.role == "student" and matched_user.student_profile:
        user_info["profile"] = matched_user.student_profile.to_dict()
    elif matched_user.role == "company" and matched_user.company_profile:
        user_info["profile"] = matched_user.company_profile.to_dict()

    return jsonify({
        "message": "Login successful.",
        "user":    user_info
    }), 200


@auth_blueprint.route("/logout", methods=["POST"])
def logout():
    logout_user()
    return jsonify({"message": "You have been logged out."}), 200


@auth_blueprint.route("/me", methods=["GET"])
@auth_required()
def who_am_i():
    logged_in_user = current_user

    user_info = logged_in_user.to_dict()
    if logged_in_user.role == "student" and logged_in_user.student_profile:
        user_info["profile"] = logged_in_user.student_profile.to_dict()
    elif logged_in_user.role == "company" and logged_in_user.company_profile:
        user_info["profile"] = logged_in_user.company_profile.to_dict()

    return jsonify({"user": user_info}), 200