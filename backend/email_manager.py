import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv
from typing import List

load_dotenv(dotenv_path="../.env")

# --- NEW: Email Configuration ---
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True").lower() == "true",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False").lower() == "true",
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

fm = FastMail(conf)

async def send_password_reset_email(recipient_email: str, token: str):
    """
    Sends an email with the password reset link.
    """
    frontend_url = os.getenv("FRONTEND_URL")
    if not frontend_url:
        raise ValueError("FRONTEND_URL environment variable is not set.")

    reset_link = f"{frontend_url}/reset-password?token={token}"

    html_content = f"""
    <html>
    <body>
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your RateMyGradPix account.</p>
        <p>Please click the link below to set a new password. This link is valid for 30 minutes.</p>
        <a href="{reset_link}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #007bff; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you did not request a password reset, please ignore this email.</p>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="Password Reset for Your Account",
        recipients=[recipient_email],
        body=html_content,
        subtype="html"
    )

    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"Failed to send email: {e}")
        # In a real app, you might want more robust error handling/logging here