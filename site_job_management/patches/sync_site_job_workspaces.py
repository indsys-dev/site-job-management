# Copyright (c) 2026, Indsys and contributors
# For license information, please see license.txt

import frappe
from frappe.modules.import_file import import_file


def execute():
    """Ensure critical Site Job Management workspaces/charts are present after migrate."""
    import_file("site_job_management", "dashboard_chart", "project", force=True)
    import_file("site_job_management", "dashboard_chart", "pour_card_average", force=True)
    import_file("site_job_management", "dashboard_chart", "pour_card_report_status_mix", force=True)

    import_file("site_job_management", "workspace", "pour_card_management", force=True)
    import_file("site_job_management", "workspace", "projects", force=True)
    import_file("site_job_management", "workspace", "pour_card_details", force=True)
