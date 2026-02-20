window.ReportSignatureRenderer = {

    render_signatures: function(data = {}) {

        return `
            <div class=" p-4">

                <div class="row text-center text-cen">

                    <div class="col-md-3 col-6 mb-5 signature">
                        <div class="signature-block">
                            <div class="signature-line"></div>
                            <div class="signature-title">
                                Report Prepared by<br>
                                <small>QC / Site Engineer (Sub-contractor)</small>
                            </div>
                            <div class="signature-name">
                                ${data.prepared_by || ""}
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3 col-6 mb-4">
                        <div class="signature-block">
                            <div class="signature-line"></div>
                            <div class="signature-title">
                                Inspected by<br>
                                <small>(Sub-contractor)</small>
                            </div>
                            <div class="signature-name">
                                ${data.inspected_by || ""}
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3 col-6 mb-4">
                        <div class="signature-block">
                            <div class="signature-line"></div>
                            <div class="signature-title">
                                Checked by<br>
                                <small>PMC</small>
                            </div>
                            <div class="signature-name">
                                ${data.checked_by || ""}
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3 col-6 mb-4">
                        <div class="signature-block">
                            <div class="signature-line"></div>
                            <div class="signature-title">
                                Approved by<br>
                                <small>Client</small>
                            </div>
                            <div class="signature-name">
                                ${data.approved_by || ""}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        `;
    }

};
