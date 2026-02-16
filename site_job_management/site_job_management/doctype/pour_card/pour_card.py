# Copyright (c) 2026, Indsys and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class PourCard(Document):
	def before_save(self):
		pass
