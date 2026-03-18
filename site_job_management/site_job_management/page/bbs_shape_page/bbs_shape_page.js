frappe.pages['bbs-shape-page'].on_page_load = function(wrapper) {

    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'BBS Shape Dashboard',
        single_column: true
    });

    // Container
    $(page.body).html(`<div id="bbs-table"></div>`);

    frappe.call({
        method: "site_job_management.site_job_management.page.bbs_shape_page.bbs_shape_page.get_all_bbs_data",
        callback: function(r) {

            let data = r.message;

            if (!data || data.length === 0) {
                $('#bbs-table').html(`
                    <div style="text-align:center; padding:40px; color:#888;">
                        📭 No Data Found
                    </div>
                `);
                return;
            }

            // Group by Pour Card
            let grouped = {};
            data.forEach(row => {
                let key = row.pour_card || "No Pour Card";
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(row);
            });

            let html = `<div style="padding:15px;">`;

            Object.keys(grouped).forEach(pour_card => {

                let total_length_sum = 0;
                let index = 1;
                let rows = "";

                grouped[pour_card].forEach(row => {
                    total_length_sum += Number(row.total_length || 0);

                    rows += `
                        <tr style="line-height:1.5; vertical-align:middle;" 
                            onmouseover="this.style.background='#f2f2f2'" 
                            onmouseout="this.style.background='white'">

                            <td style="text-align:left; padding:8px 12px;">${index++}</td>
                            <td style="text-align:left; padding:8px 12px;">${frappe.datetime.str_to_user(row.creation) || ""}</td>
                            <td style="text-align:left; padding:8px 12px; font-weight:600; color:#333;">${row.shape_code || ""}</td>

                            <td style="text-align:right; padding:8px 12px;">${row.a || "-"}</td>
                            <td style="text-align:right; padding:8px 12px;">${row.b || "-"}</td>
                            <td style="text-align:right; padding:8px 12px;">${row.c || "-"}</td>
                            <td style="text-align:right; padding:8px 12px;">${row.d || "-"}</td>
                            <td style="text-align:right; padding:8px 12px;">${row.e || "-"}</td>
                            <td style="text-align:right; padding:8px 12px;">${row.f || "-"}</td>
                            <td style="text-align:right; padding:8px 12px;">${row.g || "-"}</td>
                            <td style="text-align:right; padding:8px 12px;">${row.h || "-"}</td>

                            <td style="text-align:left; padding:8px 12px;">
                                <span style="
                                    background:#4e73df;
                                    color:white;
                                    padding:4px 10px;
                                    border-radius:4px;
                                    font-size:12px;
                                    display:inline-block;
                                ">${row.dia || ""}</span>
                            </td>

                            <td style="text-align:left; padding:8px 12px;">${row.nom || ""}</td>
                            <td style="text-align:left; padding:8px 12px;">${row.npm || ""}</td>
                            <td style="text-align:left; padding:8px 12px;">${row.cutting_length || ""}</td>
                            <td style="text-align:left; padding:8px 12px; font-weight:bold; color:#1cc88a;">${row.total_length || ""}</td>
                        </tr>
                    `;
                });

                // Card block
                html += `
                    <div style="
                        margin-bottom:20px;
                        background:white;
                        border-radius:8px;
                        box-shadow:0 2px 6px rgba(0,0,0,0.08);
                        overflow:hidden;
                        border:1px solid #ddd;
                    ">
                        <!-- Header -->
                        <div style="
                            padding:10px 15px;
                            background:#f8f9fc;
                            color:#333;
                            font-weight:bold;
                            display:flex;
                            justify-content:space-between;
                        ">
                            <span>📌 ${pour_card}</span>
                            
                        </div>

                        <!-- Table -->
                        <div style="overflow-x:auto;">
                            <table class="table" style="margin:0; width:100%; border-collapse:collapse; border-spacing:0;">
                                <thead style="background:#e9ecef; color:#333;">
                                    <tr style="text-align:center;">
                                        <th style="padding:8px 12px;">S.No.</th>
                                        <th style="padding:8px 12px;">Creation Date</th>
                                        <th style="padding:8px 12px; text-align:left;">Shape</th>
                                        <th style="padding:8px 12px; text-align:right;">A</th>
                                        <th style="padding:8px 12px; text-align:right;">B</th>
                                        <th style="padding:8px 12px; text-align:right;">C</th>
                                        <th style="padding:8px 12px; text-align:right;">D</th>
                                        <th style="padding:8px 12px; text-align:right;">E</th>
                                        <th style="padding:8px 12px; text-align:right;">F</th>
                                        <th style="padding:8px 12px; text-align:right;">G</th>
                                        <th style="padding:8px 12px; text-align:right;">H</th>
                                        <th style="padding:8px 12px; text-align:left;">Dia</th>
                                        <th style="padding:8px 12px; text-align:left;">NOM</th>
                                        <th style="padding:8px 12px; text-align:left;">NPM</th>
                                        <th style="padding:8px 12px; text-align:left;">Cut Len</th>
                                        <th style="padding:8px 12px; text-align:left;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                    
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            $('#bbs-table').html(html);
        }
    });
};