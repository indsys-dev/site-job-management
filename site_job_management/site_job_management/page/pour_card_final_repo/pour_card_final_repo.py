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
    # FORM WORK LIST (M-BOOK)
    # -----------------------------
    formwork_list = frappe.get_all(
        "M-Book Concrete Work",
        filters={"report_no": pour_card},
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
            "remarks"
        ]
    )

    # -----------------------------
    # FORM WORK CONCREATE LIST (M-BOOK)
    # -----------------------------
    concreate_work = frappe.get_all(
        "M-Book Form Work",
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
            "remarks"
        ]
    )

     # -----------------------------
    # Report
    # -----------------------------
    report_list = frappe.get_all(
        "Pour Card Report",
        filters={"report_no": pour_card},
        fields=[
            # Values
            "value_surveylayout", "value_formwork", "value_reinforcement", "value_cover_blocks", "value_embedments",
            "value_sleeves_inserts", "value_cleanliness", "value_time_between_mixing_and_pouring", "value_weight_of_mix_ingredients",
            "value_wc_ratio", "value_slump", "value_concrete_temperature", "pour_start_time", "value_cube_sampling_details",
            "value_surface_finish", "value_honeycombing", "value_cold_joints",
            "value_curing_method", "value_overall_acceptance",

            # Verified / Remarks (actual DB fields)
            "verified_surveylayout", "remarks_surveylayout",
            "verified_formwork", "remarks_formwork",
            "verified_reinforcement", "remarks_reinforcement",
            "verified_cover_blocks", "remarks_cover_blocks",
            "verified_embedments", "remarks_embedments",
            "verified_sleeves_inserts", "remarks_sleeves_inserts",
            "verified_cleanliness", "remarks_cleanliness",
            "verified_time_between_mixing_and_pouring", "remarks_time_between_mixing_and_pouring",
            "verified_weight_of_mix_ingredients", "remarks_weight_of_mix_ingredients",
            "verified_wc_ratio", "remarks_wc_ratio",
            "verified_slump", "remarks_slump",
            "verified_concrete_temperature", "remarks_concrete_temperature",
            "pour_start_time", "pour_start_time",
            "verified_cube_sampling_details", "remarks_cube_sampling_details",
            "verified_surface_finish", "remarks_surface_finish",
            "verified_honeycombing", "remarks_honeycombing",
            "verified_cold_joints", "remarks_cold_joints",
            "verified_curing_method", "remarks_curing_method",
            "verified_overall_acceptance", "remarks_overall_acceptance",
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
        "summary": summary,
        "formwork_list": formwork_list,
        "concreate_work":concreate_work,
        "report_list":report_list
    }
