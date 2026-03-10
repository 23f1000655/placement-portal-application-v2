import os


class Config:

    SECRET_KEY = os.environ.get("SECRET_KEY", "hiresphere-dev-secret")

    SQLALCHEMY_DATABASE_URI = "sqlite:///hiresphere.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SECURITY_PASSWORD_SALT = os.environ.get("SECURITY_PASSWORD_SALT", "hiresphere-dev-salt")
    SECURITY_PASSWORD_HASH = "bcrypt"

    SECURITY_REGISTERABLE = False
    SECURITY_SEND_REGISTER_EMAIL = False
    SECURITY_CONFIRMABLE = False
    SECURITY_RECOVERABLE = False
    SECURITY_API_ENABLED = True

    WTF_CSRF_ENABLED = False

    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")