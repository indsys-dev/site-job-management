frappe.pages['pour-card-report-app'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Pour Card Report Approval',
		single_column: true
	});
}