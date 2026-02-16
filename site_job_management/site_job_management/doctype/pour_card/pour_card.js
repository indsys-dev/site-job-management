frappe.ui.form.on('Pour Card', {
    refresh: function(frm) {

        if (frm.is_new()) return;

        render_bbs_shape_card(frm);
    }
});


function render_bbs_shape_card(frm) {

    let status = frm.doc.reinforcement_bbs_status || "Not Created";
    let allow_edit = ["Not Created", "Draft", "Rejected"].includes(status);

    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "BBS Shape",
            filters: { report_no: frm.doc.name },
            fields: ["name", "shape_code"],
            order_by: "creation desc"
        },
        callback: function(r) {

            let rows = "";

            if (r.message && r.message.length > 0) {

                r.message.forEach(function(d) {

                    let action_buttons = `
                        <button class="btn btn-xs btn-info"
                            onclick="view_shape('${d.name}')">
                            View
                        </button>
                    `;

                    if (allow_edit) {
                        action_buttons += `
                            <button class="btn btn-xs btn-warning"
                                onclick="edit_shape('${d.name}')">
                                Edit
                            </button>

                            <button class="btn btn-xs btn-danger"
                                onclick="delete_shape('${d.name}', '${frm.doc.name}')">
                                Delete
                            </button>
                        `;
                    }

                    rows += `
                        <tr>
                            <td>${d.shape_code || ""}</td>
                            <td>${action_buttons}</td>
                        </tr>
                    `;
                });

            } else {

                rows = `
                    <tr>
                        <td colspan="3" class="text-center text-muted">
                            No Shapes Added
                        </td>
                    </tr>
                `;
            }

            let bottom_buttons = "";

            if (allow_edit) {

                bottom_buttons = `
                    <div class="mt-3 text-right">
                        <button class="btn btn-primary"
                            onclick="add_shape('${frm.doc.name}')">
                            Add Shape
                        </button>

                        <button class="btn btn-success"
                            onclick="submit_bbs('${frm.doc.name}')">
                            Submit
                        </button>
                    </div>
                `;
            }

            let html = `
                <div class="card shadow-sm p-3">

                    <div class="d-flex justify-content-between">
                        <h5>BBS Shape</h5>
                        <span class="badge badge-info">${status}</span>
                    </div>

                    <hr>

                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Shape Code</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>

                    ${bottom_buttons}

                </div>
            `;

            frm.fields_dict.dashboard_view.$wrapper.html(html);
        }
    });
}


// Add
window.add_shape = function(report_no) {
    frappe.new_doc("BBS Shape", {
        report_no: report_no
    });
};

// View
window.view_shape = function(name) {

    frappe.route_options = {
        read_only: 1
    };

    frappe.set_route("Form", "BBS Shape", name);

};


// Edit
window.edit_shape = function(name) {
    frappe.set_route("Form", "BBS Shape", name);
};

// Delete
window.delete_shape = function(name, pour_card) {

    frappe.confirm("Are you sure you want to delete?", function() {

        frappe.call({
            method: "frappe.client.delete",
            args: {
                doctype: "BBS Shape",
                name: name
            },
            callback: function() {
                frappe.msgprint("Deleted Successfully");
                frappe.set_route("Form", "Pour Card", pour_card);
            }
        });

    });
};


// Submit
window.submit_bbs = function(pour_card_name) {

    frappe.call({
        method: "frappe.client.set_value",
        args: {
            doctype: "Pour Card",
            name: pour_card_name,
            fieldname: {
                reinforcement_bbs_status: "Submitted"
            }
        },
        callback: function() {
            frappe.msgprint("Reinforcement BBS Submitted");
            frappe.set_route("Form", "Pour Card", pour_card_name);
        }
    });

};
