import frappe


def autoname(doc, method):
    # Ensure project is selected
    if not doc.project_name:
        frappe.throw("Project is required to create Pour Card")

    project_name = doc.project_name  # Example: HBS-25-26-0002

    # Generate name safely using Frappe naming series
    doc.name = frappe.model.naming.make_autoname(
        f"{project_name}-PC.####"
    )