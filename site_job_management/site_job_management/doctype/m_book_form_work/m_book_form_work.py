# Copyright (c) 2026, Indsys and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class MBookFormWork(Document):

    def validate(self):
        self.calculate_total()

    def before_save(self):

        if not self.report_no:
            return

        pour_card = frappe.get_doc("Pour Card", self.report_no)

        if pour_card.mbook_form_status == "Submitted":
            frappe.throw("Document is locked. Cannot edit after submission.")

    
    def calculate_total(self):
        dimensions = [
            self.nom,
            self.npm,
            self.length,
            self.breadth,
            self.depth,
        ]
        total = 1
        for value in dimensions:
            if value:
                total = total*value
        self.quantity = total

        