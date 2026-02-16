frappe.ui.form.on("Pour Card", {
    refresh: function (frm) {

        if (frm.is_new()) return;

        if (frm.doc.reinforcement_bbs_status === "Submitted") {

            frm.add_custom_button("BBS Approval Page", function() {
                frappe.set_route("reinforcement-bbs-ap", frm.doc.name);
            });
        }

        let wrapper = frm.fields_dict.dashboard_view.$wrapper;
        wrapper.empty();
        // ✅ Only render if Submitted
        if (frm.doc.docstatus !== 1) {
            wrapper.html(`
                <div style="
                    padding:20px;
                    text-align:center;
                    color:#888;
                    font-size:14px;
                ">
                    Dashboard available after submission.
                </div>
            `);
            return;
        }


        // ✅ Create responsive grid
        wrapper.append(`
            <div id="dashboard-grid"
                style="
                    display:grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap:16px;
                ">

                <div id="box-bbs"></div>
                <div id="box-form"></div>
                <div id="box-concrete"></div>
                <div id="box-report"></div>

            </div>
        `);
        render(frm, 'BBS Shape', 'shape_code');
        render(frm, 'M-Book Form Work', 'boq_no');
        render(frm, 'M-Book Concrete Work', 'boq_no');
        render(frm, 'Pour Card Report', 'report_no');
    }
});


// ============================
// TABLE 1: BBS Shape
// ============================
function render(frm, doctypename, mainfield) {
    let status = "";
    if (doctypename == "BBS Shape") { status = frm.doc.reinforcement_bbs_status || "Not Created"; }
    else if (doctypename == "M-Book Form Work") { status = frm.doc.mbook_form_status || "Not Created"; }
    else if (doctypename == "M-Book Concrete Work") { status = frm.doc.mbook_concrete_status || "Not Created"; }
    else if (doctypename == "Pour Card Report") { status = frm.doc.pour_card_report_status || "Not Created"; }
    let allow_edit = ["Not Created", "Draft", "Rejected"].includes(status);
    let status_style =
        status === "Submitted"
            ? "color:#1a7f37;"
            : status === "Rejected"
                ? "color:#b42318;"
                : status === "Draft"
                    ? "color:#b54708;"
                    : "color:#005eff;";


    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: doctypename,
            filters: { report_no: frm.doc.name },
            fields: ["name", mainfield],
            order_by: "creation desc"
        },
        callback: function (r) {

            let rows = "";
            let heading = "";
            if (r.message && r.message.length > 0) {

                r.message.forEach(function (d) {

                    let action_buttons = `
                        <div style="display:flex; gap:6px;">
                            <button class="btn btn-xs btn-default"
                                onclick="view_shape('${doctypename}','${d.name}')">
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

                    action_buttons += `</div>`;

                    if (mainfield == "shape_code") {
                        heading = "Shape Code";
                        status = frm.doc.reinforcement_bbs_status || "Not Created";
                        rows += `
                            <tr>
                                <td style="padding:10px 12px;">
                                    ${d.shape_code || ""}
                                </td>
                                <td style="padding:10px 12px;">
                                    ${action_buttons}
                                </td>
                            </tr>
                        `;
                    }
                    else if (doctypename == "M-Book Form Work" & mainfield == "boq_no") {
                        heading = "BoQ No";
                        rows += `
                            <tr>
                                <td style="padding:10px 12px;">
                                    ${d.boq_no || ""}
                                </td>
                                <td style="padding:10px 12px;">
                                    ${action_buttons}
                                </td>
                            </tr>
                        `;
                    }
                    else if (doctypename == "M-Book Concrete Work" & mainfield == "boq_no") {
                        heading = "BoQ No";
                        rows += `
                            <tr>
                                <td style="padding:10px 12px;">
                                    ${d.boq_no || ""}
                                </td>
                                <td style="padding:10px 12px;">
                                    ${action_buttons}
                                </td>
                            </tr>
                        `;
                    }
                    else if (mainfield == "report_no") {
                        heading = "Report";
                        rows += `
                            <tr>
                                <td style="padding:10px 12px;">
                                    ${d.report_no || ""}
                                </td>
                                <td style="padding:10px 12px;">
                                    ${action_buttons}
                                </td>
                            </tr>
                        `;
                    }
                });

            } else {

                rows = `
                    <tr>
                        <td colspan="2" style="text-align:center; padding:12px; color:#888;">
                            No Item Added
                        </td>
                    </tr>
                `;
            }

            let bottom_buttons = "";

            if (allow_edit) {
                bottom_buttons = `
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                        <button class="btn btn-sm btn-primary"
                            onclick="add_shape('${doctypename}','${frm.doc.name}')">
                            + Add
                        </button>

                        <button class="btn btn-sm btn-success"
                            onclick="submit_bbs('${frm.doc.name}')">
                            Submit
                        </button>
                    </div>
                `;
            }

            let html = `
                <div style="
                        border:1px solid #e5e7eb;
                        border-radius:12px;
                        padding:16px;
                        background:#fff;
                        height:100%;
                        display:flex;
                        flex-direction:column;
                        justify-content:space-between;
                    ">

                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0; font-size:15px; font-weight:600;">
                            ${doctypename}
                        </h4>

                        <span style="font-size:14px; padding:4px 10px; border-radius:999px; font-weight:600; ${status_style}">
                            ${status}
                        </span>
                    </div>

                    <hr>

                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>${heading}</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>

                    ${bottom_buttons}
                </div>
            `;
            let target_box = "";

            if (doctypename === "BBS Shape")
                target_box = "#box-bbs";
            else if (doctypename === "M-Book Form Work")
                target_box = "#box-form";
            else if (doctypename === "M-Book Concrete Work")
                target_box = "#box-concrete";
            else if (doctypename === "Pour Card Report")
                target_box = "#box-report";

            $(target_box).html(html);
        }
    });


}


// ============================
// TABLE 2: M-Book Concrete Work (FIXED)
// ============================
// function render_mbook_card(frm) {

//     let status = frm.doc.mbook_concrete_status || "Not Created";
//     let allow_edit = ["Not Created", "Draft", "Rejected"].includes(status);

//     let status_style =
//         status === "Submitted"
//             ? "color:#1a7f37;"
//         : status === "Rejected"
//             ? "color:#b42318;"
//         : status === "Draft"
//             ? "color:#b54708;"
//         : "color:#005eff;";


//     frappe.call({
//         method: "frappe.client.get_list",
//         args: {
//             doctype: "M-Book Concrete Work",
//             filters: { report_no: frm.doc.name },
//             fields: ["name", "boq_no"],
//             order_by: "creation desc"
//         },
//         callback: function (r) {
//             let doctypename = "M-Book Concrete Work"
//             let rows = "";

//             if (r.message && r.message.length > 0) {

//                 r.message.forEach(function (d) {

//                     let action_buttons = `
//                         <div style="display:flex; gap:6px;">
//                             <button class="btn btn-xs btn-default"
//                                 onclick="view_mbook('${d.name}')">
//                                 View
//                             </button>
//                     `;

//                     if (allow_edit) {
//                         action_buttons += `
//                             <button class="btn btn-xs btn-warning"
//                                 onclick="edit_mbook('${d.name}')">
//                                 Edit
//                             </button>

//                             <button class="btn btn-xs btn-danger"
//                                 onclick="delete_mbook('${d.name}', '${frm.doc.name}')">
//                                 Delete
//                             </button>
//                         `;
//                     }

//                     action_buttons += `</div>`;

//                     rows += `
//                         <tr>
//                             <td style="padding:10px 12px;">
//                                 ${d.boq_no || ""}
//                             </td>
//                             <td style="padding:10px 12px;">
//                                 ${action_buttons}
//                             </td>
//                         </tr>
//                     `;
//                 });

//             } else {

//                 rows = `
//                     <tr>
//                         <td colspan="2" style="text-align:center; padding:12px; color:#888;">
//                             No M-Book Records Added
//                         </td>
//                     </tr>
//                 `;
//             }

//             let bottom_buttons = "";

//             if (allow_edit) {
//                 bottom_buttons = `
//                     <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
//                         <button class="btn btn-sm btn-primary"
//                             onclick="add_shape('${doctypename}','${frm.doc.name}')">
//                             + Add M-Book
//                         </button>

//                         <button class="btn btn-sm btn-success"
//                             onclick="submit_mbook('${frm.doc.name}')">
//                             Submit
//                         </button>
//                     </div>
//                 `;
//             }

//             let html = `
//                 <div style="border:1px solid #e5e7eb; border-radius:12px; padding:16px; background:#fff;">

//                     <div style="display:flex; justify-content:space-between; align-items:center;">
//                         <h4 style="margin:0; font-size:15px; font-weight:600;">
//                             M-Book Concrete Work
//                         </h4>

//                         <span style="font-size:12px; padding:4px 10px; border-radius:999px; font-weight:600; ${status_style}">
//                             ${status}
//                         </span>
//                     </div>

//                     <hr>

//                     <table class="table table-sm">
//                         <thead>
//                             <tr>
//                                 <th>BOQ No</th>
//                                 <th>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>${rows}</tbody>
//                     </table>

//                     ${bottom_buttons}
//                 </div>
//             `;

//             frm.fields_dict.dashboard_view.$wrapper.append(html);
//         }
//     });
// }


// ============================
// ACTIONS: BBS Shape
// ============================
window.add_shape = function (doctypename, report_no) {
    frappe.new_doc(doctypename, {
        report_no: report_no
    });

};

window.view_shape = function (doctypename, name) {
    frappe.route_options = { read_only: 1 };
    frappe.set_route("Form", doctypename, name);
};

window.edit_shape = function (name) {
    frappe.set_route("Form", "BBS Shape", name);
};

window.delete_shape = function (name, pour_card) {
    frappe.call({
        method: "frappe.client.delete",
        args: { doctype: "BBS Shape", name },
        callback: function () {
            frappe.msgprint("Deleted Successfully");
            frappe.reload_doc();
        }
    });
};

window.submit_bbs = function (pour_card_name) {
    frappe.call({
        method: "frappe.client.set_value",
        args: {
            doctype: "Pour Card",
            name: pour_card_name,
            fieldname: { reinforcement_bbs_status: "Submitted" }
        },
        callback: function () {
            frappe.msgprint("BBS Submitted Successfully");
            frappe.reload_doc();
        }
    });
};


// ============================
// ACTIONS: M-Book Concrete Work
// ============================

// window.view_mbook = function (name) {
//     frappe.route_options = { read_only: 1 };
//     frappe.set_route("Form", "M-Book Concrete Work", name);
// };

// window.edit_mbook = function (name) {
//     frappe.set_route("Form", "M-Book Concrete Work", name);
// };

// window.delete_mbook = function (name, pour_card) {
//     frappe.call({
//         method: "frappe.client.delete",
//         args: { doctype: "M-Book Concrete Work", name },
//         callback: function () {
//             frappe.msgprint("Deleted Successfully");
//             frappe.reload_doc();
//         }
//     });
// };

// window.submit_mbook = function (pour_card_name) {
//     frappe.call({
//         method: "frappe.client.set_value",
//         args: {
//             doctype: "Pour Card",
//             name: pour_card_name,
//             fieldname: { mbook_concrete_status: "Submitted" }
//         },
//         callback: function () {
//             frappe.msgprint("M-Book Submitted Successfully");
//             frappe.reload_doc();
//         }
//     });
// };


// corresponding drawing
frappe.ui.form.on('Pour Card', {
    // Trigger when form is loaded or refreshed
    onload: function (frm) {
        // Set initial filter for drawing_number
        set_drawing_number_filter(frm);
    },

    // Trigger when form is refreshed
    refresh: function (frm) {
        // Re-apply filter on refresh
        set_drawing_number_filter(frm);
    },

    // Trigger when project_name field changes
    project_name: function (frm) {
        // Clear the drawing_number when project changes
        frm.set_value('drawing_number', '');

        // Update the filter for drawing_number
        set_drawing_number_filter(frm);

        // Optional: Show a message to the user
        if (frm.doc.project_name) {
            frappe.show_alert({
                message: __('Drawing Number list updated for selected project'),
                indicator: 'green'
            }, 3);
        }
    }
});

// Helper function to set the query filter
function set_drawing_number_filter(frm) {
    frm.set_query('drawing_number', function () {
        if (!frm.doc.project_name) {
            // If no project is selected, show no drawings
            return {
                filters: {
                    'name': ['=', ''] // This returns an empty list
                }
            };
        }

        // Filter drawings by the selected project
        return {
            filters: {
                'project': frm.doc.project_name
            }
        };
    });
}


