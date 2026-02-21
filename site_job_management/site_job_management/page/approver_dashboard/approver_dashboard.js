frappe.require("/assets/site_job_management/css/approver-dashboard.css");

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
				"pour_card_report_status",
				"owner",
				"creation"

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

	let all_status = [
    pc.reinforcement_bbs_status,
    pc.mbook_form_status,
    pc.mbook_concrete_status,
    pc.pour_card_report_status
];

	let all_approved = all_status.every(s => s === "Approved");
	
	let download_btn = all_approved ? `
		<button class="overall-download-btn"
			onclick="open_final_report('${report_name}')"
			style="
				font-size: 12px;
				background: #16a34a;
				color: #fff;
				border: none;
				padding: 4px 8px;
				border-radius: 8px;
				cursor: pointer;
				transition: all 0.2s ease;
			"
			onmouseover="this.style.background='#15803d'"
			onmouseout="this.style.background='#16a34a'"
		>
			⬇
		</button>
	` : "";



    let html = `
        <div class="report-wrapper"
             style="border:2px solid #3879fb; border-radius:12px; margin-bottom:20px; background:#fff;">

			<div onclick="toggle_section('${report_name}')"
				class="report-header">

				<span class="report-name">${report_name}  ${download_btn}</span>

				<span class="card-meta">${pc.owner || ""}</span>

				<span class="card-meta">
					${frappe.datetime.str_to_user(pc.creation)}
				</span>

				<span id="arrow-${report_name}" class="card-arrow">▶</span>

			</div>


            <div id="body-${report_name}"
                 style="display:none; padding:16px; border-top:1px solid #eee;">

                <div style="
                    display:grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap:16px;
                ">

                    ${render_card("Reimbursement BBS", pc.reinforcement_bbs_status, "Reimbursement BBS", report_name , "reinforcement-bbs-ap")}
                    ${render_card("M-Book Form Work", pc.mbook_form_status, "M-Book Form Work", report_name,"m-book-form-work-app")}
                    ${render_card("M-Book Concrete Work", pc.mbook_concrete_status, "M-Book Concrete Work", report_name,"concrete-work-approv")}
                    ${render_card("Pour Card Report", pc.pour_card_report_status, "Pour Card Report", report_name,"pour-card-report-app")}

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

window.open_final_report = function(report_name) {
	frappe.set_route("pour-card-final-repo", report_name);
    // frappe.set_route("pour-card-final-repo", {
    //     report_no: report_name
    // });

};


function render_card(title, status, doctype, report_name, page_name) {

    let status_text = status || "Not Created";

    let card_class = "bbs-card";
    let route_attr = "";
    let page_attr = "";

    if (status_text === "Approved") {
        card_class += "  approved";
		card_class += " clickable";
        route_attr = `data-route="${report_name}"`;
        page_attr = `data-page="${page_name}"`;
		
    }

    else if (status_text === "Submitted") {
        card_class += "  submitted";		
        card_class += " clickable";
        route_attr = `data-route="${report_name}"`;
        page_attr = `data-page="${page_name}"`;
    }

	else if (status_text === "Rejected") {
        card_class += "  rejected";		
    }
	else if (status_text === "Draft") {
        card_class += "  Draft";		
    }

    return `
        <div class="${card_class}" ${route_attr} ${page_attr}>
            <div class="card-title">${title}</div>
            <div class="card-status">${status_text}</div>
        </div>
    `;
}




	// function load_child_status(report_name) {

	// 	let doctypes = [
	// 		"BBS Shape",
	// 		"M-Book Form Work",
	// 		"M-Book Concrete Work",
	// 		"Pour Card Report"
	// 	];

	// 	let has_submitted = false;

	// 	doctypes.forEach(dt => {

	// 		frappe.call({
	// 			method: "frappe.client.get_list",
	// 			args: {
	// 				doctype: dt,
	// 				filters: { report_no: report_name },
	// 				fields: ["name", "docstatus"]
	// 			},
	// 			callback: function(r) {

	// 				if (r.message && r.message.length > 0) {

	// 					let doc = r.message[0];

	// 					let status = doc.docstatus == 1 ? "Submitted" : "Draft";

	// 					if (doc.docstatus == 1) {
	// 						has_submitted = true;
	// 					}

	// 					let view_btn = doc.docstatus == 1
	// 						? `<button class="btn btn-sm btn-primary"
	// 							onclick="open_approval('${dt}', '${doc.name}')">
	// 							View
	// 						</button>`
	// 						: "";

	// 					let card_html = `
	// 						<div style="border:1px solid #e5e7eb; 
	// 									padding:14px; 
	// 									border-radius:10px;
	// 									background:#fafafa;">

	// 							<div style="font-weight:600;">${dt}</div>
	// 							<div style="margin:8px 0; font-size:13px;">
	// 								Status: ${status}
	// 							</div>
	// 							${view_btn}
	// 						</div>
	// 					`;

	// 					if (dt == "Reimbursement BBS")
	// 						$(`#bbs-${report_name}`).html(card_html);
	// 					else if (dt == "M-Book Form Work")
	// 						$(`#form-${report_name}`).html(card_html);
	// 					else if (dt == "M-Book Concrete Work")
	// 						$(`#concrete-${report_name}`).html(card_html);
	// 					else
	// 						$(`#report-${report_name}`).html(card_html);

	// 					// Auto expand if any submitted
	// 					if (has_submitted) {
	// 						$(`#body-${report_name}`).show();
	// 						$(`#arrow-${report_name}`).text("▼");
	// 					}
	// 				}
	// 			}
	// 		});
	// 	});
	// }

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

	// function open_approval(doctype, name) {
	// 	frappe.set_route("Form", doctype, name);
	// }


$(document).on("click", ".bbs-card.clickable", function () {

    let report_name = $(this).data("route");
    let page_name = $(this).data("page");

    frappe.set_route(page_name, report_name);

});



