import os
from celery.schedules import crontab

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
    
    # ── Flask-Caching (Redis backend, separate DB from Celery) ───────────────
    # Redis DB 0 → Celery broker/results
    # Redis DB 1 → Flask-Cache
    CACHE_TYPE              = "RedisCache"
    CACHE_REDIS_URL         = os.environ.get("CACHE_REDIS_URL", "redis://localhost:6379/1")
    CACHE_DEFAULT_TIMEOUT   = 300   # 5 minutes global default
    CACHE_KEY_PREFIX        = "hs:"  # namespace all keys

    # ── Redis / Celery ────────────────────────────────────────────────────────
    REDIS_URL             = os.environ.get("REDIS_URL",             "redis://localhost:6379/0")
    CELERY_BROKER_URL     = os.environ.get("CELERY_BROKER_URL",     "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    # ── Flask-Mail (Gmail SMTP example — swap creds via env vars) ─────────────
    MAIL_SERVER   = os.environ.get("MAIL_SERVER",   "smtp.gmail.com")
    MAIL_PORT     = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS  = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "your_gmail@gmail.com")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "your_app_password")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "HireSphere <your_gmail@gmail.com>")

    # Admin email — monthly report goes here
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "23f1000655@ds.study.iitm.ac.in")

    # ── Celery Beat Schedule ──────────────────────────────────────────────────
    CELERYBEAT_SCHEDULE = {
        # Daily at 8 AM — deadline reminders to students
        "daily-deadline-reminders": {
            "task":     "tasks.send_deadline_reminders",
            "schedule": crontab(hour=8, minute=0),
        },
        # 1st of every month at 7 AM — monthly report to admin
        "monthly-activity-report": {
            "task":     "tasks.send_monthly_report",
            "schedule": crontab(hour=7, minute=0, day_of_month=1),
        },
    }
    CELERY_TIMEZONE = "Asia/Kolkata"