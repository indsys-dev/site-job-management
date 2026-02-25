import frappe
from frappe import _
from frappe.utils.password import set_encrypted_password, get_decrypted_password
import random
import time
import secrets
import re
from frappe.core.doctype.user.user import generate_keys

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
        fields=["name","report_no","shape_code","description","shape_path","shape","a","b","c","d","e","f","g","h","dia","nom","npm","cutting_length","total_length","snapshot"],
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
        if not api_secret_exists:
            api_secret = frappe.generate_hash(length=20)
            set_encrypted_password(
                doctype="User",
                name=user.name,
                pwd=api_secret,
                fieldname="api_secret"
            )
        else:
            api_secret = get_decrypted_password(
                doctype="User",
                name=user.name,
                fieldname="api_secret",
                raise_exception=False
            )

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
            expires_in_sec=3600  # 30 minutes
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

                    <p style="color: #666;">This link is valid for 1 hour and can only be used once.</p>
                    <p style="color: #666;">If you did not request this, please ignore this email.</p>
                </div>
            """,
            now=False 
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
    """
    Triggered automatically when a new User is created in Frappe.
    Sends set password email to the new user.
    """
    try:
        # Skip system users and Administrator
        if doc.name == "Administrator" or doc.name == "Guest":
            return

        # Skip if no email
        if not doc.email:
            return

        # Generate API key if not exists
        if not doc.api_key:
            doc.api_key = frappe.generate_hash(length=15)
            doc.save(ignore_permissions=True)

        # Generate token
        token = secrets.token_urlsafe(32)

        # Store in cache
        frappe.cache().set_value(
            f"verify_token_{token}",
            {
                "username": doc.name,
                "api_key": doc.api_key,
                "api_secret": ""
            },
            expires_in_sec=3600  # 1 hour
        )

        # Create verification record
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

        # Send email
        site_url = frappe.utils.get_url()
        set_password_link = f"{site_url}/set-new-password?token={token}"

        frappe.sendmail(
            recipients=[doc.email],
            subject="Welcome! Set Your Password",
            message=f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome {doc.full_name}! 👋</h2>
                    <p>Your account has been created successfully.</p>
                    <p>Click the button below to set your password and login:</p>

                    <a href="{set_password_link}" style="
                        background-color: #2196F3;
                        color: white;
                        padding: 14px 28px;
                        text-decoration: none;
                        border-radius: 6px;
                        display: inline-block;
                        font-size: 16px;
                        margin: 20px 0;
                    ">🔑 Set Password & Login</a>

                    <p style="color: #666;">This link is valid for 1 hour and can only be used once.</p>
                    <p style="color: #666;">If you did not expect this email, please ignore it.</p>
                </div>
            """,
            now=False
        )

    except Exception:
        frappe.log_error(frappe.get_traceback(), "User Create Email Error")

@frappe.whitelist(allow_guest=True)
def get_credentials(username, password):
    try:
        # 1️⃣ Authenticate user
        login_manager = frappe.auth.LoginManager()
        login_manager.authenticate(username, password)

        # 2️⃣ Check verification status
        verification = frappe.db.get_value(
            "Mobile Login Verification",
            {"user_email": username},
            ["verification_status", "api_key"],
            as_dict=True
        )

        if not verification:
            frappe.throw(_("User not verified. Please login and verify your email first."))

        if not verification.verification_status:
            frappe.throw(_("Email not verified. Please check your inbox and click the verification link."))

        # 3️⃣ Get api_secret
        api_secret = get_decrypted_password(
            doctype="User",
            name=username,
            fieldname="api_secret",
            raise_exception=False
        )

        return {
            "status": "success",
            "user": username,
            "api_key": verification.api_key,
            "api_secret": api_secret
        }

    except frappe.AuthenticationError:
        frappe.throw(_("Invalid username or password"))

    except Exception as e:
        if isinstance(e, frappe.ValidationError):
            raise
        frappe.log_error(frappe.get_traceback(), "Get Credentials Error")
        frappe.throw(_("Something went wrong. Please contact admin"))

def generate_user_api(doc, method=None):

    if doc.name == "Administrator":
        return

    allowed_roles = [
        "QS Engineer",
        "Requester Engineer",
        "Client / Consultant Engineer",
        "QC Engineer"
    ]

    # Always fetch roles from DB (safe in on_update)
    user_roles = frappe.get_all(
        "Has Role",
        filters={"parent": doc.name},
        pluck="role"
    )

    if any(r in allowed_roles for r in user_roles):

        if not doc.api_key:
            api_secret = generate_keys(doc.name)