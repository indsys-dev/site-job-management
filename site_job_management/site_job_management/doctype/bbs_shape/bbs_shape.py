# Copyright (c) 2026, Indsys and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class BBSShape(Document):

    def validate(self):
        self.calculate_total()

    def before_save(self):

        if not self.report_no:
            return

        pour_card = frappe.get_doc("Pour Card", self.report_no)

        if pour_card.reinforcement_bbs_status == "Submitted":
            frappe.throw("Document is locked. Cannot edit after submission.")

    
    def calculate_total(self):
        dimensions = [
            self.a,
            self.b,
            self.c,
            self.d,
            self.e,
            self.f,
            self.g,
            self.h
        ]
        total = 0
        for value in dimensions:
            if value:
                total += value
        self.cutting_length = total
        nom = self.nom or 1
        npm = self.npm or 1
        self.total_length = total * nom * npm