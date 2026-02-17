import frappe
@frappe.whitelist()
def get_data(pour_card):

    pour = frappe.get_doc("Pour Card", pour_card)
    project = frappe.get_doc("Project", pour.project_name)

    bbs_list = frappe.get_all(
        "BBS Shape",
        filters={"report_no": pour_card},
        fields=[
            "shape_code",
            "dia",
            "dia.dia as dia_value",
            "nom",
            "npm",
            "cutting_length",
            "total_length"
        ]
    )

    # -----------------------------
    # GROUP BY DIA
    # -----------------------------

    summary = {}

    for row in bbs_list:

        dia = row.dia_value

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

    # -----------------------------
    # CALCULATE FORMULAS
    # -----------------------------

    for dia in summary:
        total_length = summary[dia]["total_length"]

        unit_weight = (dia * dia) / 162
        total_kg = total_length * unit_weight
        total_mt = total_kg / 1000

        summary[dia]["unit_weight"] = round(unit_weight, 3)
        summary[dia]["total_kg"] = round(total_kg, 3)
        summary[dia]["total_mt"] = round(total_mt, 3)

    grand_total_length = sum(
        row.total_length or 0 for row in bbs_list
    )

    return {
        "project": project,
        "pour_card": pour,
        "bbs_shapes": bbs_list,
        "grand_total": grand_total_length,
        "summary": summary
    }
