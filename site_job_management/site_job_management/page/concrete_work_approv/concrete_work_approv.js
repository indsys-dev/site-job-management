frappe.pages['concrete-work-approv'].on_page_load = function(wrapper) {

    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: "M Book Concrete Work Approval",
        single_column: true
    });

    let pour_card = frappe.get_route()[1];

    if (!pour_card) {
        $(page.body).html(`<h4 class="text-danger">Pour Card Not Found in URL</h4>`);
        return;
    }

    //  Call Backend
    frappe.call({
        method: "site_job_management.site_job_management.page.concrete_work_approv.concrete_work_approv.get_data",
        args: { pour_card: pour_card },
        callback: function(r) {

            let data = r.message;

            // ===============================
            // MAIN HTML START (Old Style)
            // ===============================

            let html = `
                <div class="row g-3 mb-3">

                    <!-- PROJECT DETAILS -->
                    <div class="col-md-6 p-2">
                        <div class="card p-3">

                            <div class="d-flex justify-content-between align-items-center"
                                style="cursor:pointer;"
                                onclick="toggleDetails('projectDetailsBox','projectArrow')">

                                <h4 class="mb-0">Project Details</h4>
                                <span id="projectArrow">&#9660;</span>
                            </div>

                            <div id="projectDetailsBox" style="display:none; margin-top:15px;">
                                <p><b>Project:</b> ${data.project.project_name}</p>
                                <p><b>Contractor:</b> ${data.project.contractor}</p>
                                <p><b>Client:</b> ${data.project.client}</p>
                                <p><b>Location:</b> ${data.project.site_location}</p>
                            </div>

                        </div>
                    </div>

                    <!-- POUR CARD DETAILS -->
                    <div class="col-md-6 p-2">
                        <div class="card p-3">

                            <div class="d-flex justify-content-between align-items-center"
                                style="cursor:pointer;"
                                onclick="toggleDetails('pourDetailsBox','pourArrow')">

                                <h4 class="mb-0">Pour Card Details</h4>
                                <span id="pourArrow">&#9660;</span>
                            </div>

                            <div id="pourDetailsBox" style="display:none; margin-top:15px;">
                                <p><b>Pour Card:</b> ${data.pour_card.name}</p>
                                <p><b>Drawing:</b> ${data.pour_card.drawing_number}</p>
                                <p><b>Building:</b> ${data.pour_card.building}</p>
                                <p><b>Floor:</b> ${data.pour_card.floor}</p>
                            </div>

                        </div>
                    </div>

                </div>


                <!-- ========================= -->
                <!-- FORM WORK TABLE -->
                <!-- ========================= -->

                <div class="card p-3">
                    <h4>M-Book Form Work Table</h4>

                    <table class="table table-bordered text-center align-middle">
                        <thead>
                            <tr>
                                <th>BOQ No</th>
                                <th>Level</th>
                                <th>Reference</th>
                                <th>Unit</th>
                                <th>NOM</th>
                                <th>NPM</th>
                                <th>Length</th>
                                <th>Breadth</th>
                                <th>Depth</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>

                        <tbody>
            `;

            // ===============================
            // TABLE ROWS
            // ===============================

            if (data.formwork_list.length > 0) {

                data.formwork_list.forEach(row => {

                    html += `
                        <tr>
                            <td>${row.boq_no || ""}</td>
                            <td>${row.level || ""}</td>
                            <td>${row.reference || ""}</td>
                            <td>${row.unit || ""}</td>
                            <td>${row.nom || ""}</td>
                            <td>${row.npm || ""}</td>
                            <td>${row.length || ""}</td>
                            <td>${row.breadth || ""}</td>
                            <td>${row.depth || ""}</td>
                            <td>${row.remarks || ""}</td>
                        </tr>
                    `;

                });

            } else {

                html += `
                    <tr>
                        <td colspan="10" class="text-muted">
                            No Form Work Records Found
                        </td>
                    </tr>
                `;

            }

            html += `
                        </tbody>
                    </table>
                </div>
            `;

            // Render HTML
            $(page.body).html(html);

            // ===============================
            // APPROVE / REJECT BUTTONS
            // ===============================

            let button_html = `
                <div class="p-3 mt-4">
                    <div class="d-flex justify-content-end gap-3">

                        <button class="btn btn-success px-4" id="approve_btn">
                            Approve
                        </button>

                        <button class="btn btn-danger px-4" id="reject_btn">
                            Reject
                        </button>

                    </div>
                </div>
            `;

            $(page.body).append(button_html);

            // ===============================
            // BUTTON EVENTS
            // ===============================

            $("#approve_btn").click(function() {

                frappe.call({
                    method: "site_job_management.site_job_management.page.concrete_work_approv.concrete_work_approv.approve",
                    args: { pour_card: pour_card },
                    callback: function() {
                        frappe.msgprint("Form Work Approved Successfully");
                        frappe.set_route("approver-dashboard");
                    }
                });

            });

            $("#reject_btn").click(function() {

                let reason = prompt("Enter Rejection Reason:");

                frappe.call({
                    method: "site_job_management.site_job_management.page.concrete_work_approv.concrete_work_approv.reject",
                    args: {
                        pour_card: pour_card,
                        reason: reason
                    },
                    callback: function() {
                        frappe.msgprint("Form Work Rejected");
                        frappe.set_route("approver-dashboard");
                    }
                });

            });

        }
    });

};


function toggleDetails(boxId, arrowId) {

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