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

    # ---------------------------------------------------------
    # Fetch Snapshots from Pour Card Image child table
    # filtered by M-Book Concrete Work type
    # ---------------------------------------------------------
    snapshots = frappe.get_all(
        "Pour Card Image",
        filters={
            "parent": pour_card,
            "pour_card_type": "M-Book Concrete Work"
        },
        fields=["snapshot_no", "snapshot"],
        order_by="snapshot_no asc"
    )

    # Fetch Signature
    signatures = frappe.get_all(
        "Pour Card Signature",
        filters={
            "parent": pour_card,
            "pour_card_type": "M-Book Concrete Work"
        },
        fields=["signature"],
        limit=1
    )

    signature = signatures[0].signature if signatures else None

    return {
        "project": project,
        "pour_card": pour,
        "formwork_list": formwork_list,
        "snapshots": snapshots,
        "signature": signature
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
def reject(pour_card, reason=None):
    # 🔴 Validation: Reason is mandatory
    if not reason or not reason.strip():
        frappe.msgprint("Rejection reason is mandatory. Please enter a reason.")
    else:
        doc = frappe.get_doc("Pour Card", pour_card)
        doc.mbook_concrete_status = "Rejected"
        doc.m_book_concrete_work_rejected_reason = reason
        doc.save()


