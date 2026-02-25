// ===============================================
// COMMON APPROVAL / REJECTION UTILITIES
// ===============================================

window.ApprovalUtils = {

    // ------------------------------
    // Status Card + View Reason
    // ------------------------------
    renderStatusCard: function (title, status, reject_reason, button_id) {

        return `
            <div class="card p-3 mb-3 d-flex justify-content-between align-items-center flex-row">
                <h4 class="mb-0">${title}</h4>

                <div class="d-flex align-items-center gap-2">
                    <span class="badge ${
                        status === "Rejected"
                            ? "bg-danger"
                            : status === "Approved"
                            ? "bg-success"
                            : "bg-secondary"
                    }">
                        ${status || "Pending"}
                    </span>

                    ${
                        status === "Rejected"
                        ? `<button class="btn btn-outline-danger btn-sm view-reason-btn"
                                   data-reason="${encodeURIComponent(reject_reason || '')}"
                                   id="${button_id}">
                                View Reason
                           </button>`
                        : ``
                    }
                </div>
            </div>
        `;
    },

    // ------------------------------
    // Bind View Reason Click
    // ------------------------------
    bindViewReason: function () {

        $(document).off("click", ".view-reason-btn");

        $(document).on("click", ".view-reason-btn", function () {

            let reason = decodeURIComponent($(this).data("reason"));

            frappe.msgprint({
                title: "Rejection Reason",
                message: reason || "No rejection reason provided",
                indicator: "red"
            });
        });
    },

    // ------------------------------
    // Reject with Prompt
    // ------------------------------
    rejectWithReason: function (options) {

        frappe.prompt(
            [{
                fieldname: "reason",
                fieldtype: "Small Text",
                label: "Rejection Reason",
                reqd: 1
            }],
            function (data) {

                frappe.call({
                    method: options.method,
                    args: {
                        pour_card: options.pour_card,
                        reason: data.reason
                    },
                    callback: function () {
                        frappe.msgprint(options.success_message || "Rejected");
                        options.on_success && options.on_success();
                    }
                });
            },
            "Reject",
            "Reject"
        );
    }
};