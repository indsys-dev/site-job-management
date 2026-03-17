import frappe
from datetime import datetime


def get_financial_year():
    today = datetime.today()

    if today.month >= 4:  # April → Dec
        start_year = today.year
        end_year = today.year + 1
    else:  # Jan → March
        start_year = today.year - 1
        end_year = today.year

    return str(start_year)[-2:], str(end_year)[-2:]


def get_company_abbr(company):
    if not company:
        frappe.throw("Company is required")

    # Fetch abbreviation from Project Company doctype
    abbr = frappe.db.get_value("Project Company", company, "abbr")

    if not abbr:
        frappe.throw(f"Abbreviation not set for Company: {company}")

    return abbr.upper()


def autoname(doc, method):
    start, end = get_financial_year()

    company_abbr = get_company_abbr(doc.company)

    # Example: HBS-26-27-
    prefix = f"{company_abbr}-{start}-{end}-"

    # 🔥 auto increment per prefix (company + year)
    doc.name = frappe.model.naming.make_autoname(prefix + ".####")
