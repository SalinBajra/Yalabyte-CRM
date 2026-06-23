import json
import os
import re
import smtplib
import urllib.error
import urllib.request
from datetime import datetime, timezone
from email.message import EmailMessage
from http.server import BaseHTTPRequestHandler


EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _env(name, default=""):
    return os.environ.get(name, default).strip()


def _format_submission(payload, received_at):
    company = payload.get("company") or "Not provided"
    phone = payload.get("phone") or "Not provided"
    return "\n".join(
        [
            "New YalaByte project inquiry",
            "",
            f"Name: {payload['name']}",
            f"Email: {payload['email']}",
            f"Contact number: {phone}",
            f"Company: {company}",
            f"Service: {payload['service']}",
            f"Received: {received_at}",
            "",
            "Message:",
            payload["message"],
        ]
    )


def _send_email(payload, received_at):
    smtp_host = _env("SMTP_HOST", "smtppro.zoho.com")
    smtp_port = int(_env("SMTP_PORT", "465"))
    smtp_secure = _env("SMTP_SECURE", "true").lower() in {"1", "true", "yes", "ssl"}
    smtp_user = _env("SMTP_USER")
    smtp_password = _env("SMTP_PASSWORD") or _env("SMTP_PASS")
    contact_to = _env("CONTACT_TO") or _env("CONTACT_RECEIVER") or "info@yalabyte.com"

    if not smtp_user or not smtp_password:
        return False

    message = EmailMessage()
    message["Subject"] = f"New YalaByte inquiry: {payload['service']}"
    message["From"] = smtp_user
    message["To"] = contact_to
    message["Reply-To"] = payload["email"]
    message.set_content(_format_submission(payload, received_at))

    smtp_hosts = [smtp_host]
    for fallback_host in ("smtp.zoho.com", "smtppro.zoho.com"):
        if fallback_host not in smtp_hosts:
            smtp_hosts.append(fallback_host)

    last_error = None
    for host in smtp_hosts:
        try:
            if smtp_port == 465 or smtp_secure:
                with smtplib.SMTP_SSL(host, smtp_port, timeout=15) as smtp:
                    smtp.login(smtp_user, smtp_password)
                    smtp.send_message(message)
            else:
                with smtplib.SMTP(host, smtp_port, timeout=15) as smtp:
                    smtp.starttls()
                    smtp.login(smtp_user, smtp_password)
                    smtp.send_message(message)
            return True
        except (OSError, smtplib.SMTPException) as error:
            last_error = error

    if last_error:
        raise last_error

    return True


def _email_configured():
    return bool(_env("SMTP_USER") and (_env("SMTP_PASSWORD") or _env("SMTP_PASS")))


def _strict_email_errors():
    return _env("EMAIL_STRICT", "false").lower() in {"1", "true", "yes"}


def _send_cliq(payload, received_at):
    webhook_url = _env("CLIQ_WEBHOOK_URL") or _env("ZOHO_CLIQ_WEBHOOK_URL")
    if not webhook_url:
        return False

    text = (
        "New YalaByte project inquiry\n\n"
        f"**Name:** {payload['name']}\n"
        f"**Email:** {payload['email']}\n"
        f"**Contact number:** {payload.get('phone') or 'Not provided'}\n"
        f"**Company:** {payload.get('company') or 'Not provided'}\n"
        f"**Service:** {payload['service']}\n"
        f"**Received:** {received_at}\n\n"
        f"**Message:**\n{payload['message']}"
    )

    request = urllib.request.Request(
        webhook_url,
        data=json.dumps(
            {
                "name": payload["name"],
                "email": payload["email"],
                "phone": payload.get("phone") or "",
                "company": payload.get("company") or "",
                "service": payload["service"],
                "message": payload["message"],
                "received_at": received_at,
                "text": text,
            }
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=15):
        pass

    return True


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", "0"))

        try:
            raw_body = self.rfile.read(content_length).decode("utf-8")
            payload = json.loads(raw_body or "{}")
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json(400, {"detail": "Invalid request body."})
            return

        normalized_payload = {
            "name": str(payload.get("name", "")).strip(),
            "email": str(payload.get("email", "")).strip(),
            "phone": str(payload.get("phone", "")).strip(),
            "company": str(payload.get("company", "")).strip(),
            "service": str(payload.get("service", "")).strip(),
            "message": str(payload.get("message", "")).strip(),
        }

        name = normalized_payload["name"]
        email = normalized_payload["email"]
        service = normalized_payload["service"]
        message = normalized_payload["message"]

        if not name or not email or not service or not message:
            self._send_json(400, {"detail": "Please complete your name, email, service, and message."})
            return

        if not EMAIL_PATTERN.match(email):
            self._send_json(400, {"detail": "Please enter a valid email address."})
            return

        if len(message) < 20:
            self._send_json(400, {"detail": "Please share a little more context so we can respond properly."})
            return

        received_at = datetime.now(timezone.utc).isoformat()

        print(
            json.dumps(
                {
                    "event": "contact_submission_received",
                    "name": name,
                    "email": email,
                    "phone": normalized_payload["phone"],
                    "company": normalized_payload["company"],
                    "service": service,
                    "received_at": received_at,
                }
            )
        )

        delivered = []
        delivery_errors = []

        try:
            if _send_cliq(normalized_payload, received_at):
                delivered.append("cliq")
        except (OSError, urllib.error.URLError) as error:
            delivery_errors.append(f"cliq: {error}")

        try:
            if _send_email(normalized_payload, received_at):
                delivered.append("email")
        except (OSError, smtplib.SMTPException) as error:
            delivery_errors.append(f"email: {error}")

        if not delivered:
            email_was_configured = _email_configured()
            print(
                json.dumps(
                    {
                        "event": "contact_submission_logged_without_notification",
                        "errors": delivery_errors or ["No notification channel configured."],
                        "submission": {
                            "name": name,
                            "email": email,
                            "phone": normalized_payload["phone"],
                            "company": normalized_payload["company"],
                            "service": service,
                            "message": message,
                        },
                        "received_at": received_at,
                    }
                )
            )
            if email_was_configured and _strict_email_errors():
                self._send_json(
                    502,
                    {
                        "detail": "Your inquiry was received, but email delivery is still being configured. Please email info@yalabyte.com directly if this is urgent.",
                        "errors": delivery_errors,
                    },
                )
                return

            self._send_json(
                200,
                {
                    "message": "Thank you. Your project inquiry has been received and YalaByte will follow up soon.",
                    "notification_status": "logged",
                    "received_at": received_at,
                    "lead": {
                        "name": name,
                        "email": email,
                        "phone": normalized_payload["phone"],
                        "company": normalized_payload["company"],
                        "service": service,
                        "source": "Website form",
                        "status": "new",
                        "message": message,
                        "received_at": received_at,
                    },
                },
            )
            return

        self._send_json(
            200,
            {
                "message": "Thank you. Your project inquiry has been received and YalaByte will follow up soon.",
                "received_at": received_at,
                "lead": {
                    "name": name,
                    "email": email,
                    "phone": normalized_payload["phone"],
                    "company": normalized_payload["company"],
                    "service": service,
                    "source": "Website form",
                    "status": "new",
                    "message": message,
                    "received_at": received_at,
                },
            },
        )
