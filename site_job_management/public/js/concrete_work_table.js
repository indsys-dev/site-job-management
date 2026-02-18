// ==========================================================
// M-BOOK FORM WORK TABLE RENDERER (Reusable)
// ==========================================================

window.ConcreteWorkTable = {

    render(formwork_list) {

        let html = `

        <!-- ========================= -->
        <!-- FORM WORK TABLE -->
        <!-- ========================= -->

        <div class="card p-3">
            <h4>M-Book Concreat Work Table</h4>

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
        if (formwork_list && formwork_list.length > 0) {

            formwork_list.forEach(row => {

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

        return html;
    }

};
