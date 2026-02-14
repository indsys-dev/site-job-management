frappe.ui.form.on('Reinforcement BBS', {
    refresh(frm) {
        frm.add_custom_button(__('Add Shape'), function () {
            frappe.new_doc('Reinforcement BBS Shape', {
                reinforcement_bbs: frm.doc.name   // optional link field
            });
        }, __('Actions'));
    }
});