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

            let html = `
                <div class="row">
                <div class="col-6 card p-3 mb-3">
                    <h4>Project Details</h4>
                    <p><b>Project:</b> ${data.project.project_name}</p>
                    <p><b>Contractor:</b> ${data.project.contractor}</p>
                    <p><b>PMC:</b> ${data.project.pmc}</p>
                    <p><b>Client:</b> ${data.project.client}</p>
                    <p><b>Location:</b> ${data.project.site_location}</p>
                </div>
                <div class="col-6 card p-3 mb-3">
                    <h4>Pour Card Details</h4>
                    <p><b>Pour Card:</b> ${data.pour_card.name}</p>
                    <p><b>Drawing:</b> ${data.pour_card.drawing_number}</p>
                    <p><b>Structure:</b> ${data.pour_card.structuremember_type}</p>
                    <p><b>Building:</b> ${data.pour_card.building}</p>
                    <p><b>Floor:</b> ${data.pour_card.floor}</p>
                </div>
                </div>

                <div class="card p-3">
                    <h4>BBS Shapes</h4>
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Shape</th>
                                <th>Dia</th>
                                <th>NOM</th>
                                <th>NPM</th>
                                <th>Cutting Length</th>
                                <th>Total Length</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            data.bbs_shapes.forEach(row => {
                html += `
                    <tr>
                        <td>${row.shape_code}</td>
                        <td>${row.dia_value || ''}</td>
                        <td>${row.nom || ''}</td>
                        <td>${row.npm || ''}</td>
                        <td>${row.cutting_length || 0}</td>
                        <td>${row.total_length || 0}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                    <hr>
                </div>
            `;

            $(page.body).html(html);


            // SUMMARY TABLE

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

            // Total Length Row
            summary_html += `<tr><td><b>Total Length (m)</b></td>`;
            dias.forEach(dia => {
                summary_html += `<td>${data.summary[dia].total_length.toFixed(2)}</td>`;
            });
            summary_html += `</tr>`;

            // Unit Weight Row
            summary_html += `<tr><td><b>Unit Weight / m</b></td>`;
            dias.forEach(dia => {
                summary_html += `<td>${data.summary[dia].unit_weight}</td>`;
            });
            summary_html += `</tr>`;

            // Total Kg Row
            summary_html += `<tr><td><b>Total in Kg</b></td>`;
            dias.forEach(dia => {
                summary_html += `<td>${data.summary[dia].total_kg}</td>`;
            });
            summary_html += `</tr>`;

            // Total MT Row
            summary_html += `<tr><td><b>Total in MT</b></td>`;
            dias.forEach(dia => {
                summary_html += `<td>${data.summary[dia].total_mt}</td>`;
            });
            summary_html += `</tr>`;

            summary_html += `</tbody></table></div>`;

            $(page.body).append(summary_html);


            let button_html = `
                 <div class="card p-3 mt-4">
                    <button class="btn btn-success" id="approve_btn">
                        Approve
                    </button>

                    <button class="btn btn-danger" id="reject_btn">
                        Reject
                    </button>
                </div>
            `;
            $(page.body).append(button_html);

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
