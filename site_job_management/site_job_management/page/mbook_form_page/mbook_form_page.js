frappe.pages['mbook-form-page'].on_page_load = function(wrapper) {
    render_mbook_dashboard(wrapper, "M-Book Form Work Dashboard",
        "site_job_management.site_job_management.page.mbook_form_page.mbook_form_page.get_all_mbook_form_data",
        "quantity"
    );
};

// Generic dashboard function
function render_mbook_dashboard(wrapper, title, method, qty_field) {
    const page = frappe.ui.make_app_page({ parent: wrapper, title: title, single_column: true });

    // Scoped table container
    const $table = $('<div id="mbook-table"></div>').appendTo(page.body);

    frappe.call({
        method: method,
        callback: function(r) {
            let data = r.message || [];
            if (!data.length) {
                $table.html(`<div style="text-align:center; padding:40px; color:#888;">📭 No Data Found</div>`);
                return;
            }

            // Group by report_no
            let grouped = {};
            data.forEach(row => {
                let key = row.report_no || "No Report";
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(row);
            });

            let html = `<div style="padding:15px;">`;
            Object.keys(grouped).forEach(report_no => {
                let total_qty = 0, index = 1, rows = "";
                grouped[report_no].forEach(row => {
                    total_qty += Number(row[qty_field] || 0);
                    // Alternating row colors
                    let bg = index % 2 === 0 ? "#fdf6f0" : "#fff8f0";
                    rows += `
                    <tr style="background:${bg}; transition: background 0.2s;" 
                        onmouseover="this.style.background='#ffe0b2'" 
                        onmouseout="this.style.background='${bg}'">
                        <td style="padding:8px 12px; text-align:left;">${index++}</td>
                        <td style="padding:8px 12px;">${frappe.datetime.str_to_user(row.creation)}</td>
                        <td style="padding:8px 12px;">${row.boq_no || ""}</td>
                        <td style="padding:8px 12px;">${row.description || ""}</td>
                        <td style="padding:8px 12px;">${row.level || ""}</td>
                        <td style="padding:8px 12px;">${row.reference || ""}</td>
                        <td style="padding:8px 12px;">${row.unit || ""}</td>
                        <td style="padding:8px 12px; text-align:left;">${row.nom || ""}</td>
                        <td style="padding:8px 12px; text-align:left;">${row.npm || ""}</td>
                        <td style="padding:8px 12px;">${row.length || ""}</td>
                        <td style="padding:8px 12px;">${row.breadth || ""}</td>
                        <td style="padding:8px 12px;">${row.depth || ""}</td>
                        <td style="padding:8px 12px; text-align:left;">${row[qty_field] || ""}</td>
                        <td style="padding:8px 12px;">${row.remarks || ""}</td>
                    </tr>`;
                });

                html += `
                <div style="margin-bottom:20px; background:white; border-radius:12px; border:1px solid #e0e0e0; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                    <div style="padding:12px 15px; font-weight:bold; display:flex; justify-content:space-between;
                                background: linear-gradient(90deg, #4dd0e1, #26c6da); color:black; border-top-left-radius:12px; border-top-right-radius:12px;">
                        <span>📌 ${report_no}</span>
                        
                    </div>
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
                            <thead style="background:#b2ebf2; color:#5d4037;">
                                <tr>
                                    <th>S.No.</th><th>Creation</th><th>BoQ No</th><th>Description</th>
                                    <th>Level</th><th>Reference</th><th>Unit</th><th>NOM</th>
                                    <th>NPM</th><th>Length</th><th>Breadth</th><th>Depth</th>
                                    <th>Quantity</th><th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                                
                            </tbody>
                        </table>
                    </div>
                </div>`;
            });

            $table.html(html);
        }
    });
}