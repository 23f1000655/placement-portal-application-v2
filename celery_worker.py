"""
celery_worker.py
~~~~~~~~~~~~~~~~
Creates and configures the Celery instance that shares the Flask app context.

Start the worker with:
    celery -A celery_worker.celery worker --loglevel=info

Start the beat scheduler (for periodic tasks) with:
    celery -A celery_worker.celery beat --loglevel=info
"""

from app import create_app
from extensions import celery, init_celery

flask_app = create_app()
init_celery(flask_app, celery)