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
