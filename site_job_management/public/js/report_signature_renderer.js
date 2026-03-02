window.ReportSignatureRenderer = {

    render_signatures: function(data = {}) {

        return `
                <div class="p-4">

                    <div class="d-flex justify-content-between signature-wrapper">

                        <!-- LEFT SIDE -->
                        <div class="signature-block text-center">
                            <div class="signature-line"></div>
                            <div class="signature-title">
                                Report Prepared by<br>
                                <small>Requester Engineer</small>
                            </div>
                            <div class="signature-name">
                                ${data.prepared_by || ""}
                            </div>
                        </div>

                        <!-- RIGHT SIDE -->
                        <div class="signature-block text-center">
                            <div class="signature-line"></div>
                            <div class="signature-title">
                                Approved by<br>
                                <small>Client/Consultant Engineer</small>
                            </div>
                            <div class="signature-name">
                                ${data.approved_by || ""}
                            </div>
                        </div>

                    </div>

                </div>
        `;
    }

};
