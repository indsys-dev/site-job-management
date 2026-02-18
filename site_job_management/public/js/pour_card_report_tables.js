// ======================================================
// POUR CARD REPORT INSPECTION TABLE (Reusable Function)
// ======================================================

window.site_job_management = window.site_job_management || {};

site_job_management.render_pour_card_report_table = function (data) {

    let html = `
        <div class="card p-3">
            <h4>Pour Card Report</h4>

            <table class="table table-bordered text-center align-middle">
                <thead>
                    <tr>
                        <th>Inspection Items</th>
                        <th>Value</th>
                        <th>Checked</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Take First Report Record
    let report = data.formwork_list && data.formwork_list.length > 0
        ? data.formwork_list[0]
        : null;

    const inspection_fields = [
        "value_surveylayout",
        "value_formwork",
        "value_reinforcement",
        "value_cover_blocks",
        "value_embedments",
        "value_sleeves_inserts",
        "value_cleanliness",
        "value_time_between_mixing_and_pouring",
        "value_weight_of_mix_ingredients",
        "value_wc_ratio",
        "value_slump",
        "value_concrete_temperature",
        "pour_start_time",
        "value_cube_sampling_details",
        "value_surface_finish",
        "value_honeycombing",
        "value_cold_joints",
        "value_curing_method",
        "value_overall_acceptance"
    ];

    inspection_fields.forEach(field => {

        let verified_field = "verified_" + field.replace("value_", "");
        let remarks_field = "remarks_" + field.replace("value_", "");

        html += `
            <tr>
                <td>${field.replace(/_/g, " ").toUpperCase()}</td>
                <td>${report ? report[field] || "" : ""}</td>
                <td>${report && report[verified_field] ? "✔" : ""}</td>
                <td>${report ? report[remarks_field] || "" : ""}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    return html;
};
