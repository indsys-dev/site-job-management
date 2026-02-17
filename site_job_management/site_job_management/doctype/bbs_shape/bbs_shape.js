// Copyright (c) 2026, Indsys and contributors
// For license information, please see license.txt

frappe.ui.form.on('BBS Shape', {

    shape_code: function(frm) {
        if (!frm.doc.shape_code) return;

        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Shape",
                name: frm.doc.shape_code
            },
            callback: function(r) {
                if (r.message) {
                    let shape = r.message;

                    // Toggle fields based on Shape configuration
                    frm.toggle_display("a", shape.dim_a);
                    frm.toggle_display("b", shape.dim_b);
                    frm.toggle_display("c", shape.dim_c);
                    frm.toggle_display("d", shape.dim_d);
                    frm.toggle_display("e", shape.dim_e);
                    frm.toggle_display("f", shape.dim_f);
                    frm.toggle_display("g", shape.dim_g);
                    frm.toggle_display("h", shape.dim_h);
                }   
            }
        });
    },


    refresh: function(frm) {
        frm.trigger("shape_code");
        
        if (frappe.route_options && frappe.route_options.read_only) {
            frm.set_read_only();
            // Hide action buttons
            frm.page.btn_primary && frm.page.btn_primary.hide();
            frm.page.btn_secondary && frm.page.btn_secondary.hide();

            frappe.route_options = null;
        }
    }

});

frappe.ui.form.on("BBS Shape", {
    after_save: function (frm) {
    let ret = window._pour_card_return;

    if (ret && ret.doctype && ret.name) {
        window._pour_card_return = null;

        // ✅ Only update if status is currently "Not Created"
        // Avoids overwriting "Submitted" or "Rejected" if user edits again
        if (ret.status_field) {
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: ret.doctype,
                    name: ret.name,
                    fieldname: ret.status_field
                },
                callback: function (r) {
                    let current_status = r.message && r.message[ret.status_field];

                    // ✅ Only set Draft if currently Not Created
                    if (current_status === "Not Created" || !current_status) {
                        frappe.call({
                            method: "frappe.client.set_value",
                            args: {
                                doctype: ret.doctype,
                                name: ret.name,
                                fieldname: { [ret.status_field]: "Draft" }
                            },
                            callback: function () {
                                frappe.set_route("Form", ret.doctype, ret.name).then(function () {
                                    if (cur_frm && cur_frm.doctype === ret.doctype && cur_frm.docname === ret.name) {
                                        cur_frm.reload_doc();
                                    }
                                });
                            }
                        });
                    } else {
                        // Already Draft/Submitted/Rejected — just redirect
                        frappe.set_route("Form", ret.doctype, ret.name).then(function () {
                            if (cur_frm && cur_frm.doctype === ret.doctype && cur_frm.docname === ret.name) {
                                cur_frm.reload_doc();
                            }
                        });
                    }
                }
            });
        } else {
            // No status field — just redirect
            frappe.set_route("Form", ret.doctype, ret.name).then(function () {
                if (cur_frm && cur_frm.doctype === ret.doctype && cur_frm.docname === ret.name) {
                    cur_frm.reload_doc();
                }
            });
        }
    }
}
});
