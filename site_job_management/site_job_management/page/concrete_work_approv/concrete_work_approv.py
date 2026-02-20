import frappe

@frappe.whitelist()
def get_data(pour_card):

    # Pour Card Document
    pour = frappe.get_doc("Pour Card", pour_card)

    # Project Document
    project = frappe.get_doc("Project", pour.project_name)

    #  Correct Doctype Fetch
    formwork_list = frappe.get_all(
        "M-Book Concrete Work",
        filters={"report_no": pour_card},   #  report_no is link field
        fields=[
            "boq_no",
            "level",
            "reference",
            "unit",
            "nom",
            "npm",
            "length",
            "breadth",
            "depth",
            "quantity_concrete",
            "remarks"
        ]
    )

    return {
        "project": project,
        "pour_card": pour,
        "formwork_list": formwork_list
    }


# ==============================
# APPROVE
# ==============================

@frappe.whitelist()
def approve(pour_card):

    doc = frappe.get_doc("Pour Card", pour_card)
    doc.mbook_concrete_status= "Approved"
    doc.save()

    return "Approved"


# ==============================
# REJECT
# ==============================

@frappe.whitelist()
def reject(pour_card, reason):

    doc = frappe.get_doc("Pour Card", pour_card)
    doc.mbook_concrete_status = "Rejected"
    doc.form_work_rejection_reason = reason
    doc.save()

    return "Rejected"


