frappe.pages['approver-dashboard'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Approver Dashboard',
		single_column: true
	});

    // ✅ Create container inside page body
    $(page.body).append(`
        <div id="approver-container" style="padding:15px;"></div>
    `);
	load_dashboard(); 

}
function load_dashboard() {
	frappe.call({
		method: "frappe.client.get_list",
		args: {
			doctype: "Pour Card",
			filters: { docstatus: 1 },
			fields: [
				"name",
				"reinforcement_bbs_status",
				"mbook_form_status",
				"mbook_concrete_status",
				"pour_card_report_status"
			],
			order_by: "creation desc"
		},
		callback: function(r) {
			if (r.message) {
				r.message.forEach(pc => {
					render_pour_card(pc);
				});
			}
		}
	});

}


function render_pour_card(pc) {

    let report_name = pc.name;

    let container = $("#approver-container");

    let html = `
        <div class="report-wrapper"
             style="border:1px solid #e5e7eb; border-radius:12px; margin-bottom:20px; background:#fff;">

            <div onclick="toggle_section('${report_name}')"
                 style="cursor:pointer; padding:14px 18px;
                        display:flex; justify-content:space-between;
                        align-items:center; font-weight:600;">

                <span>${report_name}</span>
                <span id="arrow-${report_name}">▶</span>
            </div>

            <div id="body-${report_name}"
                 style="display:none; padding:16px; border-top:1px solid #eee;">

                <div style="
                    display:grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap:16px;
                ">

                    ${render_card("Reimbursement BBS", pc.reinforcement_bbs_status, "Reimbursement BBS", report_name)}
                    ${render_card("M-Book Form Work", pc.mbook_form_status, "M-Book Form Work", report_name)}
                    ${render_card("M-Book Concrete Work", pc.mbook_concrete_status, "M-Book Concrete Work", report_name)}
                    ${render_card("Pour Card Report", pc.pour_card_report_status, "Pour Card Report", report_name)}

                </div>
            </div>
        </div>
    `;

    container.append(html);

    // Auto expand if any submitted
    if (
        pc.reinforcement_bbs_status === "Submitted" ||
        pc.mbook_form_status === "Submitted" ||
        pc.mbook_concrete_status === "Submitted" ||
        pc.pour_card_report_status === "Submitted"
    ) {
        $(`#body-${report_name}`).show();
        $(`#arrow-${report_name}`).text("▼");
    }
}


function render_card(title, status, doctype, report_name) {

    let status_text = status || "Not Created";

	let view_btn = status_text === "Submitted"
		? `<button class="btn btn-sm btn-primary" style="background:#0635A4;"
			onclick="frappe.set_route('reinforcement-bbs-ap', '${report_name}')">
			View
		</button>`
		: "";


    return `
        <div style="
            border:1px solid #e5e7eb;
            padding:14px;
            border-radius:10px;
            background:#fafafa;
            display:flex;
            flex-direction:column;
            justify-content:space-between;
        ">

            <div style="font-weight:600;">${title}</div>

            <div style="margin:8px 0; font-size:13px;">
                Status: ${status_text}
            </div>

            ${view_btn}
        </div>
    `;
}


	function load_child_status(report_name) {

		let doctypes = [
			"BBS Shape",
			"M-Book Form Work",
			"M-Book Concrete Work",
			"Pour Card Report"
		];

		let has_submitted = false;

		doctypes.forEach(dt => {

			frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: dt,
					filters: { report_no: report_name },
					fields: ["name", "docstatus"]
				},
				callback: function(r) {

					if (r.message && r.message.length > 0) {

						let doc = r.message[0];

						let status = doc.docstatus == 1 ? "Submitted" : "Draft";

						if (doc.docstatus == 1) {
							has_submitted = true;
						}

						let view_btn = doc.docstatus == 1
							? `<button class="btn btn-sm btn-primary"
								onclick="open_approval('${dt}', '${doc.name}')">
								View
							</button>`
							: "";

						let card_html = `
							<div style="border:1px solid #e5e7eb; 
										padding:14px; 
										border-radius:10px;
										background:#fafafa;">

								<div style="font-weight:600;">${dt}</div>
								<div style="margin:8px 0; font-size:13px;">
									Status: ${status}
								</div>
								${view_btn}
							</div>
						`;

						if (dt == "Reimbursement BBS")
							$(`#bbs-${report_name}`).html(card_html);
						else if (dt == "M-Book Form Work")
							$(`#form-${report_name}`).html(card_html);
						else if (dt == "M-Book Concrete Work")
							$(`#concrete-${report_name}`).html(card_html);
						else
							$(`#report-${report_name}`).html(card_html);

						// Auto expand if any submitted
						if (has_submitted) {
							$(`#body-${report_name}`).show();
							$(`#arrow-${report_name}`).text("▼");
						}
					}
				}
			});
		});
	}

	function toggle_section(report_name) {

		let body = $(`#body-${report_name}`);
		let arrow = $(`#arrow-${report_name}`);

		if (body.is(":visible")) {
			body.slideUp();
			arrow.text("▶");
		} else {
			body.slideDown();
			arrow.text("▼");
		}
	}

	function open_approval(doctype, name) {
		frappe.set_route("Form", doctype, name);
	}


