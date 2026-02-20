// frappe.require("/assets/site_job_management/css/final-report");

frappe.pages['pour-card-final-repo'].on_page_load = function(wrapper) {


    const report_no = frappe.get_route()[1]?.report_no 
        || frappe.utils.get_url_arg("report_no");

    console.log("Report:", report_no);


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

                    <!-- REPORT HEADER BAR -->
                    <div class="report-top">
                        <div class="report-title">
                            <h2>POUR CARD APPROVAL REPORT</h2>
                            <p>${data.project.project_name} | ${data.project.site_location}</p>
                        </div>
                    </div>

                    <!-- MAIN REPORT CONTENT -->
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


                    <!-- SIGNATURES -->
                    <div class="report-signatures">

                        ${ReportSignatureRenderer.render_signatures({
                            prepared_by: data.prepared_by,
                            inspected_by: data.inspected_by,
                            checked_by: data.checked_by,
                            approved_by: data.approved_by
                        })}

                    </div>

                </div>
            `;


            $(page.body).html(report_html);
        }
    });
};
