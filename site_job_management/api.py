import frappe

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