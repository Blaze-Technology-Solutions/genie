# Copyright (c) 2023, Wahni IT Solutions Pvt. Ltd. and contributors
# For license information, please see license.txt

import requests
import frappe
from frappe.integrations.utils import create_request_log


def make_request(
	url,
	headers,
	payload,
	req_type="POST",
	return_response=False
    ):
	response = requests.request(
		req_type, url, json=payload, headers=headers
	)
	log_request(url, payload, response.json() if response.status_code == 200 else response.text)
	try:
		response.raise_for_status()
	except requests.HTTPError:
		# raise_for_status() discards the body, so the remote site's actual error
		# (e.g. a frappe.throw surfacing as a bare 417) never reaches the caller.
		frappe.log_error(f"{url}\n\n{response.text}", "Genie request failed")
		frappe.throw(
			remote_error_message(response),
			title=f"Request failed ({response.status_code})"
		)

	if return_response:
		return response
	return response.json()


def remote_error_message(response):
	"""Best-effort extraction of a readable error out of a Frappe error response."""
	try:
		data = response.json()
	except ValueError:
		return response.text[:2000] or response.reason

	messages = data.get("_server_messages")
	if messages:
		try:
			parsed = frappe.parse_json(messages)
		except Exception:
			parsed = None

		if parsed:
			return "<br>".join(unwrap_server_message(m) for m in parsed)

		return str(messages)[:2000]

	return str(data.get("exception") or data.get("message") or data)[:2000]


def unwrap_server_message(message):
	"""A _server_messages entry is a JSON string wrapping {"message": "..."}."""
	try:
		parsed = frappe.parse_json(message)
	except Exception:
		return str(message)

	if isinstance(parsed, dict):
		return str(parsed.get("message") or message)

	return str(parsed)


def log_request(endpoint, payload, output):
	create_request_log(
		payload,
		request_description=endpoint,
		service_name="Genie",
		output=pretty_json(output),
		status="Completed"
	)
	frappe.db.commit()


def pretty_json(obj):
	if not obj:
		return ""

	if isinstance(obj, str):
		return obj

	return frappe.as_json(obj, indent=4)
