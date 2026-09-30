// Copyright (c) 2023, Wahni IT Solutions Pvt. Ltd. and Contributors
// MIT License. See license.txt

// Where the "BTS Tech Support" button goes depends on the Frappe version:
// - v15 renders the desk navbar on every page, so the button sits in the navbar.
// - v16 dropped that navbar (its navbar template is only an announcement bar), so the
//   button goes in every page header instead — forms, lists, reports and workspaces
//   all share frappe.ui.Page.
// Both versions build the toolbar (and fire toolbar_setup) before the first page.

frappe.provide("genie");

genie.make_support_button = function () {
	return $(`<button class="btn btn-primary btn-sm genie-support-btn">
			<span class="ui-button-text">${__("BTS Tech Support")}</span>
		</button>`).on("click", () => new genie.SupportTicket());
};

$(document).on("toolbar_setup", () => {
	if (!frappe.boot.genie_support_enabled) return;

	// Only the v15 navbar has the search form.
	const $search = $("header .navbar-collapse form[role='search']");
	if (!$search.length) return;

	if (!$search.find(".genie-support-btn").length) {
		$("<div>").append(genie.make_support_button()).insertBefore($search.find(".search-bar"));
	}
	genie.support_in_navbar = true;
});

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
	if (!frappe.boot.genie_support_enabled || genie.support_in_navbar) return;
	if (!page.page_actions || page.page_actions.find(".genie-support-btn").length) return;

	genie.make_support_button().addClass("mr-2").prependTo(page.page_actions);
};
