// Copyright (c) 2026, Indsys and contributors
// For license information, please see license.txt

frappe.ui.form.on("M-Book Form Work", {
    refresh: function (frm) {
        frm.trigger("boq_no");

        if (frappe.route_options && frappe.route_options.read_only) {
            frm.set_read_only();
            // Hide action buttons
            frm.page.btn_primary && frm.page.btn_primary.hide();
            frm.page.btn_secondary && frm.page.btn_secondary.hide();

            frappe.route_options = null;
        }
    },
    
    after_save: function (frm) {
        if (window.PourCardReturnHandler) {
            window.PourCardReturnHandler.handle_after_save();
        }
    }
});
