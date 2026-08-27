# HireSphere — Campus Placement Portal

A full-stack campus recruitment platform built with Flask, supporting three distinct roles: **Admin** (placement cell), **Company** (recruiter), and **Student** (applicant). The backend is a REST API with token-based authentication, Redis caching, and Celery-powered background task scheduling.

---
###Live Website
Visit my website live -> https://placement-portal-application-v2-b004.onrender.com

## Features

### Admin (Placement Cell)
- View dashboard statistics: total students, approved companies, active drives, pending approvals
- Approve, reject, blacklist, or reinstate company registrations
- Blacklist or reinstate student accounts
- View all placement drives and applications across the platform
- Mark drives as completed
- Access student resume PDFs

### Company (Recruiter)
- Register and await admin approval
- Post placement drives with eligibility criteria (CGPA, branch, year)
- View and manage applicants per drive
- Update individual or bulk application statuses (applied, shortlisted, selected, rejected)
- Cancel or mark drives as completed
- View student resumes

### Student (Applicant)
- Register, log in, and maintain a profile (branch, CGPA, skills, resume)
- Browse approved companies and open drives
- Apply to eligible drives and track application history
- View application status updates in real time

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Flask (application factory pattern) |
| Database ORM | Flask-SQLAlchemy |
| Authentication | Flask-Security-Too (token-based) |
| Password Hashing | bcrypt |
| Caching | Flask-Caching + Redis |
| Background Tasks | Celery + Redis |
| Email | Flask-Mail |
| API Design | OpenAPI 3.0 (api.yaml) |
| CORS | Flask-Cors |

---

## Project Structure

```
placement-portal-application-v2/
├── app.py                  # Application factory, blueprint registration, DB seed
├── models.py               # SQLAlchemy models (User, Role, Student, Company, Drive, Application)
├── config.py               # App configuration
├── extensions.py           # Shared extensions (mail, cache, celery)
├── tasks.py                # Celery task definitions
├── celery_worker.py        # Celery worker entry point
├── celerybeat-schedule     # Celery beat periodic task schedule
├── api.yaml                # Full OpenAPI 3.0 specification
├── routes/
│   ├── auth.py             # /api/auth — registration, login, logout
│   ├── admin.py            # /api/admin — admin management
│   ├── company.py          # /api/company — recruiter endpoints
│   └── student.py          # /api/student — student endpoints
├── templates/              # Jinja2 HTML templates
├── static/                 # CSS, JS, assets
└── requirements.txt
```

---

## API Overview

All endpoints are prefixed under `/api`. Authentication uses a token returned on login, passed as the `Authentication-Token` header.

| Prefix | Role | Description |
|---|---|---|
| `/api/auth` | All | Register, login, logout |
| `/api/admin` | Admin only | Manage users, companies, drives |
| `/api/company` | Company | Post drives, review applicants |
| `/api/student` | Student | Browse companies, apply to drives |

Full API documentation is available in [`api.yaml`](./api.yaml) (OpenAPI 3.0 format). Import it into [Swagger Editor](https://editor.swagger.io) or Postman for interactive docs.

---

## Getting Started

### Prerequisites

- Python 3.8 or above
- Redis (must be running locally for caching and Celery)

**Install Redis on Linux:**
```bash
sudo apt install redis   # Debian/Ubuntu
sudo pacman -S redis     # Arch Linux
sudo systemctl start redis
```

### Installation

```bash
# Clone the repository
git clone https://github.com/23f1000655/placement-portal-application-v2.git
cd placement-portal-application-v2

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Setup

Create a `.env` file in the project root:

```env
SECRET_KEY=your_secret_key
SQLALCHEMY_DATABASE_URI=sqlite:///hiresphere.db
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
CELERY_BROKER_URL=redis://localhost:6379/0
CACHE_REDIS_URL=redis://localhost:6379/1
```

### Running the App

**Terminal 1 — Flask server:**
```bash
python app.py
```

**Terminal 2 — Celery worker (for background tasks):**
```bash
python celery_worker.py
```

**Terminal 3 — Celery beat (for scheduled tasks):**
```bash
celery -A celery_worker.celery beat --loglevel=info
```

Open your browser and go to `http://127.0.0.1:5000`

---

## Default Admin Login

| Field | Value |
|---|---|
| Email | `admin@hiresphere.com` |
| Password | `Admin@123` |

The admin account is seeded automatically on first startup. No manual setup needed.

---

## Caching

Redis caching is applied on frequently accessed read endpoints with the following TTLs:

| Endpoint | Cache Duration |
|---|---|
| Admin dashboard stats | 5 minutes |
| Company list | 5 minutes |
| Student list | 5 minutes |
| Active drives | 5 minutes |
| All applications | 3 minutes |
| Pending companies | 2 minutes |
| Company-specific drives | 3 minutes |

Cache is automatically invalidated when relevant data changes (approvals, blacklisting, drive updates).

---

## Background Tasks

Celery handles scheduled and async jobs such as:
- Automated email notifications to students and companies
- Periodic report generation
- Scheduled drive status updates

Tasks are defined in `tasks.py` and scheduled via `celerybeat-schedule`.

---

## Course Context

This project was built as part of the **MAD 2 (Modern Application Development 2)** course at **IIT Madras BS in Data Science and Applications**.

---

## License

This project is for academic purposes. Not licensed for commercial use.
