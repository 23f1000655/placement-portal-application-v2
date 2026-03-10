from dotenv import load_dotenv
load_dotenv()

from flask import Flask, render_template
from flask_security import Security, SQLAlchemyUserDatastore
from flask_cors import CORS
import uuid

from config import Config
from models import database, User, Role
from extensions import mail, celery, init_celery   # ← NEW


def create_app():
    hiresphere = Flask(__name__)
    hiresphere.config.from_object(Config)

    database.init_app(hiresphere)
    mail.init_app(hiresphere)          # ← NEW  (Flask-Mail)
    CORS(hiresphere)

    user_datastore = SQLAlchemyUserDatastore(database, User, Role)
    Security(hiresphere, user_datastore, register_blueprint=False)
    hiresphere.user_datastore = user_datastore

    # Wire Celery to the Flask app so tasks get an app context
    init_celery(hiresphere, celery)    # ← NEW

    from routes.auth    import auth_blueprint
    from routes.admin   import admin_blueprint
    from routes.company import company_blueprint
    from routes.student import student_blueprint

    hiresphere.register_blueprint(auth_blueprint,    url_prefix="/api/auth")
    hiresphere.register_blueprint(admin_blueprint,   url_prefix="/api/admin")
    hiresphere.register_blueprint(company_blueprint, url_prefix="/api/company")
    hiresphere.register_blueprint(student_blueprint, url_prefix="/api/student")

    with hiresphere.app_context():
        database.create_all()
        insert_roles()
        insert_admin()

    @hiresphere.route("/")
    def home():
        return render_template("index.html")

    return hiresphere


# ── seed helpers ──────────────────────────────────────────────────────────────

def insert_roles():
    all_roles = [
        ("admin",   "Full access — institute placement cell"),
        ("student", "Can browse and apply to placement drives"),
        ("company", "Can post placement drives and review applicants"),
    ]
    for role_name, role_description in all_roles:
        if not Role.query.filter_by(name=role_name).first():
            database.session.add(Role(name=role_name, description=role_description))
    database.session.commit()


def insert_admin():
    if User.query.filter(User.roles.any(name="admin")).first():
        return
    admin_role = Role.query.filter_by(name="admin").first()
    admin_user = User(
        email          = "admin@hiresphere.com",
        active         = True,
        is_blacklisted = False,
        fs_uniquifier  = str(uuid.uuid4())
    )
    admin_user.set_password("Admin@123")
    admin_user.roles.append(admin_role)
    database.session.add(admin_user)
    database.session.commit()
    print("\n" + "=" * 45)
    print("  Admin account ready!")
    print("  Email   : admin@hiresphere.com")
    print("  Password: Admin@123")
    print("=" * 45 + "\n")


flask_app = create_app()

if __name__ == "__main__":
    flask_app.run(debug=True)