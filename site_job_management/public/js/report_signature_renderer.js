window.ReportSignatureRenderer = {

    render_signatures: function(data = {}) {

        let signature_img = data.signature ? `
            <img
                src="${data.signature}"
                alt="Signature"
                style="max-height:80px; max-width:200px; object-fit:contain; cursor:pointer;"
                onclick="window.open('${data.signature}', '_blank')"
            />
        ` : '';

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
                            ${signature_img}
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