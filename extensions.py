"""
extensions.py
~~~~~~~~~~~~~
Centralised Flask extension instances.
Import FROM here — never create a second instance elsewhere.
"""

from flask_mail import Mail
from flask_caching import Cache
from celery import Celery

mail  = Mail()
cache = Cache()

# Celery is created bare here; init_celery() wires it to the Flask app later.
celery = Celery(__name__)


def init_celery(app, celery_instance):
    """
    Bind the Celery instance to the Flask app so every task runs inside
    an application context (database access, config, etc. all work normally).
    """
    celery_instance.conf.update(
        broker_url     = app.config["CELERY_BROKER_URL"],
        result_backend = app.config["CELERY_RESULT_BACKEND"],
        timezone       = app.config.get("CELERY_TIMEZONE", "Asia/Kolkata"),
        beat_schedule  = app.config.get("CELERYBEAT_SCHEDULE", {}),
    )

    class ContextTask(celery_instance.Task):
        """Tasks run inside a Flask application context."""
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_instance.Task = ContextTask
    return celery_instance