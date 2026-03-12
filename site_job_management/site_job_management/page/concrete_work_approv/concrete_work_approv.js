frappe.pages['concrete-work-approv'].on_page_load = function(wrapper) {

    wrapper.page = frappe.ui.make_app_page({
        parent: wrapper,
        title: "M Book Concrete Work Approval",
        single_column: true
    });

};


// 🔥 Runs every time page opens (refresh fix)
frappe.pages['concrete-work-approv'].on_page_show = function(wrapper) {

    let pour_card = frappe.get_route()[1] || frappe.route_options?.pour_card;
    if (!pour_card) return;

    // Clear old content before loading new
    $(wrapper.page.body).empty();

    load_concrete_data(wrapper.page, pour_card);
};



// ===============================
// MAIN DATA LOADER
// ===============================
function load_concrete_data(page, pour_card) {

    frappe.call({
        method: "site_job_management.site_job_management.page.concrete_work_approv.concrete_work_approv.get_data",
        args: { pour_card: pour_card },

        callback: function(r) {

            let data = r.message;

            let html = `
                <div class="row g-3 mb-3">

                    <div class="col-md-6 p-2">
                        <div class="card p-3">
                            <div class="d-flex justify-content-between align-items-center"
                                style="cursor:pointer;"
                                onclick="toggleDetails('concreteProjectDetailsBox','concreteProjectArrow')">

                                <h4 class="mb-0">Project Details</h4>
                                <span id="concreteProjectArrow">&#9660;</span>
                            </div>

                            <div id="concreteProjectDetailsBox" style="display:none; margin-top:15px;">
                                <p><b>Project:</b> ${data.project.project_name}</p>
                                <p><b>Contractor:</b> ${data.project.contractor}</p>
                                <p><b>Client:</b> ${data.project.client}</p>
                                <p><b>Location:</b> ${data.project.site_location}</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-6 p-2">
                        <div class="card p-3">
                            <div class="d-flex justify-content-between align-items-center"
                                style="cursor:pointer;"
                                onclick="toggleDetails('concretePourDetailsBox','concretePourArrow')">

                                <h4 class="mb-0">Pour Card Details</h4>
                                <span id="concretePourArrow">&#9660;</span>
                            </div>

                            <div id="concretePourDetailsBox" style="display:none; margin-top:15px;">
                                <p><b>Pour Card:</b> ${data.pour_card.name}</p>
                                <p><b>Drawing:</b> ${data.pour_card.drawing_number}</p>
                                <p><b>Building:</b> ${data.pour_card.building}</p>
                                <p><b>Floor:</b> ${data.pour_card.floor}</p>
                            </div>
                        </div>
                    </div>

                </div>
            `;

            // Concrete Work Table
            html += ConcreteWorkTable.render(data.formwork_list);

            $(page.body).html(html);

            // ==================================================
            // SNAPSHOTS
            // ==================================================
            if (data.snapshots && data.snapshots.length > 0) {

                let snap_html = `
                    <div class="card p-3 mt-4">
                        <h4>Snapshots</h4>
                        <div class="row g-3 mt-2">
                `;

                data.snapshots.forEach((snap, index) => {
                    snap_html += `
                        <div class="col-6 col-md-4">
                            <div class="card p-1">
                                <p class="text-center mb-1" style="font-size:12px; color:#888;">
                                    Snapshot ${index + 1}
                                </p>
                                <img
                                    src="${snap.snapshot}"
                                    alt="Snapshot ${index + 1}"
                                    style="width:100%; height:200px; object-fit:cover; border-radius:6px; cursor:pointer;"
                                    onclick="window.open('${snap.snapshot}', '_blank')"
                                />
                            </div>
                        </div>
                    `;
                });

                snap_html += `</div></div>`;
                $(page.body).append(snap_html);
            }


            // ===============================
            // APPROVE / REJECT BUTTONS
            // ===============================
            if (
                site_job_management.security.role_manager.has_any_role([
                    "Client / Consultant Engineer",
                    "Administrator"
                ]) &&
                data.pour_card.mbook_concrete_status === "Submitted"
            ) {

                let button_html = `
                    <div class="p-3 mt-4">
                        <div class="d-flex justify-content-end gap-3">

                            <button class="btn btn-success px-4" id="approve_btn" style="position: relative; right: 10px;">
                                Approve
                            </button>

                            <button class="btn btn-danger px-4" id="reject_btn">
                                Reject
                            </button>

                        </div>
                    </div>
                `;

                $(page.body).append(button_html);

                $("#approve_btn").click(function() {

                    frappe.call({
                        method: "site_job_management.site_job_management.page.concrete_work_approv.concrete_work_approv.approve",
                        args: { pour_card: pour_card },
                        callback: function() {
                            frappe.msgprint("Concrete Work Approved Successfully");
                            frappe.set_route("approver-dashboard");
                        }
                    });

                });

                $("#reject_btn").click(function() {

                    let reason = prompt("Enter Rejection Reason:");
                    if (!reason) return;

                    frappe.call({
                        method: "site_job_management.site_job_management.page.concrete_work_approv.concrete_work_approv.reject",
                        args: {
                            pour_card: pour_card,
                            reason: reason
                        },
                        callback: function() {
                            frappe.msgprint("Concrete Work Rejected");
                            frappe.set_route("approver-dashboard");
                        }
                    });

                });

            }

        }
    });

}



// ===============================
// Accordion Function
// ===============================
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
