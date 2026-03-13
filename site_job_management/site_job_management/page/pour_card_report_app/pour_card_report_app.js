
frappe.pages['pour-card-report-app'].on_page_load = function(wrapper) {
    wrapper.page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Pour Card Report Approval',
        single_column: true
    });
};

frappe.pages['pour-card-report-app'].on_page_show = function(wrapper) {
    let pour_card = frappe.get_route()[1] || frappe.route_options?.pour_card;

    if (!pour_card) {
        $(wrapper.page.body).html(`<h4 class="text-danger">Pour Card Not Found in URL</h4>`);
        return;
    }

    $(wrapper.page.body).empty();
    render_pour_card_report_approval(wrapper.page, pour_card);
};

function render_pour_card_report_approval(page, pour_card) {
    frappe.call({
        method: "site_job_management.site_job_management.page.pour_card_report_app.pour_card_report_app.get_data",
        args: { pour_card: pour_card },
        callback: function(r) {
            let data = r.message;

            // ------------------------------
            // MAIN HTML START
            // ------------------------------
            let html = `
                <div class="d-flex gap-5 mb-3 aprove">

                    <!-- Project Details Card -->
                    <div class="card p-3 flex-fill">
                        <div class="d-flex justify-content-between align-items-center"
                            style="cursor:pointer;"
                            onclick="toggleDetails('reportProjectDetailsBox','reportProjectArrow')">

                            <h5 class="mb-0">Project Details</h5>
                            <span id="reportProjectArrow">&#9660;</span>
                        </div>

                        <div id="reportProjectDetailsBox" style="display:none; margin-top:15px;">
                            <p><b>Project:</b> ${data.project.project_name}</p>
                            <p><b>Contractor:</b> ${data.project.contractor}</p>
                            <p><b>PMC:</b> ${data.project.pmc}</p>
                            <p><b>Client:</b> ${data.project.client}</p>
                            <p><b>Location:</b> ${data.project.site_location}</p>
                        </div>
                    </div>


                    <!-- Pour Card Details Card -->
                    <div class="card p-3 flex-fill">
                        <div class="d-flex justify-content-between align-items-center"
                            style="cursor:pointer;"
                            onclick="toggleDetails('reportPourDetailsBox','reportPourArrow')">

                            <h5 class="mb-0">Pour Card Details</h5>
                            <span id="reportPourArrow">&#9660;</span>
                        </div>

                        <div id="reportPourDetailsBox" style="display:none; margin-top:15px;">
                            <p><b>Pour Card:</b> ${data.pour_card.name}</p>
                            <p><b>Drawing:</b> ${data.pour_card.drawing_number}</p>
                            <p><b>Structure:</b> ${data.pour_card.structuremember_type}</p>
                            <p><b>Building:</b> ${data.pour_card.building}</p>
                            <p><b>Floor:</b> ${data.pour_card.floor}</p>
                        </div>
                    </div>

                </div>
            `;


            //  INSPECTION TABLE FROM PUBLIC JS FUNCTION
            html += site_job_management.render_pour_card_report_table(data);

            //  Render Full HTML
            $(page.body).html(html);

            // ==================================================
            // SIGNATURE
            // ==================================================
            if (data.signature && data.pour_card.pour_card_report_status === "Approved") {
                let sig_html = `
                    <div class="mt-4" style="display:flex; justify-content:flex-end;">
                        <div style="text-align:center; width:280px;">
                            <img
                                src="${data.signature}"
                                alt="Signature"
                                style="width:100%; max-height:100px; object-fit:contain;
                                       cursor:pointer;"
                                onclick="window.open('${data.signature}', '_blank')"
                            />
                            <div style="border-top:1px solid #333; margin-top:8px; padding-top:8px;">
                                <p style="margin:0; font-weight:600;">Approved by</p>
                                <p style="margin:0; color:#555;">Client/Consultant Engineer</p>
                                <p style="margin:0; color:#555;">${data.pour_card.client_engineer_name || ""}</p>
                            </div>
                        </div>
                    </div>
                `;

                $(page.body).append(sig_html);
            }


            // ==============================
            // APPROVE / REJECT BUTTONS
            // ==============================
            let button_html = `
                <div class="p-3 mt-4">
                    <div class="d-flex justify-content-end gap-3">
                        <button class="btn btn-success px-4" id="approve_btn" style="position: relative; right: 10px;">Approve</button>
                        <button class="btn btn-danger px-4" id="reject_btn">Reject</button>
                    </div>
                </div>
            `;
            if (
                site_job_management.security.role_manager.has_any_role([
                    "Client / Consultant Engineer",
                    "Administrator"
                ]) &&
                data.pour_card.pour_card_report_status === "Submitted"
            ) {
                $(page.body).append(button_html);
            }
            
            // ==============================
            // BUTTON EVENTS
            // ==============================
            $("#approve_btn").click(function() {
                frappe.call({
                    method: "site_job_management.site_job_management.page.pour_card_report_app.pour_card_report_app.approve",
                    args: { pour_card: pour_card },
                    callback: function() {
                        frappe.msgprint("Pour Card Report Approved");
                        frappe.set_route("approver-dashboard");
                    }
                });
            });

            $("#reject_btn").click(function() {
                let reason = prompt("Enter Rejection Reason:");

                frappe.call({
                    method: "site_job_management.site_job_management.page.pour_card_report_app.pour_card_report_app.reject",
                    args: { pour_card: pour_card, reason: reason },
                    callback: function() {
                        frappe.msgprint("Pour Card Report Rejected");
                        frappe.set_route("approver-dashboard");
                    }
                });
            });
        }
    });
}

// Accordion Function
window.toggleDetails = function(boxId, arrowId) {
    let box = document.getElementById(boxId);
    let arrow = document.getElementById(arrowId);
    if (box.style.display === "none") {
        box.style.display = "block";
        arrow.innerHTML = "&#9650;";
    } else {
        box.style.display = "none";
        arrow.innerHTML = "&#9660;";
    }
}
