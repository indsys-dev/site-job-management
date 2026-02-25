import frappe

@frappe.whitelist()
def get_data(pour_card):
    pour = frappe.get_doc("Pour Card", pour_card)
    project = frappe.get_doc("Project", pour.project_name)

    # Fetch Pour Card Report
    formwork_list = frappe.get_all(
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

    return {
        "project": project,
        "pour_card": pour,
        "formwork_list": formwork_list
    }

@frappe.whitelist()
def approve(pour_card):
    doc = frappe.get_doc("Pour Card", pour_card)
    doc.pour_card_report_status = "Approved"
    doc.save()
    return "Approved"

@frappe.whitelist()
def reject(pour_card, reason=None):
    # 🔴 Validation: Reason is mandatory
    if not reason or not reason.strip():
        frappe.throw("Rejection reason is mandatory. Please enter a reason.")

    doc = frappe.get_doc("Pour Card", pour_card)
    doc.pour_card_report_status = "Rejected"
    doc.pour_card_report_rejected_reason = reason
    doc.save() 
    return "Rejected"
