window.PourCardReportRenderer = {

    render_full_report: function(data) {

        let html = "";

        html += this.render_project_pour_details(data);
        html += this.render_shapes_table(data);
        html += this.render_summary_table(data);

        return html;
    },

    render_project_pour_details: function(data) {

        return `
            <div class="row g-3 mb-3">

                <div class="col-md-6 p-2">
                    <div class="card p-3">
                        <h4>Project Details</h4>
                        <p><b>Project:</b> ${data.project.project_name}</p>
                        <p><b>Contractor:</b> ${data.project.contractor}</p>
                        <p><b>PMC:</b> ${data.project.pmc}</p>
                        <p><b>Client:</b> ${data.project.client}</p>
                        <p><b>Location:</b> ${data.project.site_location}</p>
                    </div>
                </div>

                <div class="col-md-6 p-2">
                    <div class="card p-3">
                        <h4>Pour Card Details</h4>
                        <p><b>Pour Card:</b> ${data.pour_card.name}</p>
                        <p><b>Drawing:</b> ${data.pour_card.drawing_number}</p>
                        <p><b>Structure:</b> ${data.pour_card.structuremember_type}</p>
                        <p><b>Building:</b> ${data.pour_card.building}</p>
                        <p><b>Floor:</b> ${data.pour_card.floor}</p>
                    </div>
                </div>

            </div>
        `;
    },

    render_shapes_table: function(data) {

        let dim_fields = ["a","b","c","d","e","f","g","h"];

        function hasValue(val) {
            return val !== null &&
                val !== undefined &&
                val !== "" &&
                val !== "0.000" &&
                val !== 0;
        }

        let visible_dims = dim_fields.filter(field =>
            data.bbs_shapes.some(row => hasValue(row[field]))
        );

        if (visible_dims.length === 0) {
            visible_dims = ["a"];
        }

        let html = `
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
                            <th rowspan="2">Cutting Length</th>
                            <th rowspan="2">Total Length</th>
                        </tr>
                        <tr>
        `;

        visible_dims.forEach(dim => {
            html += `<th>${dim.toUpperCase()}</th>`;
        });

        html += `</tr></thead><tbody>`;

        data.bbs_shapes.forEach(row => {

            html += `<tr><td>${row.shape_code || ""}</td>`;

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
            </tr>`;
        });

        html += `</tbody></table></div>`;

        return html;
    },

    render_summary_table: function(data) {

        let dias = Object.keys(data.summary).sort((a, b) => a - b);

        let html = `
            <div class="card p-3 mt-4">
                <h4>Dia Summary</h4>
                <table class="table table-bordered text-center">
                    <thead>
                        <tr><th></th>
        `;

        dias.forEach(dia => {
            html += `<th>${dia} mm</th>`;
        });

        html += `</tr></thead><tbody>`;

        html += `<tr><td><b>Total Length (m)</b></td>`;
        dias.forEach(dia => {
            html += `<td>${data.summary[dia].total_length.toFixed(2)}</td>`;
        });
        html += `</tr>`;

        html += `<tr><td><b>Unit Weight / m</b></td>`;
        dias.forEach(dia => {
            html += `<td>${data.summary[dia].unit_weight}</td>`;
        });
        html += `</tr>`;

        html += `<tr><td><b>Total in Kg</b></td>`;
        dias.forEach(dia => {
            html += `<td>${data.summary[dia].total_kg}</td>`;
        });
        html += `</tr>`;

        html += `<tr><td><b>Total in MT</b></td>`;
        dias.forEach(dia => {
            html += `<td>${data.summary[dia].total_mt}</td>`;
        });
        html += `</tr>`;

        html += `</tbody></table></div>`;

        return html;
    }

};
