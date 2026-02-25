import frappe


# =========================================================
# GET DATA
# =========================================================
@frappe.whitelist()
def get_data(pour_card):

    # Pour Card Document
    pour = frappe.get_doc("Pour Card", pour_card)

    # Project Document
    project = frappe.get_doc("Project", pour.project_name)

    # ---------------------------------------------------------
    # Fetch BBS Shapes (Include bending fields a-h)
    # ---------------------------------------------------------
    bbs_list = frappe.get_all(
        "BBS Shape",
        filters={"report_no": pour_card},
        fields=[
            "shape_code",

            # ✅ Bending Dimensions
            "a", "b", "c", "d", "e", "f", "g", "h",

            # Main Fields
            "dia",
            "nom",
            "npm",
            "cutting_length",
            "total_length"
        ],
    )

    # ---------------------------------------------------------
    # Add Dia Value Properly (Fix join issue)
    # ---------------------------------------------------------
    for row in bbs_list:
        if row.dia:
            row["dia_value"] = frappe.db.get_value("Dia", row.dia, "dia")
        else:
            row["dia_value"] = None

    # ---------------------------------------------------------
    # GROUP BY DIA SUMMARY
    # ---------------------------------------------------------
    summary = {}

    for row in bbs_list:

        dia = row["dia_value"]

        if not dia:
            continue

        if dia not in summary:
            summary[dia] = {
                "total_length": 0,
                "unit_weight": 0,
                "total_kg": 0,
                "total_mt": 0
            }

        summary[dia]["total_length"] += row.total_length or 0

    # ---------------------------------------------------------
    # CALCULATE WEIGHT FORMULAS
    # ---------------------------------------------------------
    for dia in summary:

        total_length = summary[dia]["total_length"]

        unit_weight = (dia * dia) / 162
        total_kg = total_length * unit_weight
        total_mt = total_kg / 1000

        summary[dia]["unit_weight"] = round(unit_weight, 3)
        summary[dia]["total_kg"] = round(total_kg, 3)
        summary[dia]["total_mt"] = round(total_mt, 3)

    # ---------------------------------------------------------
    # Return Final Data
    # ---------------------------------------------------------
    return {
        "project": project,
        "pour_card": pour,
        "bbs_shapes": bbs_list,
        "summary": summary
    }


# =========================================================
# APPROVE
# =========================================================
@frappe.whitelist()
def approve(pour_card):

    doc = frappe.get_doc("Pour Card", pour_card)
    doc.reinforcement_bbs_status = "Approved"
    doc.save()

    return "Approved"


# =========================================================
# REJECT
# =========================================================
@frappe.whitelist()
def reject(pour_card, reason=None):

    # 🔴 Validation: Reason is mandatory
    if not reason or not reason.strip():
        frappe.throw("Rejection reason is mandatory. Please enter a reason.")

    doc = frappe.get_doc("Pour Card", pour_card)
    doc.reinforcement_bbs_status = "Rejected"
    doc.reinforcement_bbs_rejected_reason = reason.strip()
    doc.save()

    return "Rejected"