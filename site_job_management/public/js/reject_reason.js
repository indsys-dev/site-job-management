// Make function globally available
window.openRejectReasonPopup = function (reason) {

    if (!reason) {
        frappe.msgprint("No rejection reason provided.");
        return;
    }

    frappe.msgprint({
        title: "Rejection Reason",
        message: reason,
        indicator: "red"
    });
};