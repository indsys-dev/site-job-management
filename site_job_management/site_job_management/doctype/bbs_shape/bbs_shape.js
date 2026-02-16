// Copyright (c) 2026, Indsys and contributors
// For license information, please see license.txt

frappe.ui.form.on('BBS Shape', {
    refresh: function(frm) {

        if (frappe.route_options && frappe.route_options.read_only) {

            frm.set_read_only();

            // Hide action buttons
            frm.page.btn_primary && frm.page.btn_primary.hide();
            frm.page.btn_secondary && frm.page.btn_secondary.hide();

            frappe.route_options = null;
        }
    }
});

