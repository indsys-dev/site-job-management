frappe.pages['reinforcement-bbs-ap'].on_page_load = function(wrapper) {

    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Reinforcement BBS Approval',
        single_column: true
    });

    let pour_card = frappe.get_route()[1];

    frappe.call({
        method: "site_job_management.site_job_management.page.reinforcement_bbs_ap.reinforcement_bbs_ap.get_data",
        args: { pour_card: pour_card },

        callback: function(r) {

            let data = r.message;

            // ==================================================
            // DIMENSION FIELDS
            // ==================================================
            let dim_fields = ["a","b","c","d","e","f","g","h"];

            function hasValue(val) {
                if (val === null || val === undefined) return false;

                let str = val.toString().trim();

                return str !== "" && parseFloat(str) !== 0;
            }


            // ==================================================
            // FIND WHICH DIMENSIONS HAVE VALUES
            // ==================================================

            let visible_dims = dim_fields.filter(field => {
                return data.bbs_shapes.some(row => hasValue(row[field]));
            });


            if (visible_dims.length === 0) {
                visible_dims = ["a"];
            }

            // ==================================================
            // MAIN HTML START
            // ==================================================
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
                                <p><b>PMC:</b> ${data.project.pmc}</p>
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
                                <p><b>Structure:</b> ${data.pour_card.structuremember_type}</p>
                                <p><b>Building:</b> ${data.pour_card.building}</p>
                                <p><b>Floor:</b> ${data.pour_card.floor}</p>
                            </div>

                        </div>
                    </div>

                </div>


                <!-- ================================================= -->
                <!-- BBS SHAPES TABLE -->
                <!-- ================================================= -->

                <div class="card p-3">
                    <h4>BBS Shapes</h4>

                    <table class="table table-bordered text-center align-middle">

                        <thead>

                            <tr>
                                <th rowspan="2">Shape</th>

                                <th colspan="${visible_dims.length}">
                                    Bending Dimensions (M)
                                </th>

                                <th rowspan="2">Dia</th>
                                <th rowspan="2">NOM</th>
                                <th rowspan="2">NPM</th>
                                <th rowspan="2">Cut Length</th>
                                <th rowspan="2">Total Length</th>
                            </tr>

                            <tr>
            `;

            // Print bending headers
            visible_dims.forEach(dim => {
                html += `<th>${dim.toUpperCase()}</th>`;
            });

            html += `
                            </tr>
                        </thead>

                        <tbody>
            `;

            // ==================================================
            // TABLE BODY ROWS
            // ==================================================
            data.bbs_shapes.forEach(row => {

                html += `<tr>`;

                html += `<td>${row.shape_code || ""}</td>`;

                visible_dims.forEach(dim => {
                    let val = row[dim];
                    html += `<td>${hasValue(val) ? val : ""}</td>`;
                });

                html += `
                    <td>${row.dia_value || ""}</td>
                    <td>${row.nom || ""}</td>
                    <td>${row.npm || ""}</td>
                    <td>${row.cutting_length || ""}</td>
                    <td>${row.total_length || ""}</td>
                `;

                html += `</tr>`;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;

            // Render main table
            $(page.body).html(html);

            // ==================================================
            // SUMMARY TABLE
            // ==================================================
            let dias = Object.keys(data.summary).sort((a, b) => a - b);

            let summary_html = `
                <div class="card p-3 mt-4">
                    <h4>Dia Summary</h4>

                    <table class="table table-bordered text-center">
                        <thead>
                            <tr>
                                <th></th>
            `;

            dias.forEach(dia => {
                summary_html += `<th>${dia} mm</th>`;
            });

            summary_html += `</tr></thead><tbody>`;

            summary_html += `<tr><td><b>Total Length (m)</b></td>`;
            dias.forEach(dia => {
                summary_html += `<td>${data.summary[dia].total_length.toFixed(2)}</td>`;
            });
            summary_html += `</tr>`;

            summary_html += `<tr><td><b>Unit Weight / m</b></td>`;
            dias.forEach(dia => {
                summary_html += `<td>${data.summary[dia].unit_weight}</td>`;
            });
            summary_html += `</tr>`;

            summary_html += `<tr><td><b>Total Kg</b></td>`;
            dias.forEach(dia => {
                summary_html += `<td>${data.summary[dia].total_kg}</td>`;
            });
            summary_html += `</tr>`;

            summary_html += `<tr><td><b>Total MT</b></td>`;
            dias.forEach(dia => {
                summary_html += `<td>${data.summary[dia].total_mt}</td>`;
            });
            summary_html += `</tr>`;

            summary_html += `</tbody></table></div>`;

            $(page.body).append(summary_html);

            // ==================================================
            // APPROVE / REJECT BUTTONS
            // ==================================================
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

            // Role Check
            if (site_job_management.security.role_manager.has_any_role([
                "Client / Consultant Engineer",
                "Administrator"
            ])) {

                $(page.body).append(button_html);

            }

            // ==================================================
            // BUTTON EVENTS
            // ==================================================
            $("#approve_btn").click(function() {

                frappe.call({
                    method: "site_job_management.site_job_management.page.reinforcement_bbs_ap.reinforcement_bbs_ap.approve",
                    args: { pour_card: pour_card },

                    callback: function() {
                        frappe.msgprint("Reinforcement BBS Approved");
                        frappe.set_route("approver-dashboard");
                    }
                });

            });


            $("#reject_btn").click(function() {

                let reason = prompt("Enter Rejection Reason:");
                if (!reason) return;

                frappe.call({
                    method: "site_job_management.site_job_management.page.reinforcement_bbs_ap.reinforcement_bbs_ap.reject",
                    args: {
                        pour_card: pour_card,
                        reason: reason
                    },

                    callback: function() {
                        frappe.msgprint("Reinforcement BBS Rejected");
                        frappe.set_route("approver-dashboard");
                    }
                });

            });

        }
    });

};


// ==========================================================
// ACCORDION FUNCTION
// ==========================================================
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
