# Copyright (c) 2026, Indsys and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Project(Document):

    def before_save(self):
        """
        Store existing Drawing Details before save
        (Used to detect deleted child rows)
        """
        if not self.is_new():
            self._old_drawings = frappe.db.get_all(
                "Drawing Detail",
                filters={"project": self.name},
                pluck="drawing_number"
            )
            # frappe.msgprint(_old_drawings)
        else:
            self._old_drawings = []

    def on_update(self):
        # CREATE / UPDATE
        self.sync_drawing_details()

        # DELETE
        self.delete_removed_drawings()

    # -------------------------------------------------
    # CREATE & UPDATE Drawing Detail
    # -------------------------------------------------
    def sync_drawing_details(self):
        for row in self.table_qwkr:

            if not row.drawing_no:
                continue

            drawing_name = frappe.db.get_value(
                "Drawing Detail",
                {
                    "project": self.name,
                    "drawing_number": row.drawing_no
                },
                "name"
            )

            if drawing_name:
                # UPDATE
                drawing = frappe.get_doc("Drawing Detail", drawing_name)
                drawing.building_name = row.building_name
                drawing.floor_name = row.floor_name
                drawing.drawing = row.drawing
                drawing.save(ignore_permissions=True)
            else:
                # CREATE
                drawing = frappe.get_doc({
                    "doctype": "Drawing Detail",                   
                    "project": self.name,
                    "drawing_number": row.drawing_no,
                    "building_name": row.building_name,
                    "floor_name": row.floor_name,
                    "drawing": row.drawing
                })
                drawing.insert(ignore_permissions=True)

    # -------------------------------------------------
    # DELETE Drawing Detail when row removed
    # -------------------------------------------------
    def delete_removed_drawings(self):
        current_drawings = [
            row.drawing_no
            for row in self.table_qwkr
            if row.drawing_no
        ]

        removed_drawings = set(self._old_drawings) - set(current_drawings)

        if removed_drawings:
            frappe.db.delete(
                "Drawing Detail",
                {
                    "project": self.name,
                    "drawing_number": ["in", list(removed_drawings)]
                }
            )