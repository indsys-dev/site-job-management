frappe.pages['pour-card-final-repo'].on_page_load = function(wrapper) {

    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Pour Card Final Report',
        single_column: true
    });

    let pour_card = frappe.get_route()[1];

    // Add Print Button
    page.set_primary_action("Print", function() {
        window.print();
    });

    frappe.call({
        method: "site_job_management.site_job_management.page.pour_card_final_repo.pour_card_final_repo.get_data",
        args: { pour_card: pour_card },
        callback: function(r) {

            let data = r.message;

            let report_html = `
                <div id="a4-report" class="a4-container">

                    ${PourCardReportRenderer.render_full_report(data)}

                    ${ReportSignatureRenderer.render_signatures({
                        prepared_by: data.prepared_by,
                        inspected_by: data.inspected_by,
                        checked_by: data.checked_by,
                        approved_by: data.approved_by
                    })}

                </div>
            `;

            $(page.body).html(report_html);
        }
    });
};
