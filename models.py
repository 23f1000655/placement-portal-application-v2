from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

database = SQLAlchemy()

roles_users_table = database.Table(
    "roles_users",
    database.Column("user_id", database.Integer, database.ForeignKey("users.id")),
    database.Column("role_id", database.Integer, database.ForeignKey("roles.id"))
)


class Role(database.Model, RoleMixin):
    __tablename__ = "roles"
    id          = database.Column(database.Integer, primary_key=True)
    name        = database.Column(database.String(50), unique=True, nullable=False)
    description = database.Column(database.String(200))

    def __repr__(self):
        return f"<Role: {self.name}>"


class User(database.Model, UserMixin):
    __tablename__ = "users"
    id             = database.Column(database.Integer, primary_key=True)
    email          = database.Column(database.String(150), unique=True, nullable=False)
    password       = database.Column(database.String(256), nullable=False)
    active         = database.Column(database.Boolean, default=True)
    fs_uniquifier  = database.Column(database.String(64), unique=True)
    is_blacklisted = database.Column(database.Boolean, default=False)
    joined_on      = database.Column(database.DateTime, default=datetime.utcnow)

    roles = database.relationship(
        "Role",
        secondary=roles_users_table,
        backref=database.backref("users", lazy="dynamic")
    )
    student_profile = database.relationship("Student", backref="user", uselist=False)
    company_profile = database.relationship("Company", backref="user", uselist=False)

    def set_password(self, plain_password):
        self.password = generate_password_hash(plain_password)

    def check_password(self, plain_password):
        return check_password_hash(self.password, plain_password)

    @property
    def role(self):
        if self.roles:
            return self.roles[0].name
        return None

    def to_dict(self):
        return {
            "id":             self.id,
            "email":          self.email,
            "role":           self.role,
            "active":         self.active,
            "is_blacklisted": self.is_blacklisted,
            "joined_on":      self.joined_on.isoformat()
        }

    def __repr__(self):
        return f"<User: {self.email} | Role: {self.role}>"


class Student(database.Model):
    __tablename__ = "students"
    id          = database.Column(database.Integer, primary_key=True)
    user_id     = database.Column(database.Integer, database.ForeignKey("users.id"), nullable=False)
    full_name   = database.Column(database.String(100), nullable=False)
    branch      = database.Column(database.String(100))
    cgpa        = database.Column(database.Float)
    study_year  = database.Column(database.Integer)
    phone       = database.Column(database.String(15))
    skills      = database.Column(database.String(500))          # ← NEW
    resume_path = database.Column(database.String(256))

    applications = database.relationship("Application", backref="student", lazy="dynamic")

    def to_dict(self):
        return {
            "id":             self.id,
            "user_id":        self.user_id,
            "full_name":      self.full_name,
            "branch":         self.branch,
            "cgpa":           self.cgpa,
            "year":           self.study_year,
            "phone":          self.phone,
            "skills":         self.skills,                        # ← NEW
            "resume_path":    self.resume_path,
            "email":          self.user.email          if self.user else None,
            "is_blacklisted": self.user.is_blacklisted if self.user else False,
            "active":         self.user.active         if self.user else True
        }

    def __repr__(self):
        return f"<Student: {self.full_name}>"


class Company(database.Model):
    __tablename__ = "companies"
    id              = database.Column(database.Integer, primary_key=True)
    user_id         = database.Column(database.Integer, database.ForeignKey("users.id"), nullable=False)
    company_name    = database.Column(database.String(150), nullable=False)
    hr_contact      = database.Column(database.String(100))
    website         = database.Column(database.String(200))
    about           = database.Column(database.Text)
    approval_status = database.Column(database.String(20), default="pending")

    drives = database.relationship("PlacementDrive", backref="company", lazy="dynamic")

    def to_dict(self):
        return {
            "id":              self.id,
            "user_id":         self.user_id,
            "company_name":    self.company_name,
            "hr_contact":      self.hr_contact,
            "website":         self.website,
            "description":     self.about,
            "approval_status": self.approval_status,
            "email":           self.user.email          if self.user else None,
            "is_blacklisted":  self.user.is_blacklisted if self.user else False,
            "active":          self.user.active          if self.user else True
        }

    def __repr__(self):
        return f"<Company: {self.company_name}>"


class PlacementDrive(database.Model):
    __tablename__ = "placement_drives"
    id                   = database.Column(database.Integer, primary_key=True)
    company_id           = database.Column(database.Integer, database.ForeignKey("companies.id"), nullable=False)
    drive_name           = database.Column(database.String(150), nullable=False)
    job_title            = database.Column(database.String(100), nullable=False)
    job_description      = database.Column(database.Text)
    drive_date           = database.Column(database.String(50))
    salary               = database.Column(database.String(50))
    location             = database.Column(database.String(100))
    application_deadline = database.Column(database.String(50))
    eligible_branches    = database.Column(database.String(300))
    minimum_cgpa         = database.Column(database.Float)
    eligible_year        = database.Column(database.Integer)
    status               = database.Column(database.String(20), default="pending")
    created_on           = database.Column(database.DateTime, default=datetime.utcnow)

    applications = database.relationship("Application", backref="drive", lazy="dynamic")

    def to_dict(self):
        return {
            "id":                   self.id,
            "company_id":           self.company_id,
            "company_name":         self.company.company_name if self.company else None,
            "drive_name":           self.drive_name,
            "job_title":            self.job_title,
            "job_description":      self.job_description,
            "drive_date":           self.drive_date,
            "salary":               self.salary,
            "location":             self.location,
            "application_deadline": self.application_deadline,
            "eligible_branches":    self.eligible_branches,
            "minimum_cgpa":         self.minimum_cgpa,
            "eligible_year":        self.eligible_year,
            "status":               self.status,
            "created_on":           self.created_on.isoformat()
        }

    def __repr__(self):
        return f"<Drive: {self.drive_name}>"


class Application(database.Model):
    __tablename__ = "applications"
    id             = database.Column(database.Integer, primary_key=True)
    student_id     = database.Column(database.Integer, database.ForeignKey("students.id"), nullable=False)
    drive_id       = database.Column(database.Integer, database.ForeignKey("placement_drives.id"), nullable=False)
    applied_on     = database.Column(database.DateTime, default=datetime.utcnow)
    status         = database.Column(database.String(20), default="applied")
    interview_date = database.Column(database.String(50))        # ← NEW

    def to_dict(self):
        student_info = self.student.to_dict() if self.student else {}
        drive_info   = self.drive.to_dict()   if self.drive   else {}
        return {
            "id":                   self.id,
            "student_id":           self.student_id,
            "drive_id":             self.drive_id,
            "applied_on":           self.applied_on.isoformat(),
            "status":               self.status,
            "interview_date":       self.interview_date,         # ← NEW
            "student_name":         student_info.get("full_name"),
            "student_branch":       student_info.get("branch"),
            "student_cgpa":         student_info.get("cgpa"),
            "student_email":        student_info.get("email"),
            "resume_path":          student_info.get("resume_path"),
            "drive_name":           drive_info.get("drive_name"),
            "job_title":            drive_info.get("job_title"),
            "job_description":      drive_info.get("job_description"),
            "salary":               drive_info.get("salary"),
            "location":             drive_info.get("location"),
            "application_deadline": drive_info.get("application_deadline"),
            "company_name":         drive_info.get("company_name")
        }

    def __repr__(self):
        return f"<Application: Student {self.student_id} → Drive {self.drive_id}>"