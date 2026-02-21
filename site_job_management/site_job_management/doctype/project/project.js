// Copyright (c) 2026, Indsys and contributors
// For license information, please see license.txt

frappe.ui.form.on("Project", {
	refresh(frm) {

	},
    onload: function(frm) {
        frm.set_query('requester_engineer', function() {
            return {
                filters: {
                    category: 'Requester Engineer'
                }
            };
        });

        frm.set_query('client__consultant_engineer', function() {
            return {
                filters: {
                    category: 'Client / Consultant Engineer'
                }
            };
        });

        frm.set_query('qc_engineer', function() {
            return {
                filters: {
                    category: 'QC Engineer'
                }
            };
        });

    }
});
