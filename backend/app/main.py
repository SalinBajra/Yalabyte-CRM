import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field


class ContactSubmission(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=40)
    company: Optional[str] = Field(default=None, max_length=120)
    service: str = Field(..., min_length=2, max_length=80)
    message: str = Field(..., min_length=20, max_length=2000)


app = FastAPI(
    title="YalaByte API",
    description="Backend API for YalaByte website contact submissions. Project inquiries route to info@yalabyte.com.",
    version="1.0.0",
)

contact_email = os.getenv("CONTACT_EMAIL", "info@yalabyte.com")

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "YalaByte API"}


@app.post("/api/contact")
def receive_contact_submission(submission: ContactSubmission):
    received_at = datetime.now(timezone.utc).isoformat()

    # Replace this with email, CRM, database, or queue integration for production.
    print(
        {
            "event": "contact_submission_received",
            "service": submission.service,
            "email": submission.email,
            "phone": submission.phone,
            "contact_email": contact_email,
            "received_at": received_at,
        }
    )

    return {
        "message": "Thank you. Your project inquiry has been received and YalaByte will follow up soon.",
        "received_at": received_at,
        "lead": {
            "name": submission.name,
            "email": submission.email,
            "phone": submission.phone or "",
            "company": submission.company or "",
            "service": submission.service,
            "source": "Website form",
            "status": "new",
            "message": submission.message,
            "received_at": received_at,
        },
    }
