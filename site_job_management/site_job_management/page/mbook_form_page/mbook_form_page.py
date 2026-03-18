import frappe

# =========================================================
# M-Book Form Work
# =========================================================
@frappe.whitelist()
def get_all_mbook_form_data():
    records = frappe.get_all(
        "M-Book Form Work",
        fields=[
            "name", "report_no", "boq_no", "description", "level", "reference",
            "unit", "nom", "npm", "length", "breadth", "depth", "quantity", "remarks",
            "creation"
        ]
    )
    data = []
    for r in records:
        data.append({
            "report_no": r.report_no,
            "name": r.name,
            "boq_no": r.boq_no,
            "description": r.description,
            "level": r.level,
            "reference": r.reference,
            "unit": r.unit,
            "nom": r.nom,
            "npm": r.npm,
            "length": r.length,
            "breadth": r.breadth,
            "depth": r.depth,
            "quantity": r.quantity,
            "remarks": r.remarks,
            "creation": r.creation
        })
    return data


