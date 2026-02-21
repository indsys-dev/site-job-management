import frappe

def get_permission_query_conditions(user):
    if not user:
        user = frappe.session.user
    # Administrator full access
    if user == "Administrator":
        return ""
    # Role → Child Table Mapping
    role_table_map = {
        "Client / Consultant Engineer": "Client Engineer Assign",
        "QC Engineer": "QC Engineer Assign",
        "Requester Engineer" :"Requester Engineer Assign"
    }

    user_roles = frappe.get_roles(user)
    conditions = 0

    for role, table in role_table_map.items():
        # frappe.msgprint(role)
        if role == user_roles[0]:
            # frappe.msgprint("enter the loop")
            conditions = f"""
                EXISTS (
                    SELECT 1
                    FROM `tab{table}` child
                    WHERE child.parent = `tabProject`.name
                    AND child.link_wgik = {frappe.db.escape(user)}
                )
            """

    if conditions:
        return conditions
    else:
        return ""

