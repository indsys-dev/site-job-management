# import frappe


# # =========================================================
# # GET POUR CARDS (FOR PAGE LIST)
# # =========================================================
# @frappe.whitelist()
# def get_pour_cards_bbs():

#     pour_cards = frappe.get_all(
#         "Pour Card",
#         fields=[
#             "name",
#             "project_name",
#             "reinforcement_bbs_status",
#             "pour_card_report_status"
#         ],
#         # ✅ Optional filter (recommended)
#         # show only records where BBS is created
#         filters={
#             "reinforcement_bbs_status": ["!=", "Not Created"]
#         },
#         order_by="modified desc"
#     )

#     return pour_cards


# # =========================================================
# # GET FULL DATA (DETAIL VIEW)
# # =========================================================
# @frappe.whitelist()
# def get_data(pour_card):

#     # ---------------------------------------------------------
#     # Pour Card + Project
#     # ---------------------------------------------------------
#     pour = frappe.get_doc("Pour Card", pour_card)
#     project = frappe.get_doc("Project", pour.project_name)

#     # ---------------------------------------------------------
#     # Fetch BBS Shapes
#     # ---------------------------------------------------------
#     bbs_list = frappe.get_all(
#         "BBS Shape",
#         filters={"report_no": pour_card},
#         fields=[
#             "name",
#             "shape_code",

#             # Bending
#             "a", "b", "c", "d", "e", "f", "g", "h",

#             # Bar details
#             "dia",
#             "nom",
#             "npm",

#             # Calculated
#             "cutting_length",
#             "total_length"
#         ],
#     )

#     # ---------------------------------------------------------
#     # Add Dia Value (from Dia DocType)
#     # ---------------------------------------------------------
#     for row in bbs_list:
#         if row.dia:
#             row["dia_value"] = frappe.db.get_value("Dia", row.dia, "dia")
#         else:
#             row["dia_value"] = None

#     # ---------------------------------------------------------
#     # SUMMARY (GROUP BY DIA)
#     # ---------------------------------------------------------
#     grouped = {}

#     for row in bbs_list:

#         dia = row.get("dia_value")

#         if not dia:
#             continue

#         if dia not in grouped:
#             grouped[dia] = []

#         grouped[dia].append(row)


#     return {
#         "pour_card": {
#             "name": pour.name,
#             "project": pour.project_name,
#             "status": pour.reinforcement_bbs_status
#         },
#         "project": {
#             "name": project.name
#         },
#         "grouped_bbs": grouped   # ✅ NEW
#     }


import frappe

@frappe.whitelist()
def get_all_bbs_data():

    final_data = []

    shapes = frappe.get_all(
        "BBS Shape",
        fields=[
            "name",
            "shape_code",

            # bending (if exists in your doctype)
            "a", "b", "c", "d", "e", "f", "g", "h",

            # bar details
            "dia",
            "nom",
            "npm",

            # calculated
            "cutting_length",
            "total_length",

            # 🔥 IMPORTANT LINK
            "report_no",
            "creation"
        ]
    )

    for row in shapes:

        final_data.append({
            "pour_card": row.report_no,   # ✅ FIXED
            "reinforcement_bbs": row.report_no,  # (same for now)

            "name": row.name,
            "shape_code": row.shape_code,

            "a": row.get("a", ""),
            "b": row.get("b", ""),
            "c": row.get("c", ""),
            "d": row.get("d", ""),
            "e": row.get("e", ""),
            "f": row.get("f", ""),
            "g": row.get("g", ""),
            "h": row.get("h", ""),

            "dia": row.dia,
            "nom": row.nom,
            "npm": row.npm,

            "cutting_length": row.get("cutting_length", ""),
            "total_length": row.get("total_length", ""),
            "creation": row.creation
        })

    return final_data