"""
tasks.py
~~~~~~~~
All Celery background tasks for HireSphere.

Tasks
-----
a. send_deadline_reminders   – daily at 08:00, emails students about drives
                               whose application deadline is within the next
                               3 days.

b. send_monthly_report       – 1st of every month at 07:00, emails the admin
                               an HTML report of placement activity for the
                               previous calendar month.

c. export_applications_csv   – triggered by a student from the dashboard;
                               builds a CSV of their application history and
                               emails it to them as an attachment.
"""

import csv
import io
import os
from datetime import date, datetime, timedelta

from flask import current_app, render_template_string
from flask_mail import Message

from extensions import celery, mail
from models import Application, PlacementDrive, Student, User


# ══════════════════════════════════════════════════════════════════════════════
#  HELPER — send a single email
# ══════════════════════════════════════════════════════════════════════════════

def _send_email(subject: str, recipients: list, html_body: str,
                attachments: list = None):
    """
    Thin wrapper around Flask-Mail so individual tasks stay readable.
    `attachments` is a list of (filename, mimetype, data_bytes) tuples.
    """
    msg = Message(subject=subject, recipients=recipients)
    msg.html = html_body
    if attachments:
        for filename, mimetype, data in attachments:
            msg.attach(filename, mimetype, data)
    mail.send(msg)


# ══════════════════════════════════════════════════════════════════════════════
#  a.  DAILY DEADLINE REMINDERS
# ══════════════════════════════════════════════════════════════════════════════

@celery.task(name="tasks.send_deadline_reminders")
def send_deadline_reminders():
    """
    Runs every day at 08:00.
    Finds all approved drives whose application_deadline falls within the
    next 3 days, then emails every eligible student who has NOT yet applied.
    """
    today      = date.today()
    in_3_days  = today + timedelta(days=3)

    # Collect drives with a deadline in [today, today+3]
    all_active_drives = PlacementDrive.query.filter_by(status="approved").all()
    upcoming_drives   = []
    for drive in all_active_drives:
        if not drive.application_deadline:
            continue
        try:
            deadline = datetime.strptime(drive.application_deadline, "%Y-%m-%d").date()
        except ValueError:
            continue
        if today <= deadline <= in_3_days:
            upcoming_drives.append((drive, deadline))

    if not upcoming_drives:
        print("[daily-reminders] No upcoming deadlines in the next 3 days.")
        return

    # For each such drive, email students who haven't applied yet
    all_students = Student.query.all()
    sent_count   = 0

    for student in all_students:
        # Skip blacklisted / inactive students
        if not student.user or student.user.is_blacklisted or not student.user.active:
            continue

        already_applied_ids = {
            app.drive_id for app in
            Application.query.filter_by(student_id=student.id).all()
        }

        drives_to_remind = [
            (d, dl) for d, dl in upcoming_drives
            if d.id not in already_applied_ids
        ]

        if not drives_to_remind:
            continue

        # Build drive rows for the email
        drive_rows_html = ""
        for drive, deadline in drives_to_remind:
            days_left = (deadline - today).days
            urgency   = "🔴" if days_left == 0 else ("🟠" if days_left == 1 else "🟡")
            drive_rows_html += f"""
            <tr>
              <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;">
                <strong>{drive.drive_name}</strong><br>
                <span style="color:#6b7280; font-size:0.85em;">
                  {drive.company.company_name if drive.company else '—'}
                </span>
              </td>
              <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;">
                {drive.job_title}
              </td>
              <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:center;">
                {urgency} {deadline.strftime('%d %b %Y')}
                <br><small style="color:#ef4444;">
                  {'Today!' if days_left == 0 else f'{days_left} day(s) left'}
                </small>
              </td>
            </tr>"""

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0; padding:0; background:#f4f6fb;
                     font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:600px; margin:32px auto; background:#fff;
                      border-radius:16px; overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1a3c6e,#2563eb);
                        padding:32px 32px 24px; color:#fff;">
              <div style="font-size:1.6rem; font-weight:800; letter-spacing:-0.5px;">
                🔷 Hire<span style="color:#f97316;">Sphere</span>
              </div>
              <h2 style="margin:16px 0 4px; font-size:1.4rem;">
                ⏰ Application Deadline Reminder
              </h2>
              <p style="margin:0; opacity:0.8; font-size:0.9rem;">
                Hi {student.full_name}, don't miss these upcoming deadlines!
              </p>
            </div>
            <!-- Body -->
            <div style="padding:28px 32px;">
              <p style="color:#374151; line-height:1.6;">
                The following placement drives have deadlines approaching.
                Log in to HireSphere and apply before it's too late!
              </p>
              <table style="width:100%; border-collapse:collapse;
                            border:1px solid #e2e8f0; border-radius:10px;
                            overflow:hidden; margin-top:16px;">
                <thead>
                  <tr style="background:#eff6ff;">
                    <th style="padding:10px 12px; text-align:left;
                               font-size:0.78rem; text-transform:uppercase;
                               letter-spacing:0.5px; color:#1d4ed8;">Drive</th>
                    <th style="padding:10px 12px; text-align:left;
                               font-size:0.78rem; text-transform:uppercase;
                               letter-spacing:0.5px; color:#1d4ed8;">Role</th>
                    <th style="padding:10px 12px; text-align:center;
                               font-size:0.78rem; text-transform:uppercase;
                               letter-spacing:0.5px; color:#1d4ed8;">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {drive_rows_html}
                </tbody>
              </table>
              <div style="margin-top:28px; text-align:center;">
                <a href="http://localhost:5000/#/student/dashboard"
                   style="background:#2563eb; color:#fff; font-weight:700;
                          padding:12px 32px; border-radius:8px;
                          text-decoration:none; display:inline-block;">
                  Go to Dashboard →
                </a>
              </div>
            </div>
            <!-- Footer -->
            <div style="background:#f8fafc; padding:20px 32px;
                        text-align:center; color:#9ca3af; font-size:0.8rem;
                        border-top:1px solid #e2e8f0;">
              © 2025 HireSphere · Smart Campus Recruitment, Simplified.
            </div>
          </div>
        </body>
        </html>"""

        try:
            _send_email(
                subject    = f"⏰ HireSphere: {len(drives_to_remind)} drive deadline(s) approaching!",
                recipients = [student.user.email],
                html_body  = html_body
            )
            sent_count += 1
        except Exception as exc:
            print(f"[daily-reminders] Failed to email {student.user.email}: {exc}")

    print(f"[daily-reminders] Sent reminders to {sent_count} student(s).")


# ══════════════════════════════════════════════════════════════════════════════
#  b.  MONTHLY ACTIVITY REPORT  (admin)
# ══════════════════════════════════════════════════════════════════════════════

@celery.task(name="tasks.send_monthly_report")
def send_monthly_report(current_month=False):
    today = date.today()
    if current_month:
        # Report from 1st of current month up to today
        month_start = today.replace(day=1)
        month_end   = today
    else:
        # Default — report on the previous full calendar month
        first_this     = today.replace(day=1)
        last_month_end = first_this - timedelta(days=1)
        month_start    = last_month_end.replace(day=1)
        month_end      = last_month_end

    month_label = month_start.strftime("%B %Y")   # e.g. "May 2025"

    # ── Drives conducted that month ───────────────────────────────────────────
    all_drives   = PlacementDrive.query.all()
    month_drives = [
        d for d in all_drives
        if d.created_on and month_start <= d.created_on.date() <= month_end
    ]
    num_drives      = len(month_drives)
    completed_count = sum(1 for d in month_drives if d.status == "completed")
    approved_count  = sum(1 for d in month_drives if d.status == "approved")
    cancelled_count = sum(1 for d in month_drives if d.status == "cancelled")

    # ── Applications ─────────────────────────────────────────────────────────
    all_apps   = Application.query.all()
    month_apps = [
        a for a in all_apps
        if a.applied_on and month_start <= a.applied_on.date() <= month_end
    ]
    num_applied   = len(month_apps)
    num_selected  = sum(1 for a in month_apps if a.status == "selected")
    num_shortlist = sum(1 for a in month_apps if a.status == "shortlisted")
    num_rejected  = sum(1 for a in month_apps if a.status == "rejected")

    # ── Unique students who applied ───────────────────────────────────────────
    unique_students = len({a.student_id for a in month_apps})

    # ── Per-drive breakdown table ─────────────────────────────────────────────
    drive_rows_html = ""
    for drive in month_drives:
        drive_apps     = [a for a in month_apps if a.drive_id == drive.id]
        d_applied      = len(drive_apps)
        d_selected     = sum(1 for a in drive_apps if a.status == "selected")
        company_name   = drive.company.company_name if drive.company else "—"
        status_badge   = {
            "approved":  "#dcfce7|#15803d",
            "completed": "#dbeafe|#1d4ed8",
            "cancelled": "#fee2e2|#b91c1c",
            "pending":   "#fef9c3|#a16207",
        }.get(drive.status, "#f1f5f9|#374151")
        bg, fg         = status_badge.split("|")
        drive_rows_html += f"""
        <tr>
          <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;">
            <strong>{drive.drive_name}</strong></td>
          <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;">
            {company_name}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;
                     text-align:center;">{d_applied}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;
                     text-align:center;">{d_selected}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;
                     text-align:center;">
            <span style="background:{bg}; color:{fg}; padding:3px 10px;
                         border-radius:50px; font-size:0.75rem;
                         font-weight:600;">{drive.status}</span>
          </td>
        </tr>"""

    if not drive_rows_html:
        drive_rows_html = """
        <tr>
          <td colspan="5" style="padding:20px; text-align:center;
                                 color:#9ca3af;">
            No drives recorded this month.
          </td>
        </tr>"""

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background:#f4f6fb;
                 font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:700px; margin:32px auto; background:#fff;
                  border-radius:16px; overflow:hidden;
                  box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a3c6e,#2563eb);
                    padding:36px 36px 28px; color:#fff;">
          <div style="font-size:1.6rem; font-weight:800; letter-spacing:-0.5px;">
            🔷 Hire<span style="color:#f97316;">Sphere</span>
          </div>
          <h2 style="margin:16px 0 4px; font-size:1.5rem;">
            📊 Monthly Placement Activity Report
          </h2>
          <p style="margin:0; opacity:0.8; font-size:0.95rem;">{month_label}</p>
        </div>

        <!-- Summary cards -->
        <div style="padding:32px 36px 0;">
          <h3 style="color:#1a3c6e; margin:0 0 20px;
                     font-size:1.1rem; text-transform:uppercase;
                     letter-spacing:0.5px;">📌 Summary</h3>
          <table style="width:100%; border-collapse:separate;
                        border-spacing:12px;">
            <tr>
              <td style="background:#eff6ff; border-radius:12px;
                         padding:20px; text-align:center; width:25%;">
                <div style="font-size:2rem; font-weight:800;
                             color:#1d4ed8;">{num_drives}</div>
                <div style="font-size:0.8rem; color:#6b7280;
                             margin-top:4px;">Drives Created</div>
              </td>
              <td style="background:#f0fdf4; border-radius:12px;
                         padding:20px; text-align:center; width:25%;">
                <div style="font-size:2rem; font-weight:800;
                             color:#15803d;">{unique_students}</div>
                <div style="font-size:0.8rem; color:#6b7280;
                             margin-top:4px;">Students Applied</div>
              </td>
              <td style="background:#fef9c3; border-radius:12px;
                         padding:20px; text-align:center; width:25%;">
                <div style="font-size:2rem; font-weight:800;
                             color:#a16207;">{num_applied}</div>
                <div style="font-size:0.8rem; color:#6b7280;
                             margin-top:4px;">Total Applications</div>
              </td>
              <td style="background:#dcfce7; border-radius:12px;
                         padding:20px; text-align:center; width:25%;">
                <div style="font-size:2rem; font-weight:800;
                             color:#15803d;">{num_selected}</div>
                <div style="font-size:0.8rem; color:#6b7280;
                             margin-top:4px;">Students Selected</div>
              </td>
            </tr>
          </table>

          <!-- Application status breakdown -->
          <div style="margin:28px 0 0; padding:20px;
                      background:#f8fafc; border-radius:12px;
                      border:1px solid #e2e8f0;">
            <h4 style="margin:0 0 14px; color:#374151;
                       font-size:0.95rem;">Application Status Breakdown</h4>
            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0; color:#6b7280; font-size:0.9rem;">
                  📥 Applied</td>
                <td style="padding:6px 0; font-weight:700;
                           text-align:right;">{num_applied}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#6b7280; font-size:0.9rem;">
                  ✅ Selected / Hired</td>
                <td style="padding:6px 0; font-weight:700;
                           color:#15803d; text-align:right;">{num_selected}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#6b7280; font-size:0.9rem;">
                  🔍 Shortlisted</td>
                <td style="padding:6px 0; font-weight:700;
                           color:#a16207; text-align:right;">{num_shortlist}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#6b7280; font-size:0.9rem;">
                  ❌ Rejected</td>
                <td style="padding:6px 0; font-weight:700;
                           color:#b91c1c; text-align:right;">{num_rejected}</td>
              </tr>
            </table>
          </div>

          <!-- Drive status breakdown -->
          <div style="margin:16px 0; padding:20px;
                      background:#f8fafc; border-radius:12px;
                      border:1px solid #e2e8f0;">
            <h4 style="margin:0 0 14px; color:#374151;
                       font-size:0.95rem;">Drives Status Breakdown</h4>
            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0; color:#6b7280; font-size:0.9rem;">
                  🟢 Approved / Active</td>
                <td style="padding:6px 0; font-weight:700;
                           text-align:right;">{approved_count}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#6b7280; font-size:0.9rem;">
                  🏁 Completed</td>
                <td style="padding:6px 0; font-weight:700;
                           text-align:right;">{completed_count}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#6b7280; font-size:0.9rem;">
                  🚫 Cancelled</td>
                <td style="padding:6px 0; font-weight:700;
                           text-align:right;">{cancelled_count}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Per-drive table -->
        <div style="padding:0 36px 32px;">
          <h3 style="color:#1a3c6e; margin:28px 0 16px;
                     font-size:1.1rem; text-transform:uppercase;
                     letter-spacing:0.5px;">📋 Drive-wise Breakdown</h3>
          <table style="width:100%; border-collapse:collapse;
                        border:1px solid #e2e8f0; border-radius:10px;
                        overflow:hidden;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:10px 12px; text-align:left;
                           font-size:0.78rem; text-transform:uppercase;
                           letter-spacing:0.5px; color:#374151;">Drive</th>
                <th style="padding:10px 12px; text-align:left;
                           font-size:0.78rem; text-transform:uppercase;
                           letter-spacing:0.5px; color:#374151;">Company</th>
                <th style="padding:10px 12px; text-align:center;
                           font-size:0.78rem; text-transform:uppercase;
                           letter-spacing:0.5px; color:#374151;">Applied</th>
                <th style="padding:10px 12px; text-align:center;
                           font-size:0.78rem; text-transform:uppercase;
                           letter-spacing:0.5px; color:#374151;">Selected</th>
                <th style="padding:10px 12px; text-align:center;
                           font-size:0.78rem; text-transform:uppercase;
                           letter-spacing:0.5px; color:#374151;">Status</th>
              </tr>
            </thead>
            <tbody>
              {drive_rows_html}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc; padding:20px 36px;
                    text-align:center; color:#9ca3af; font-size:0.8rem;
                    border-top:1px solid #e2e8f0;">
          This is an automated report generated by HireSphere on
          {today.strftime('%d %B %Y')}.<br>
          © 2025 HireSphere · Smart Campus Recruitment, Simplified.
        </div>
      </div>
    </body>
    </html>"""

    admin_email = current_app.config.get("ADMIN_EMAIL", "admin@hiresphere.com")
    try:
        _send_email(
            subject    = f"📊 HireSphere Monthly Report — {month_label}",
            recipients = [admin_email],
            html_body  = html_body
        )
        print(f"[monthly-report] Report for {month_label} sent to {admin_email}.")
    except Exception as exc:
        print(f"[monthly-report] Failed to send report: {exc}")


# ══════════════════════════════════════════════════════════════════════════════
#  c.  USER-TRIGGERED ASYNC — Export Applications as CSV
# ══════════════════════════════════════════════════════════════════════════════

@celery.task(name="tasks.export_applications_csv", bind=True)
def export_applications_csv(self, student_id: int):
    """
    Triggered from the student dashboard.
    Builds a CSV of the student's full application history and emails it
    to the student as an attachment.
    """
    student = Student.query.get(student_id)
    if not student:
        print(f"[csv-export] Student {student_id} not found.")
        return

    applications = Application.query.filter_by(
        student_id=student_id
    ).order_by(Application.applied_on.desc()).all()

    # ── Build CSV in memory ───────────────────────────────────────────────────
    output    = io.StringIO()
    writer    = csv.writer(output)
    writer.writerow([
        "Application ID",
        "Student ID",
        "Student Name",
        "Company Name",
        "Drive Title",
        "Job Title",
        "Application Status",
        "Applied On",
        "Interview Date",
        "Drive Date",
        "Location",
        "Salary / Package",
    ])

    for app in applications:
        drive   = app.drive
        company = drive.company if drive else None
        writer.writerow([
            app.id,
            student.id,
            student.full_name,
            company.company_name if company else "—",
            drive.drive_name     if drive   else "—",
            drive.job_title      if drive   else "—",
            app.status,
            app.applied_on.strftime("%Y-%m-%d %H:%M") if app.applied_on else "—",
            app.interview_date or "—",
            drive.drive_date             if drive else "—",
            drive.location               if drive else "—",
            drive.salary                 if drive else "—",
        ])

    csv_bytes = output.getvalue().encode("utf-8")
    filename  = f"hiresphere_applications_{student.id}_{date.today().isoformat()}.csv"

    # ── Email the CSV ─────────────────────────────────────────────────────────
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background:#f4f6fb;
                 font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:560px; margin:32px auto; background:#fff;
                  border-radius:16px; overflow:hidden;
                  box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#0f2942,#0d9488);
                    padding:32px; color:#fff;">
          <div style="font-size:1.6rem; font-weight:800;">
            🔷 Hire<span style="color:#f97316;">Sphere</span>
          </div>
          <h2 style="margin:16px 0 4px; font-size:1.3rem;">
            📥 Your Application History Export
          </h2>
          <p style="margin:0; opacity:0.8; font-size:0.9rem;">
            Hi {student.full_name}, your CSV export is ready!
          </p>
        </div>
        <div style="padding:28px 32px;">
          <p style="color:#374151; line-height:1.6;">
            Your placement application history has been exported as a CSV file.
            Please find it attached to this email.
          </p>
          <div style="background:#f0fdfa; border:1.5px solid #ccfbf1;
                      border-radius:10px; padding:16px 20px; margin:20px 0;">
            <p style="margin:0; color:#0d9488; font-weight:700; font-size:0.9rem;">
              📄 {filename}
            </p>
            <p style="margin:6px 0 0; color:#6b7280; font-size:0.85rem;">
              {len(applications)} application record(s) exported
            </p>
          </div>
          <p style="color:#9ca3af; font-size:0.82rem; margin-top:20px;">
            This export was triggered from your HireSphere student dashboard.
          </p>
        </div>
        <div style="background:#f8fafc; padding:18px 32px;
                    text-align:center; color:#9ca3af; font-size:0.8rem;
                    border-top:1px solid #e2e8f0;">
          © 2025 HireSphere · Smart Campus Recruitment, Simplified.
        </div>
      </div>
    </body>
    </html>"""

    try:
        _send_email(
            subject    = "📥 HireSphere: Your Application History CSV is Ready",
            recipients = [student.user.email],
            html_body  = html_body,
            attachments= [(filename, "text/csv", csv_bytes)]
        )
        print(f"[csv-export] CSV sent to {student.user.email}.")
    except Exception as exc:
        print(f"[csv-export] Failed to email CSV to {student.user.email}: {exc}")
        raise self.retry(exc=exc, countdown=60, max_retries=3)