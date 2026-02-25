# Copyright (c) 2026, Indsys and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document

class UserCreation(Document):

    def on_update(self):

        if frappe.db.exists("User", self.email):

            user = frappe.get_doc("User", self.email)

            user.first_name = self.first_name
            user.last_name = self.last_name
            user.mobile_no = self.phone
            user.enabled = self.enable
            user.role_profile_name = self.role_profile
            user.module_profile = self.module_profile

            user.save(ignore_permissions=True)

        else:

            user = frappe.get_doc({
                "doctype": "User",
                "email": self.email,
                "first_name": self.first_name,
                "last_name": self.last_name,
                "mobile_no": self.phone,
                "enabled": self.enable,
                "send_welcome_email": 1,
                "role_profile_name": self.role_profile,
                "module_profile": self.module_profile
            })

            user.insert(ignore_permissions=True)