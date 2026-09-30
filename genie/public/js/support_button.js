// Copyright (c) 2023, Wahni IT Solutions Pvt. Ltd. and Contributors
// MIT License. See license.txt

// v16 dropped the desk navbar (it only renders on mobile / read-only / impersonation),
// so the "BTS Tech Support" button in navbar.html never shows. Put it in every page
// header instead — forms, lists, reports and workspaces all share frappe.ui.Page.

frappe.provide("genie");

(function () {
	const Page = frappe.ui && frappe.ui.Page;
	if (!Page || Page.prototype.__genie_support_button) return;

	const setup_page = Page.prototype.setup_page;
	Page.prototype.setup_page = function () {
		const out = setup_page.apply(this, arguments);
		genie.add_support_button(this);
		return out;
	};
	Page.prototype.__genie_support_button = true;
})();

genie.add_support_button = function (page) {
	// On mobile the navbar (with its own button) is still rendered.
	if (!frappe.boot.genie_support_enabled || frappe.is_mobile()) return;
	if (!page.page_actions || page.page_actions.find(".genie-support-btn").length) return;

	$(`<button class="btn btn-primary btn-sm genie-support-btn mr-2">
			<span class="ui-button-text">${__("BTS Tech Support")}</span>
		</button>`)
		.on("click", () => new genie.SupportTicket())
		.prependTo(page.page_actions);
};
