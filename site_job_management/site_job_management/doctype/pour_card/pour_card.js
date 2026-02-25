frappe.ui.form.on("Pour Card", {
    refresh: function (frm) {

        if (frm.is_new()) return;

        // ─── FIX 2: merged duplicate refresh handler ───────────────────────
        // Handle dashboard_refresh_needed flag (was in a separate handler)
        if (window._dashboard_refresh_needed && frm.doc.docstatus === 1) {
            let info = window._dashboard_refresh_needed;
            window._dashboard_refresh_needed = null; // clear immediately
            refresh_card_status(frm, info.doctypename);
            return;
        }
        // ────────────────────────────────────────────────────────────────────


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

        rerender_single_card(frm, 'BBS Shape');

        rerender_single_card(frm, 'M-Book Form Work');

        rerender_single_card(frm, 'M-Book Concrete Work');

        rerender_single_card(frm, 'Pour Card Report');


        // Only act when flag is set by bbs_shape after_save
        if (!window._dashboard_refresh_needed) return;

        // Only act when dashboard is visible (form submitted)
        if (frm.doc.docstatus !== 1) return;

        let info = window._dashboard_refresh_needed;

        // ✅ Clear flag immediately — prevents loop or double render
        window._dashboard_refresh_needed = null;

        // // ✅ Patch frm.doc with fresh status, then re-render only this card
        refresh_card_status(
            frm,
            info.doctypename
        );

    }

});


function rerender_single_card(frm, doctypename) {

    const config = {
        "BBS Shape": {
            mainfield: "shape_code",
            statusfield: "reinforcement_bbs_status",
            remarks_field: "reinforcement_bbs_rejected_reason"
        },
        "M-Book Form Work": {
            mainfield: "boq_no",
            statusfield: "mbook_form_status",
            remarks_field: "m_book_form_work_rejected_reason"
        },
        "M-Book Concrete Work": {
            mainfield: "boq_no",
            statusfield: "mbook_concrete_status",
            remarks_field: "m_book_concrete_work_rejected_reason"
        },
        "Pour Card Report": {
            mainfield: "report_no",
            statusfield: "pour_card_report_status",
            remarks_field: "pour_card_report_rejected_reason"
        }
    };

    if (!config[doctypename]) return;

    render(
        frm,
        doctypename,
        config[doctypename].mainfield,
        config[doctypename].statusfield,
        config[doctypename].remarks_field
    );
}



function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// ============================
// TABLE 1: BBS Shape
// ============================
function render(frm, doctypename, mainfield, statusfield, remarks_field) {
    if (!frm || !statusfield) return;
    let status = frm.doc[statusfield];
    // if (doctypename == "BBS Shape") { status = frm.doc.reinforcement_bbs_status || "Not Created"; }
    // else if (doctypename == "M-Book Form Work") { status = frm.doc.mbook_form_status || "Not Created"; }
    // else if (doctypename == "M-Book Concrete Work") { status = frm.doc.mbook_concrete_status || "Not Created"; }
    // else if (doctypename == "Pour Card Report") { status = frm.doc.pour_card_report_status || "Not Created"; }
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
            // ─── FIX 3: capture status in a local variable; never mutate it ──
            let display_status = status;
            // ─────────────────────────────────────────────────────────────────

            if (r.message && r.message.length > 0) {

                // If rows exist and status was Not Created → make Draft
                if (status === "Not Created") {
                    frm.set_value(statusfield, "Draft");
                    frm.doc[statusfield] = "Draft";
                    status = "Draft";
                }

                if (allow_edit) display_status = "Draft";

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
                                onclick="edit_shape('${doctypename}','${d.name}')">
                                Edit
                            </button>

                            <button class="btn btn-xs btn-danger"
                                onclick="delete_shape('${doctypename}','${d.name}', '${frm.doc.name}', '${statusfield}')">
                                Delete
                            </button>
                        `;
                    }

                    action_buttons += `</div>`;

                    if (mainfield == "shape_code") {
                        heading = "Shape Code";
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

                // ✅ No rows → force Not Created
                if (frm.doc[statusfield] !== "Not Created") {

                    frappe.call({
                        method: "frappe.client.set_value",
                        args: {
                            doctype: "Pour Card",
                            name: frm.doc.name,
                            fieldname: { [statusfield]: "Not Created" }
                        }
                    });

                    frm.doc[statusfield] = "Not Created";
                }

                status = "Not Created";

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

                if (status === 'Not Created') {
                    bottom_buttons = `
                            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                                <button class="btn btn-sm btn-primary"
                                    onclick="add_shape('${doctypename}','${frm.doc.name}')">
                                    + Add
                                </button>
                            </div>
                `;

                }


                else {
                    bottom_buttons = `
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                        <button class="btn btn-sm btn-primary"
                            onclick="add_shape('${doctypename}','${frm.doc.name}')">
                            + Add
                        </button>

                        <button class="btn btn-sm btn-success"
                            onclick="submit_bbs('${doctypename}','${frm.doc.name}','${statusfield}')">
                            Submit
                        </button>
                    </div>
                `;
                }
            }

            let reject_reason_html = "";

            if (status === "Rejected") {
                reject_reason_html = `
                    <span
                        class="reject-reason-btn"
                        data-remarks-field="${remarks_field}"
                        style="cursor: pointer;color: #000000;
                                font-size: 13px;
                                position: relative;
                                left: 285px;
                                background: #10b3f69e;
                                width: 80px;
                                text-align: center;
                                border-radius: 5px;
                                font-weight: bold;
                            "
                    >
                        Reason
                    </span>
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
                     ${reject_reason_html}

                

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

window.add_shape = function (doctypename, report_no) {

    let status_field =
        doctypename === "BBS Shape" ? "reinforcement_bbs_status" :
            doctypename === "M-Book Form Work" ? "mbook_form_status" :
                doctypename === "M-Book Concrete Work" ? "mbook_concrete_status" :
                    doctypename === "Pour Card Report" ? "pour_card_report_status" : null;

    let mainfield =
        doctypename === "BBS Shape" ? "shape_code" :
            doctypename === "BBS Shape" ? "shape_code" :
                doctypename === "BBS Shape" ? "shape_code" :
                    doctypename === "Pour Card Report" ? "report_no" : "boq_no";

    window._pour_card_return = {
        doctype: "Pour Card",
        name: report_no,
        status_field: status_field,
        doctypename: doctypename,  // ✅ FIX Bug 1
        mainfield: mainfield     // ✅ FIX Bug 1
    };

    frappe.new_doc(doctypename, {
        report_no: report_no
    });

    frm.set_value(statusfield, "Draft");
};

window.view_shape = function (doctypename, name) {
    frappe.route_options = { read_only: 1 };
    frappe.set_route("Form", doctypename, name);
};

window.edit_shape = function (doctypename, name) {
    frappe.set_route("Form", doctypename, name);
};

// ─── FIX 1: derive correct mainfield instead of hardcoding 'shape_code' ──────
window.delete_shape = function (doctypename, name) {

    frappe.call({
        method: "frappe.client.delete",
        args: {
            doctype: doctypename,
            name: name
        },
        freeze: false,
        callback: function (r) {
            if (!r.exc) {
                frappe.after_ajax(() => {
                    rerender_single_card(cur_frm, doctypename);
                });
            }
        }
    });
};

// ─────────────────────────────────────────────────────────────────────────────


window.submit_bbs = function (doctypename, pour_card_name, statusfield) {

    if (!statusfield) return;

    frappe.call({
        method: "frappe.client.set_value",
        args: {
            doctype: "Pour Card",
            name: pour_card_name,
            fieldname: {
                [statusfield]: "Submitted"
            }
        },
        freeze: false,
        callback: function (r) {

            if (!r.exc) {

                // Update local doc so render sees correct value
                cur_frm.doc[statusfield] = "Submitted";

                frappe.show_alert({
                    message: doctypename + " Submitted Successfully",
                    indicator: "green"
                });

                // Wait until all ajax complete
                frappe.after_ajax(() => {
                    rerender_single_card(cur_frm, doctypename);
                });
            }
        }
    });
};




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




// ------------------------------------------------------------
// FIX Bug 5 — refresh_card_status()
// Fetches FRESH status value from DB, patches stale frm.doc,
// then calls the existing render() — render() itself untouched
// ------------------------------------------------------------
function refresh_card_status(frm, doctypename) {

    let status_field =
        doctypename === "BBS Shape" ? "reinforcement_bbs_status" :
            doctypename === "M-Book Form Work" ? "mbook_form_status" :
                doctypename === "M-Book Concrete Work" ? "mbook_concrete_status" :
                    doctypename === "Pour Card Report" ? "pour_card_report_status" : null;

    if (!status_field) return;

    frappe.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Pour Card",
            name: frm.doc.name,
            fieldname: status_field
        },
        callback: function (r) {
            if (r.message) {
                // ✅ Patch local doc so render() sees correct status from DB
                frm.doc[status_field] = r.message[status_field];
            }
            // ✅ Call existing render() — completely untouched
            rerender_single_card(frm, doctypename);
        }
    });
}

