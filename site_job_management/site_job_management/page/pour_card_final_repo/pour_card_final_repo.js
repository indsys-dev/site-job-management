frappe.require("/assets/site_job_management/css/final-report.css");

frappe.pages['pour-card-final-repo'].on_page_load = function(wrapper) {

    // Create page and attach to wrapper
    wrapper.page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Pour Card Final Report',
        single_column: true
    });

    wrapper.page.set_primary_action("Print", function() {
        window.print();
    });

    $(wrapper.page.body).append(`
        <div id="final-report-container"></div>
    `);
};


frappe.pages['pour-card-final-repo'].on_page_show = function(wrapper) {

    // Always reference wrapper.page (NOT global page)
    let page = wrapper.page;

    $("#final-report-container").empty();

    let route = frappe.get_route();
    let pour_card = route[1] || frappe.route_options?.pour_card;

    if (!pour_card) return;

    load_report(page, pour_card);
};

function load_report(page, pour_card) {

    if (!pour_card) return;

    $("#final-report-container").html("<p>Loading...</p>");

    frappe.call({
        method: "site_job_management.site_job_management.page.pour_card_final_repo.pour_card_final_repo.get_data",
        args: { pour_card: pour_card },
        freeze: true,
        callback: function(r) {

            if (!r.message) {
                $("#final-report-container").html("<p>No Data Found</p>");
                return;
            }

            let data = r.message;

            let report_html = `
                <div class="print-area">
                    <div id="a4-report" class="a4-container">

                        <div class="report-top">
                            <div class="report-title">
                                <h2>POUR CARD APPROVAL REPORT</h2>
                                <p>${data.project.project_name} | ${data.project.site_location}</p>
                            </div>
                        </div>

                        <div class="report-body">
                            ${PourCardReportRenderer.render_full_report(data)}
                        </div><br>

                        <div class="report-body">
                            ${MBookFormWorkTable.render(data.formwork_list)}
                        </div><br>

                        <div class="report-body">
                            ${ConcreteWorkTable.render(data.concrete_work)}
                        </div>

                        <div class="report-body">
                            ${site_job_management.render_pour_card_report_table({
                                formwork_list: data.report_list
                            })}
                        </div>

                        <div class="report-signatures">
                            ${ReportSignatureRenderer.render_signatures({
                                prepared_by: data.pour_owner_name || data.pour_card.owner,
                                inspected_by: data.inspected_by,
                                checked_by: data.checked_by,
                                approved_by: data.client_engineer_name || data.project.owner,
                                signature:    data.signature
                            })}
                        </div>

                    </div>
                </div>
            `;

            // ✅ Update ONLY container
            $("#final-report-container").html(report_html);
        }
    });
}
