import frappe
from frappe import _
from frappe.auth import LoginManager
from frappe.utils.password import set_encrypted_password, get_decrypted_password
import random
import time
import secrets
import re
from frappe.utils.password import set_encrypted_password
from frappe.utils import now_datetime
from frappe.utils.data import add_to_date
import hashlib
from frappe.utils import get_datetime
import base64
import os
import uuid
import json

@frappe.whitelist()
def get_pro_dra(project, fields="building_name"):
    # fields="building_name,floor_name"
    field_list = [f.strip() for f in fields.split(",") if f.strip()]

    return frappe.get_all(
        "Project Drawing",
        filters={
            "parent": project
        },
        fields=field_list
    )

@frappe.whitelist()
def delete_pour_card(name):
    frappe.delete_doc("Pour Card", name, force=True)
    return {
        "status": "deleted",
        "name": name
    }

@frappe.whitelist()
def get_building_floors():
    return frappe.get_all(
        "Building Floor",
        fields=["name", "building_name","floor_name"],
        ignore_permissions=True
    )

@frappe.whitelist()
def get_structure_type():
    return frappe.get_all(
        "Structure Type",
        fields=["name", "structuremember_type"],
        ignore_permissions=True
    )

@frappe.whitelist()
def get_drawing_detail():
    return frappe.get_all(
        "Drawing Detail",
        fields=["name", "project", "drawing_number", "building_name", "floor_name", "drawing"],
        ignore_permissions=True
    )

@frappe.whitelist()
def get_bbs_shape():
    return frappe.get_all(
        "BBS Shape",
        fields=["name","report_no","shape_code","description","shape_path","a","b","c","d","e","f","g","h","dia","nom","npm","cutting_length","total_length","snapshot"],
        ignore_permissions=True
    )

@frappe.whitelist()
def get_mbook_form_work():
    return frappe.get_all(
        "M-Book Form Work",
        fields=["name","report_no","boq_no","description","level","reference","unit","npm","nom","length","breadth","depth","remarks","snapshot"],
        ignore_permissions=True
    )

@frappe.whitelist()
def get_mbook_concrete_work():
    return frappe.get_all(
        "M-Book Concrete Work",
        fields=["name","report_no","boq_no","description","level","reference","unit","npm","nom","length","breadth","depth","remarks","snapshot"],
        ignore_permissions=True
    )

@frappe.whitelist()
def get_pour_card_report():
    return frappe.get_all(
        "Pour Card Report",
        fields=["name","report_no","value_surveylayout","verified_surveylayout","remarks_surveylayout","value_formwork","verified_formwork","remarks_formwork","value_reinforcement","verified_reinforcement","remarks_reinforcement","value_cover_blocks","verified_cover_blocks","remarks_cover_blocks","value_embedments","verified_embedments","remarks_embedments","value_sleeves_inserts","verified_sleeves_inserts","remarks_sleeves_inserts","value_cleanliness","verified_cleanliness","remarks_cleanliness","value_time_between_mixing_and_pouring","verified_time_between_mixing_and_pouring","remarks_time_between_mixing_and_pouring","value_weight_of_mix_ingredients","verified_weight_of_mix_ingredients","remarks_weight_of_mix_ingredients","value_wc_ratio","verified_wc_ratio","remarks_wc_ratio", "value_slump", "verified_slump","remarks_slump","value_concrete_temperature","verified_concrete_temperature","remarks_concrete_temperature","pour_start_time","pour_end_time","value_cube_sampling_details","verified_cube_sampling_details","remarks_cube_sampling_details","value_surface_finish","verified_surface_finish","remarks_surface_finish","value_honeycombing","verified_honeycombing","remarks_honeycombing","value_cold_joints","verified_cold_joints","remarks_cold_joints","value_curing_started","verified_curing_started","remarks_curing_started","value_curing_method","verified_curing_method","remarks_curing_method","value_overall_acceptance","verified_overall_acceptance","remarks_overall_acceptance"],
        ignore_permissions=True
    )


@frappe.whitelist()
def get_current_user(): 
    return {
        "user": frappe.session.user,
        "full_name": frappe.get_doc("User", frappe.session.user).full_name
    }


# ============================================================
# 1️⃣ MOBILE LOGIN — Verify credentials + Send verification link
# ============================================================
@frappe.whitelist(allow_guest=True)
def mobile_login(username):
    try:
        # 1️⃣ Check if user exists
        if not frappe.db.exists("User", {"name": username}):
            frappe.throw(_("No account found with this email."))

        user = frappe.get_doc("User", username)

        # 2️⃣ Generate API key if not exists
        if not user.api_key:
            user.api_key = frappe.generate_hash(length=15)
            user.save(ignore_permissions=True)

        # 3️⃣ Check api_secret existence
        api_secret_exists = frappe.db.exists(
            "__Auth",
            {
                "doctype": "User",
                "name": user.name,
                "fieldname": "api_secret"
            }
        )

        # 4️⃣ Create api_secret only if missing
        # if not api_secret_exists:
        #     api_secret = frappe.generate_hash(length=20)
        #     set_encrypted_password(
        #         doctype="User",
        #         name=user.name,
        #         pwd=api_secret,
        #         fieldname="api_secret"
        #     )
        # else:
        #     api_secret = get_decrypted_password(
        #         doctype="User",
        #         name=user.name,
        #         fieldname="api_secret",
        #         raise_exception=False
        #     )

        # 5️⃣ Generate token
        token = secrets.token_urlsafe(32)

        # 6️⃣ Store in cache
        frappe.cache().set_value(
            f"verify_token_{token}",
            {
                "username": user.name,
                "api_key": user.api_key,
                "api_secret": api_secret
            },
            expires_in_sec=7200
        )

        # 7️⃣ Update or create verification record
        existing = frappe.db.exists(
            "Mobile Login Verification",
            {"user_email": user.name}
        )

        if existing:
            try:
                doc = frappe.get_doc("Mobile Login Verification", existing)
                doc.api_key = user.api_key
                doc.verification_token = token
                doc.verification_status = 0
                doc.save(ignore_permissions=True)
            except Exception:
                # ✅ If old record is broken, delete and recreate
                frappe.delete_doc("Mobile Login Verification", existing, ignore_permissions=True)
                doc = frappe.get_doc({
                    "doctype": "Mobile Login Verification",
                    "user_email": user.name,
                    "api_key": user.api_key,
                    "verification_token": token,
                    "verification_status": 0
                })
                doc.insert(ignore_permissions=True)
        else:
            doc = frappe.get_doc({
                "doctype": "Mobile Login Verification",
                "user_email": user.name,
                "api_key": user.api_key,
                "verification_token": token,
                "verification_status": 0
            })
            doc.insert(ignore_permissions=True)
        frappe.db.commit()

        # 8️⃣ Send email with Set Password link only
        site_url = frappe.utils.get_url()
        set_password_link = f"{site_url}/set-new-password?token={token}"

        frappe.sendmail(
            recipients=[user.email],
            subject="Set Your Password - Login Request",
            message=f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Hello {user.full_name},</h2>
                    <p>We received a login request for your account.</p>
                    <p>Click the button below to set your new password and login:</p>

                    <a href="{set_password_link}" style="
                        background-color: #2196F3;
                        color: white;
                        padding: 14px 28px;
                        text-decoration: none;
                        border-radius: 6px;
                        display: inline-block;
                        font-size: 16px;
                        margin: 20px 0;
                    ">🔑 Set New Password & Login</a>

                    <p style="color: #666;">This link is valid for 2 hours and can only be used once.</p>
                    <p style="color: #666;">If you did not request this, please ignore this email.</p>
                </div>
            """,
            now=True 
        )

        return {
            "status": "success",
            "message": "A password setup link has been sent to your email.",
            "user": user.name,
            "full_name": user.full_name
        }

    except frappe.ValidationError:
        raise
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Mobile Login Error")
        frappe.throw(_("Something went wrong. Please contact admin."))


@frappe.whitelist(allow_guest=True)
def verify_email_token(token):
    try:
        # 1️⃣ Get cached data
        cached = frappe.cache().get_value(f"verify_token_{token}")

        if not cached:
            frappe.throw(_("Link expired or invalid. Please login again."))

        # 2️⃣ Delete cache (one time use)
        frappe.cache().delete_value(f"verify_token_{token}")

        # 3️⃣ Mark as verified FIRST before redirect
        record = frappe.db.get_value(
            "Mobile Login Verification",
            {"user_email": cached["username"]},
            "name"
        )

        if record:
            doc = frappe.get_doc("Mobile Login Verification", record)
            doc.verification_status = 1  # ✅ Checkbox checked
            doc.save(ignore_permissions=True)

        # 4️⃣ Commit to DB before redirect
        frappe.db.commit()

        # 5️⃣ Login user and redirect
        frappe.local.login_manager = frappe.auth.LoginManager()
        frappe.local.login_manager.login_as(cached["username"])
        frappe.local.response["type"] = "redirect"
        frappe.local.response["location"] = "/app"

    except Exception as e:
        if isinstance(e, frappe.ValidationError):
            raise
        frappe.log_error(frappe.get_traceback(), "Verify Email Token Error")
        frappe.throw(_("Something went wrong. Please contact admin"))


@frappe.whitelist(allow_guest=True)
def validate_password_token(token):
    try:
        cached = frappe.cache().get_value(f"verify_token_{token}")
        if not cached:
            frappe.throw(_("This link has expired or already been used. Please login again."))
        return {
            "status": "valid",
            "full_name": frappe.db.get_value("User", cached["username"], "full_name"),
            "username": cached["username"]  # ✅ added
        }
    except frappe.ValidationError:
        raise
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Validate Password Token Error")
        frappe.throw(_("Something went wrong. Please contact admin."))


@frappe.whitelist(allow_guest=True)
def set_new_password_via_token(token, new_password, confirm_password):
    """
    1. Validate token exists in cache
    2. Validate passwords match + meet strength requirements
    3. Update the user's password
    4. Mark email as verified
    5. Log the user in
    6. Delete token from cache (one-time use)
    """
    try:
        # ── 1. Fetch cached data ──────────────────────────────────────
        cached = frappe.cache().get_value(f"verify_token_{token}")

        if not cached:
            frappe.throw(_("This link has expired or already been used. Please login again."))

        username = cached["username"]

        # ── 2. Validate passwords ─────────────────────────────────────
        if new_password != confirm_password:
            frappe.throw(_("Passwords do not match. Please try again."))

        _validate_password_strength(new_password)  # See helper below

        # ── 3. Update password securely ───────────────────────────────
        # Frappe's built-in method handles hashing automatically
        from frappe.utils.password import update_password
        update_password(username, new_password)

        # ── 4. Mark email as verified ─────────────────────────────────
        record = frappe.db.get_value(
            "Mobile Login Verification",
            {"user_email": username},
            "name"
        )

        if record:
            doc = frappe.get_doc("Mobile Login Verification", record)
            doc.verification_status = 1
            doc.save(ignore_permissions=True)

        frappe.db.commit()

        # ── 5. Delete token AFTER all DB work (one-time use) ──────────
        frappe.cache().delete_value(f"verify_token_{token}")

        # ── 6. Log the user in ────────────────────────────────────────
        frappe.local.login_manager = frappe.auth.LoginManager()
        frappe.local.login_manager.login_as(username)

        return {
            "status": "success",
            "message": "Password updated successfully. Redirecting..."
        }

    except frappe.ValidationError:
        raise  # Re-raise user-facing validation errors as-is
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Set New Password Error")
        frappe.throw(_("Something went wrong. Please contact admin."))


def _validate_password_strength(password):
    """
    Helper — enforce basic password rules.
    Raises a clear, user-friendly error for each failure.
    """
    if len(password) < 8:
        frappe.throw(_("Password must be at least 8 characters long."))

    if not re.search(r"[A-Z]", password):
        frappe.throw(_("Password must contain at least one uppercase letter."))

    if not re.search(r"[a-z]", password):
        frappe.throw(_("Password must contain at least one lowercase letter."))

    if not re.search(r"\d", password):
        frappe.throw(_("Password must contain at least one number."))

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        frappe.throw(_("Password must contain at least one special character."))


# ============================================================
# AUTO SEND EMAIL WHEN NEW USER IS CREATED
# ============================================================
def on_user_create(doc, method):

    try:
        # Disable frappe default email
        doc.send_welcome_email = 0

        if doc.name in ["Administrator", "Guest"]:
            return

        if not doc.email:
            return

        # Generate API key
        # if not doc.api_key:
        #     doc.api_key = frappe.generate_hash(length=15)
        #     doc.save(ignore_permissions=True)

        token = secrets.token_urlsafe(32)

        frappe.cache().set_value(
            f"verify_token_{token}",
            {
                "username": doc.name,
                "api_key": doc.api_key,
                "api_secret": ""
            },
            expires_in_sec=3600
        )

        existing = frappe.db.exists(
            "Mobile Login Verification",
            {"user_email": doc.name}
        )

        if existing:
            verification_doc = frappe.get_doc("Mobile Login Verification", existing)
            verification_doc.api_key = doc.api_key
            verification_doc.verification_token = token
            verification_doc.verification_status = 0
            verification_doc.save(ignore_permissions=True)
        else:
            verification_doc = frappe.get_doc({
                "doctype": "Mobile Login Verification",
                "user_email": doc.name,
                "api_key": doc.api_key,
                "verification_token": token,
                "verification_status": 0
            })
            verification_doc.insert(ignore_permissions=True)

        frappe.db.commit()

        site_url = frappe.utils.get_url()

        link = f"{site_url}/set-new-password?token={token}"

        frappe.sendmail(
            recipients=[doc.email],
            subject="Account Activation Required",
            message=f"""
            Dear {doc.full_name},

            Your user account has been created successfully.

            Please activate your account by setting your password using the secure link below:

            {link}

            This activation link will remain valid for 2 hours.

            If you experience any issues accessing your account, please contact the support team.

            Thank you.

            Regards,  
            System Administrator
            """,
            now=True
        )

    except Exception:
        frappe.log_error(frappe.get_traceback(), "User Create Email Error") 

@frappe.whitelist(allow_guest=True)
def get_credentials(username, password):
    try:
        from frappe.auth import LoginManager

        # 1️⃣ Authenticate user
        login_manager = LoginManager()
        login_manager.authenticate(username, password)

        # 2️⃣ Check verification
        verification = frappe.db.get_value(
            "Mobile Login Verification",
            {"user_email": username},
            ["verification_status", "api_key"],
            as_dict=True
        )

        if not verification:
            frappe.throw("User not verified. Please login and verify your email first.")

        if not verification.verification_status:
            frappe.throw("Email not verified. Please check your inbox.")

        # 3️⃣ Get User Document
        user_doc = frappe.get_doc("User", username)

        user_full_name = user_doc.full_name
        user_roles = frappe.get_roles(username)
        # Roles you don't want to show
        ignore_roles = ["All", "Guest", "Desk User"]
        # Filter roles
        filtered_roles = [r for r in user_roles if r not in ignore_roles]
        user_role = filtered_roles[0] if filtered_roles else ""

        if not user_doc.api_key:
            api_key = frappe.generate_hash(length=15)
            frappe.db.set_value("User", user_doc.name, "api_key", api_key, update_modified=False)
            user_doc.reload()

        api_key = user_doc.api_key
        api_secret = get_decrypted_password(
            doctype="User",
            name=user_doc.name,
            fieldname="api_secret",
            raise_exception=False
        )

        if not api_secret:
            api_secret = frappe.generate_hash(length=40)
            set_encrypted_password(
                doctype="User",
                name=user_doc.name,
                pwd=api_secret,
                fieldname="api_secret"
            )
            frappe.db.commit()
                
        if not api_key or not api_secret:
            frappe.throw("API credentials not generated. Contact admin.")

        # 4️⃣ Fetch projects
        projects = []

        role_table_map = {
            "Requester Engineer": "tabRequester Engineer Assign",
            "Client / Consultant Engineer": "tabClient Engineer Assign",
            "QC Engineer": "tabQC Engineer Assign"
        }

        project_names = []

        for role, table in role_table_map.items():
            if role in user_roles:
                result = frappe.db.sql(f"""
                    SELECT DISTINCT parent
                    FROM `{table}`
                    WHERE link_wgik = %s
                """, username, as_dict=True)

                project_names.extend([r["parent"] for r in result])

        if project_names:
            projects = frappe.get_all(
                "Project",
                filters={"name": ["in", project_names]},
                fields=["name", "project_name"]
            )

        return {
            "status": "success",
            "user": username,
            "full_name": user_full_name,
            "role": user_role,
            "api_key": api_key,
            "api_secret": api_secret,
            "projects": projects
        }

    except frappe.AuthenticationError:
        frappe.throw("Invalid username or password")

    except Exception:
        frappe.log_error(frappe.get_traceback(), "Get Credentials Error")
        frappe.throw("Something went wrong. Please contact admin")

# ============================================================
def generate_user_api(doc, method=None):
    if doc.name == "Administrator":
        return

    allowed_roles = {
        "QS Engineer",
        "Requester Engineer",
        "Client / Consultant Engineer",
        "QC Engineer",
    }

    user_roles = set(frappe.get_all(
        "Has Role",
        filters={"parent": doc.name},
        pluck="role"
    ))

    if not (user_roles & allowed_roles):
        return

    # Check if api_secret already exists in __Auth
    api_secret_exists = frappe.db.exists(
        "__Auth",
        {
            "doctype": "User",
            "name": doc.name,       # if your table uses "docname", change this key
            "fieldname": "api_secret",
        }
    )

    if api_secret_exists:
        return get_decrypted_password(
            doctype="User",
            name=doc.name,
            fieldname="api_secret",
            raise_exception=False
        )

    if not doc.api_key:
        frappe.db.set_value("User", doc.name, "api_key", frappe.generate_hash(length=15), update_modified=False)

    api_secret = frappe.generate_hash(length=40)

    set_encrypted_password(
        doctype="User",
        name=doc.name,
        fieldname="api_secret",
        pwd=api_secret
    )

    return api_secret
    

def after_user_password_set(doc, method=None):

    if doc.name == "Administrator":
        return

    # # Generate API if missing
    # generate_user_api(doc)


    # check if password already exists
    if not doc.get_password("api_secret", raise_exception=False):

        # allowed roles
        allowed_roles = [
            "QS Engineer",
            "Requester Engineer",
            "Client / Consultant Engineer",
            "QC Engineer"
        ]

        user_roles = frappe.get_roles(doc.name)

        if not any(role in allowed_roles for role in user_roles):
            return

        # Verify Mobile Login
        verification = frappe.db.exists(
            "Mobile Login Verification",
            {"user_email": doc.name}
        )

        if verification:
            frappe.db.set_value(
                "Mobile Login Verification",
                verification,
                "verification_status",
                1
            )

        frappe.db.commit()


"""
Pour Card Approval OTP — REST API
==================================
Base URL:  /api/method/<your_app>.pour_card_approval_api.<endpoint>

Endpoints
---------
POST  send_otp          →  Generate & email OTP to Client Engineer
POST  validate_otp      →  Verify OTP and update Pour Card status
GET   otp_status        →  Check current state of an OTP record
POST  resend_otp        →  Invalidate old OTP and issue a fresh one
"""


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

STATUS_FIELD_MAP = {
    "Reinforcement BBS":    "reinforcement_bbs_status",
    "M-Book Form Work":     "mbook_form_status",
    "M-Book Concrete Work": "mbook_concrete_status",
    "Pour Card Report":     "pour_card_report_status",
}

REJECT_REASON_FIELD_MAP = {
    "Reinforcement BBS":    "reinforcement_bbs_rejected_reason",
    "M-Book Form Work":     "m_book_form_work_rejected_reason",
    "M-Book Concrete Work": "m_book_concrete_work_rejected_reason",
    "Pour Card Report":     "pour_card_report_rejected_reason",
}

OTP_EXPIRY_MINUTES = 10
MAX_OTP_ATTEMPTS   = 5
OTP_DIGITS         = 6


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

def success(data: dict, message: str = "Success", http_status: int = 200) -> dict:
    frappe.response["http_status_code"] = http_status
    return {"success": True, "message": message, "data": data}


def error(message: str, http_status: int = 400, error_code: str = "BAD_REQUEST") -> None:
    frappe.response["http_status_code"] = http_status
    frappe.throw(message, title=error_code)


# ---------------------------------------------------------------------------
# Validators
# ---------------------------------------------------------------------------

def _validate_approval_type(approval_type: str) -> None:
    if approval_type not in STATUS_FIELD_MAP:
        error(
            f"Invalid approval_type '{approval_type}'. "
            f"Allowed: {', '.join(STATUS_FIELD_MAP.keys())}",
            400, "INVALID_APPROVAL_TYPE",
        )


def _validate_action(action: str, reject_reason: str | None) -> None:
    if action not in ("Approve", "Reject"):
        error("action must be 'Approve' or 'Reject'.", 400, "INVALID_ACTION")
    if action == "Reject" and not (reject_reason or "").strip():
        error("reject_reason is required when action is 'Reject'.", 400, "MISSING_REJECT_REASON")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _generate_otp() -> tuple[str, str]:
    """Returns (plaintext, sha256_hash)."""
    plain = str(secrets.randbelow(10 ** OTP_DIGITS)).zfill(OTP_DIGITS)
    return plain, hashlib.sha256(plain.encode()).hexdigest()


def _resolve_engineer(pour_card_doc) -> list[tuple[str, str]]:
    """Returns list of (engineer_name, email) tuples for ALL consultants."""
    project     = frappe.get_doc("Project", pour_card_doc.project_name)
    consultants = project.get("client__consultant_engineer") or []

    if not consultants:
        error(
            f"No Client Engineer assigned to project '{pour_card_doc.project_name}'.",
            422, "NO_CLIENT_ENGINEER",
        )

    engineers = []
    for consultant in consultants:
        engineer = consultant.link_wgik
        
        # Get email from User doctype or use engineer name if it's an email
        email = frappe.db.get_value("User", engineer, "email") or (
            engineer if "@" in str(engineer) else None
        )

        if not email:
            frappe.log_error(
                title="Missing Email",
                message=f"Email not configured for engineer '{engineer}'. Skipping.",
            )
            continue
        
        engineers.append((engineer, email))
    
    if not engineers:
        error(
            "No valid email addresses found for assigned engineers.",
            422, "MISSING_EMAIL",
        )
    
    return engineers


def _expire_pending_otps(pour_card: str, approval_type: str) -> None:
    """Invalidates all open OTP records for this pour_card + approval_type."""
    records = frappe.get_all(
        "Pour Card Approval OTP",
        filters={"pour_card": pour_card, "approval_type": approval_type, "verified": 0},
        pluck="name",
    )
    for name in records:
        frappe.db.set_value("Pour Card Approval OTP", name, "expiry_time", now_datetime())


def _create_otp_record(
    pour_card: str,
    approval_type: str,
    engineer: str,
    otp_hash: str,
    action: str,
    reject_reason: str,
) -> object:
    return frappe.get_doc({
        "doctype":         "Pour Card Approval OTP",
        "pour_card":       pour_card,
        "approval_type":   approval_type,
        "client_engineer": engineer,
        "otp":             otp_hash,
        "expiry_time":     add_to_date(now_datetime(), minutes=OTP_EXPIRY_MINUTES),
        "action":          action,
        "reject_reason":   reject_reason or "",
        "verified":        0,
        "attempts":        0,
    }).insert(ignore_permissions=True)

def _send_otp_email(
    email: str,
    pour_card: str,
    approval_type: str,
    action: str,
    otp_plain: str,
    reject_reason: str | None,
) -> None:
    color        = "#27ae60" if action == "Approve" else "#e74c3c"
    reject_row   = (
        f'<tr><td style="padding:6px 0;color:#555"><b>Reject Reason</b></td>'
        f'<td style="padding:6px 12px">{frappe.utils.escape_html(reject_reason)}</td></tr>'
        if reject_reason else ""
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;
                border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
      <div style="background:{color};padding:20px 28px">
        <h2 style="color:#fff;margin:0">Pour Card {action} — OTP</h2>
      </div>
      <div style="padding:28px">
        <p>Dear Client Engineer,</p>
        <p style="color:#555">Please use the OTP below to confirm the action on the Pour Card.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:6px 0;color:#555"><b>Pour Card</b></td>
              <td style="padding:6px 12px">{frappe.utils.escape_html(pour_card)}</td></tr>
          <tr><td style="padding:6px 0;color:#555"><b>Approval Type</b></td>
              <td style="padding:6px 12px">{frappe.utils.escape_html(approval_type)}</td></tr>
          <tr><td style="padding:6px 0;color:#555"><b>Action</b></td>
              <td style="padding:6px 12px;color:{color};font-weight:bold">{action}</td></tr>
          {reject_row}
        </table>
        <div style="text-align:center;margin:28px 0">
          <p style="color:#555;margin-bottom:8px">Your One-Time Password</p>
          <div style="display:inline-block;background:#f5f5f5;border:2px dashed #ccc;
                      border-radius:8px;padding:16px 40px">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#222">
              {otp_plain}
            </span>
          </div>
          <p style="color:#e74c3c;margin-top:12px;font-size:13px">
            ⏳ Valid for {OTP_EXPIRY_MINUTES} minutes only
          </p>
        </div>
        <p style="color:#aaa;font-size:12px;border-top:1px solid #eee;padding-top:16px">
          If you did not request this, contact your system administrator.<br><br>
          Regards,<br><b>Site Job Management System</b>
        </p>
      </div>
    </div>"""

    frappe.sendmail(
        recipients=[email],
        subject=f"[OTP] Pour Card {action} — {pour_card}",
        message=html,
        delayed=False,
    )





# ---------------------------------------------------------------------------
# API Endpoint 1 — Send OTP
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=False)
def send_otp(
    pour_card: str,
    approval_type: str,
    action: str = "Approve",
    reject_reason: str | None = None,
) -> dict:
    _validate_approval_type(approval_type)
    _validate_action(action, reject_reason)

    # ── Guard: check current Pour Card status before sending OTP ─────────────
    status_field   = STATUS_FIELD_MAP.get(approval_type)
    current_status = frappe.db.get_value("Pour Card", pour_card, status_field)

    if action == "Approve" and current_status == "Approved":
        error(
            f"{approval_type} is already Approved. Cannot approve again.",
            409, "ALREADY_APPROVED"
        )

    if action == "Reject" and current_status == "Approved":
        error(
            f"{approval_type} is already Approved. Cannot reject.",
            409, "CANNOT_REJECT_APPROVED"
        )

    if action == "Reject" and current_status == "Rejected":
        error(
            f"{approval_type} is already Rejected. Must be re-submitted first.",
            409, "CANNOT_REJECT_AGAIN"
        )
    # ─────────────────────────────────────────────────────────────────────────

    # ── Block if active OTP already exists ───────────────────────────────────
    active_otp = frappe.db.get_value(
        "Pour Card Approval OTP",
        {
            "pour_card":     pour_card,
            "approval_type": approval_type,
            "verified":      0,
            "expiry_time":   [">", now_datetime()],
        },
        "name",
    )

    if active_otp:
        error(
            "An OTP has already been sent. Please check your email. "
            "Use Resend OTP if you did not receive it.",
            429, "OTP_ALREADY_ACTIVE",
        )

    pc = frappe.get_doc("Pour Card", pour_card)
    engineers_list = _resolve_engineer(pc)
    _expire_pending_otps(pour_card, approval_type)

    otp_plain, otp_hash = _generate_otp()

    sent_to = []
    otp_doc = None

    for engineer, email in engineers_list:
        if not otp_doc:
            otp_doc = _create_otp_record(
                pour_card, approval_type, engineer, otp_hash, action, reject_reason
            )

        try:
            _send_otp_email(email, pour_card, approval_type, action, otp_plain, reject_reason)
            user, domain = email.split("@")
            masked_email = user[:2] + "***@" + domain
            sent_to.append(masked_email)

        except Exception as exc:
            frappe.log_error(
                title=f"OTP Email Failed for {email}",
                message=str(exc)
            )

    if not sent_to:
        frappe.db.rollback()
        error("Failed to send OTP to any engineer. Please try again.", 500, "EMAIL_FAILED")

    frappe.db.commit()

    return success(
        {
            "otp_record": otp_doc.name,
            "expires_in_minutes": OTP_EXPIRY_MINUTES,
            "sent_to": sent_to,
        },
        f"OTP sent successfully to {len(sent_to)} engineer(s).",
        200,
    )

# ---------------------------------------------------------------------------
# API Endpoint 2 — Validate OTP
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=False)
def validate_otp(otp_record: str, otp: str, signature: str | None = None) -> dict:

    if not frappe.db.exists("Pour Card Approval OTP", otp_record):
        error("OTP record not found.", 404, "NOT_FOUND")

    row = frappe.db.get_value(
        "Pour Card Approval OTP",
        otp_record,
        [
            "name", "otp", "verified", "expiry_time", "attempts",
            "action", "pour_card", "approval_type",
            "client_engineer", "reject_reason",
        ],
        as_dict=True,
    )

    if not row:
        error("OTP record not found.", 404, "NOT_FOUND")

    # ── Guard: already used ──────────────────────────────────────────────────
    if row.verified:
        error("This OTP has already been used.", 409, "OTP_ALREADY_USED")

    # ── Guard: expiry ────────────────────────────────────────────────────────
    expiry = row.get("expiry_time")
    if not expiry or get_datetime(expiry) < now_datetime():
        error("OTP has expired. Please request a new one.", 410, "OTP_EXPIRED")

    # ── Guard: already approved — cannot re-approve ──────────────────────────
    status_field = STATUS_FIELD_MAP.get(row.approval_type)
    current_status = frappe.db.get_value("Pour Card", row.pour_card, status_field)

    if row.action == "Approve" and current_status == "Approved":
        error(
            f"{row.approval_type} is already Approved. Cannot approve again.",
            409, "ALREADY_APPROVED"
        )
        
    # ── Guard: already approved — cannot reject ───────────────────────────────
    if row.action == "Reject" and current_status == "Approved":
        error(
            f"{row.approval_type} is already Approved. Cannot reject an approved record.",
            409, "CANNOT_REJECT_APPROVED"
        )
    
    # ── Guard: already rejected — cannot reject again ─────────────────────────
    if row.action == "Reject" and current_status == "Rejected":
        error(
            f"{row.approval_type} is already Rejected. Cannot reject again. "
            f"Must be re-submitted first.",
            409, "CANNOT_REJECT_AGAIN"
        )

    # ── Guard: signature required for Approve only ───────────────────────────
    if row.action == "Approve" and not signature:
        error(
            "Signature is required for approval.",
            400, "SIGNATURE_REQUIRED"
        )

    # ── Guard: brute-force ───────────────────────────────────────────────────
    current_attempts = int(row.attempts or 0)
    if current_attempts >= MAX_OTP_ATTEMPTS:
        error(
            "Maximum verification attempts exceeded. Please request a new OTP.",
            429, "MAX_ATTEMPTS_EXCEEDED",
        )

    # Increment attempt BEFORE comparing
    frappe.db.set_value(
        "Pour Card Approval OTP", otp_record, "attempts", current_attempts + 1
    )

    # ── Hash compare ─────────────────────────────────────────────────────────
    submitted_hash = hashlib.sha256(str(otp).encode()).hexdigest()
    if submitted_hash != row.otp:
        frappe.db.commit()
        remaining = MAX_OTP_ATTEMPTS - (current_attempts + 1)
        error(
            f"Invalid OTP. {max(remaining, 0)} attempt(s) remaining.",
            401, "INVALID_OTP",
        )

    # ── Mark verified & wipe hash ────────────────────────────────────────────
    frappe.db.set_value(
        "Pour Card Approval OTP",
        otp_record,
        {"verified": 1, "otp": "", "expiry_time": now_datetime()},
    )

    # ── Update Pour Card status ───────────────────────────────────────────────
    _update_pour_card_status_from_dict(row)

    # ── Handle signature ──────────────────────────────────────────────────────
    signature_url = None

    if row.action == "Approve" and signature:
        # ── Decode & save signature image ─────────────────────────────────────
        try:
            img = signature
            if "," in img:
                img = img.split(",", 1)[1]
            img = img.strip()
            img = img.replace(" ", "+")
            img = img.replace("\n", "").replace("\r", "").replace("\t", "")
            missing_padding = len(img) % 4
            if missing_padding:
                img += "=" * (4 - missing_padding)

            image_data = base64.b64decode(img)

            safe_type     = row.approval_type.replace(" ", "_")
            timestamp     = now_datetime().strftime("%Y%m%d%H%M%S")
            unique_id     = uuid.uuid4().hex[:8]
            sig_file_name = f"SIG_{safe_type}_{row.pour_card}_{timestamp}_{unique_id}.png"
            sig_file_path = os.path.join(SIGNATURE_FOLDER, sig_file_name)

            if not os.path.exists(SIGNATURE_FOLDER):
                os.makedirs(SIGNATURE_FOLDER, exist_ok=True)

            with open(sig_file_path, "wb") as f:
                f.write(image_data)

            signature_url = f"/assets/site_job_management/images/Pour%20Card%20Signature/{sig_file_name}"

            # ── Save to Pour Card Signature child table ────────────────────────
            pc_doc = frappe.get_doc("Pour Card", row.pour_card)
            pc_doc.flags.ignore_validate_update_after_submit = True
            pc_doc.set("pc_signature", [
                r for r in (pc_doc.get("pc_signature") or [])
                if r.pour_card_type != row.approval_type
            ])
            pc_doc.append("pc_signature", {
                "signature":      signature_url,
                "pour_card_type": row.approval_type,
            })
            pc_doc.save(ignore_permissions=True)

        except Exception as e:
            frappe.log_error(
                title="Signature save failed in validate_otp",
                message=str(e)
            )

    elif row.action == "Reject":
        # ── Remove signature from child table on reject ────────────────────────
        pc_doc = frappe.get_doc("Pour Card", row.pour_card)
        pc_doc.flags.ignore_validate_update_after_submit = True
        pc_doc.set("pc_signature", [
            r for r in (pc_doc.get("pc_signature") or [])
            if r.pour_card_type != row.approval_type
        ])
        pc_doc.save(ignore_permissions=True)

        # ── Expire ALL pending OTPs for this pour_card + approval_type ─────────
        _expire_pending_otps(row.pour_card, row.approval_type)

    frappe.db.commit()

    outcome = "Approved" if row.action == "Approve" else "Rejected"
    return success(
        {
            "status":        outcome,
            "pour_card":     row.pour_card,
            "approval_type": row.approval_type,
            "reject_reason": row.reject_reason or "",
            "signature":     signature_url,
        },
        f"Pour Card {outcome} successfully.",
    )

# ---------------------------------------------------------------------------
# API Endpoint 3 — OTP Status  (GET)
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=False)
def otp_status(otp_record: str) -> dict:
    """
    GET /api/method/<app>.pour_card_approval_api.otp_status?otp_record=PCAOTP-0001

    Response 200:
        {
          "success": true,
          "message": "Success",
          "data": {
            "otp_record":    "PCAOTP-0001",
            "pour_card":     "PC-0001",
            "approval_type": "Pour Card Report",
            "action":        "Approve",
            "verified":      false,
            "expired":       false,
            "attempts":      1,
            "attempts_left": 4
          }
        }
    """
    if not frappe.db.exists("Pour Card Approval OTP", otp_record):
        error("OTP record not found.", 404, "NOT_FOUND")

    row = frappe.db.get_value(
        "Pour Card Approval OTP",
        otp_record,
        ["pour_card", "approval_type", "action", "verified", "expiry_time", "attempts"],
        as_dict=True,
    )

    expiry  = row.get("expiry_time")
    expired = (not expiry) or get_datetime(expiry) < now_datetime()
    att     = int(row.attempts or 0)

    return success({
        "otp_record":    otp_record,
        "pour_card":     row.pour_card,
        "approval_type": row.approval_type,
        "action":        row.action,
        "verified":      bool(row.verified),
        "expired":       expired,
        "attempts":      att,
        "attempts_left": max(MAX_OTP_ATTEMPTS - att, 0),
    })


# ---------------------------------------------------------------------------
# API Endpoint 4 — Resend OTP
# ---------------------------------------------------------------------------

def _update_pour_card_status_from_dict(row: dict) -> None:
    field  = STATUS_FIELD_MAP.get(row.approval_type)
    if not field:
        frappe.throw(
            _("Cannot map approval type '{0}' to a Pour Card field.").format(row.approval_type),
            frappe.ValidationError,
        )

    status = "Approved" if row.action == "Approve" else "Rejected"

    # Build update dict
    update_values = {field: status}

    # ── If rejected, also save the reason into the Pour Card field ──
    if status == "Rejected" and row.get("reject_reason"):
        reason_field = REJECT_REASON_FIELD_MAP.get(row.approval_type)
        if reason_field:
            update_values[reason_field] = row.reject_reason

    frappe.db.set_value("Pour Card", row.pour_card, update_values)

    frappe.get_doc({
        "doctype":           "Comment",
        "comment_type":      "Info",
        "reference_doctype": "Pour Card",
        "reference_name":    row.pour_card,
        "content": (
            f"<b>{row.approval_type}</b> <b>{status}</b> by "
            f"{row.client_engineer} via OTP."
            + (f" Reason: {row.reject_reason}" if row.get("reject_reason") else "")
        ),
    }).insert(ignore_permissions=True)


@frappe.whitelist(allow_guest=False)
def resend_otp(otp_record: str) -> dict:

    if not frappe.db.exists("Pour Card Approval OTP", otp_record):
        error("OTP record not found.", 404, "NOT_FOUND")

    row = frappe.db.get_value(
        "Pour Card Approval OTP",
        otp_record,
        ["verified", "pour_card", "approval_type", "action", "reject_reason"],
        as_dict=True,
    )

    if row.verified:
        error("This OTP was already verified. No resend needed.", 409, "ALREADY_VERIFIED")

    frappe.db.set_value("Pour Card Approval OTP", otp_record, "expiry_time", now_datetime())

    return send_otp(
        pour_card=row.pour_card,
        approval_type=row.approval_type,
        action=row.action,
        reject_reason=row.reject_reason or None,
    )




MAX_IMAGE_B64_SIZE = 7 * 1024 * 1024  # 7 MB

ALLOWED_POUR_CARD_TYPES = [
    "Reinforcement BBS",
    "M-Book Form Work",
    "M-Book Concrete Work",
    "Pour Card Report",
]

SNAPSHOT_FOLDER = "/home/indsys/frappe/bench15/sites/assets/site_job_management/images/Pour Card Snapshot"
SIGNATURE_FOLDER = "/home/indsys/frappe/bench15/sites/assets/site_job_management/images/Pour Card Signature"


def _decode_base64_image(img: str, label: str) -> bytes:
    if not isinstance(img, str) or not img.strip():
        frappe.throw(f"{label} is empty or not a string", frappe.ValidationError)
    if len(img) > MAX_IMAGE_B64_SIZE:
        frappe.throw(f"{label} exceeds the 5 MB limit", frappe.ValidationError)
    if "," in img:
        img = img.split(",", 1)[1]
    img = img.strip()
    img = img.replace(" ", "+")
    img = img.replace("\n", "").replace("\r", "").replace("\t", "")
    missing_padding = len(img) % 4
    if missing_padding:
        img += "=" * (4 - missing_padding)
    try:
        return base64.b64decode(img)
    except Exception as e:
        frappe.log_error(title=f"{label} decode error", message=f"Error: {e}\nFirst 100 chars: {img[:100]}")
        frappe.throw(f"{label} is not valid Base64 data: {e}", frappe.ValidationError)


@frappe.whitelist()
def create_doc_with_snapshot(data, snapshots, pour_card_type, docname=None):

    parent_doctype = "Pour Card"

    # ── 1. Validate pour_card_type ────────────────────────────────────────────
    if pour_card_type not in ALLOWED_POUR_CARD_TYPES:
        frappe.throw(
            f"Invalid Pour Card Type: '{pour_card_type}'. "
            f"Must be one of: {', '.join(ALLOWED_POUR_CARD_TYPES)}",
            frappe.ValidationError,
        )

    # ── 2. Parse data ─────────────────────────────────────────────────────────
    if isinstance(data, dict):
        pass
    elif isinstance(data, str):
        try:
            data = json.loads(data)
        except Exception:
            frappe.throw("data is not valid JSON", frappe.ValidationError)
    else:
        frappe.throw("data is missing or invalid", frappe.ValidationError)

    # ── 3. Parse & decode snapshots (skip for Pour Card Report) ──────────────
    decoded_snapshots = []

    if pour_card_type != "Pour Card Report":
        raw_snapshots = frappe.request.form.getlist("snapshots")

        if raw_snapshots and len(raw_snapshots) > 0:
            snapshots = raw_snapshots
        elif isinstance(snapshots, list):
            pass
        elif isinstance(snapshots, str):
            stripped = snapshots.strip()
            if stripped.startswith("["):
                try:
                    snapshots = json.loads(stripped)
                except Exception:
                    frappe.throw("snapshots JSON is malformed", frappe.ValidationError)
            elif stripped:
                snapshots = [stripped]
            else:
                frappe.throw("snapshots is empty or missing", frappe.ValidationError)
        else:
            frappe.throw("snapshots is empty or missing", frappe.ValidationError)

        if not isinstance(snapshots, list):
            frappe.throw("snapshots must be a list", frappe.ValidationError)
        if len(snapshots) < 3:
            frappe.throw("Minimum 3 snapshots required", frappe.ValidationError)
        if len(snapshots) > 5:
            frappe.throw("Maximum 5 snapshots allowed", frappe.ValidationError)

        for i, img in enumerate(snapshots, start=1):
            decoded_snapshots.append(_decode_base64_image(img, f"Snapshot {i}"))


    # ── 4. Load or create Pour Card document ──────────────────────────────────
    if docname and frappe.db.exists(parent_doctype, docname):
        doc = frappe.get_doc(parent_doctype, docname)
        doc.set("snapshot", [
            row for row in (doc.get("snapshot") or [])      # ← or []
            if row.pour_card_type != pour_card_type
        ])
        doc.set("pc_signature", [
            row for row in (doc.get("pc_signature") or [])  # ← or []
            if row.pour_card_type != pour_card_type
        ])
    else:
        doc = frappe.new_doc(parent_doctype)

    for key, value in data.items():
        doc.set(key, value)

    if not doc.name:
        doc.insert(ignore_permissions=True)

    # ── 5. Ensure folders exist ───────────────────────────────────────────────
    for folder in [SNAPSHOT_FOLDER, SIGNATURE_FOLDER]:
        if not os.path.exists(folder):
            os.makedirs(folder, exist_ok=True)

    # ── 6. Write snapshots (skip for Pour Card Report) ────────────────────────
    image_urls = []
    safe_type = pour_card_type.replace(" ", "_")
    timestamp = now_datetime().strftime("%Y%m%d%H%M%S")

    if pour_card_type != "Pour Card Report":
        for i, image_data in enumerate(decoded_snapshots, start=1):
            unique_id = uuid.uuid4().hex[:8]
            file_name = f"{safe_type}_{doc.name}_{i}_{timestamp}_{unique_id}.png"
            file_path = os.path.join(SNAPSHOT_FOLDER, file_name)
            try:
                with open(file_path, "wb") as f:
                    f.write(image_data)
            except OSError as e:
                frappe.throw(f"Could not write snapshot {i} to disk: {e}")

            file_url = f"/assets/site_job_management/images/Pour%20Card%20Snapshot/{file_name}"
            doc.append("snapshot", {
                "snapshot_no": i,
                "snapshot": file_url,
                "pour_card_type": pour_card_type,
            })
            image_urls.append(file_url)


    # ── 7. Persist & return ──────────────────────────────────────────────────
    doc.flags.ignore_validate_update_after_submit = True
    doc.save(ignore_permissions=True)
    frappe.db.commit()

    return {
        "status":   "success",
        "document": doc.name,
        "snapshots": image_urls,
    }