// Common Return Handler for Child Forms
window.PourCardReturnHandler = {

    handle_after_save: function () {

        let ret = window._pour_card_return;

        if (!ret || !ret.doctype || !ret.name) return;

        window._pour_card_return = null;

        // If status field exists → check before updating
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

                    // Only set Draft if currently Not Created or empty
                    if (current_status === "Not Created" || !current_status) {

                        frappe.call({
                            method: "frappe.client.set_value",
                            args: {
                                doctype: ret.doctype,
                                name: ret.name,
                                fieldname: { [ret.status_field]: "Draft" }
                            },
                            callback: function () {
                                PourCardReturnHandler.redirect(ret);
                            }
                        });

                    } else {
                        PourCardReturnHandler.redirect(ret);
                    }
                }
            });

        } else {
            PourCardReturnHandler.redirect(ret);
        }
    },

    redirect: function (ret) {

        frappe.set_route("Form", ret.doctype, ret.name).then(function () {

            if (cur_frm &&
                cur_frm.doctype === ret.doctype &&
                cur_frm.docname === ret.name) {

                cur_frm.reload_doc();
            }

        });
    }

};
