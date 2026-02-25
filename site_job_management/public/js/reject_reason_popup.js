$(document).on("click", ".reject-reason-btn", function () {

    let remarks_field1 = $(this).data("remarks-field");

    let remarks = cur_frm.doc[remarks_field1] || "No remarks available";
    console.log(remarks_field1);
    if (!remarks) {
        remarks = "No remarks available";
    }

    let dialog = new frappe.ui.Dialog({
        title: "Rejection Remarks",
        fields: [
            {
                label: "Remarks",
                fieldname: "remarks",
                fieldtype: "Small Text",
                read_only: 1
            }
        ],
        primary_action_label: "Close",
        primary_action() {
            dialog.hide();
        }
    });

    dialog.set_value("remarks", remarks);
    dialog.show();
});