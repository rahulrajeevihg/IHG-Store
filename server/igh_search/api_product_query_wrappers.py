# ──────────────────────────────────────────────────────────────────────────────
# Product Query Desk wrappers (chat + tickets + rankings)
# Appended to igh_search/igh_search/api.py. Each wrapper delegates to
# igh_search.igh_search.product_query and is exposed via /api/method/.
# ──────────────────────────────────────────────────────────────────────────────


@frappe.whitelist()
def create_product_query(**kwargs):
    from igh_search.igh_search.product_query import create_product_query as _f
    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def list_product_queries(**kwargs):
    from igh_search.igh_search.product_query import list_product_queries as _f
    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def get_product_query(**kwargs):
    from igh_search.igh_search.product_query import get_product_query as _f
    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def post_product_query_message(**kwargs):
    from igh_search.igh_search.product_query import post_product_query_message as _f
    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def poll_product_query_updates(**kwargs):
    from igh_search.igh_search.product_query import poll_product_query_updates as _f
    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def mark_product_query_read(**kwargs):
    from igh_search.igh_search.product_query import mark_product_query_read as _f
    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def escalate_product_query_to_ticket(**kwargs):
    from igh_search.igh_search.product_query import escalate_product_query_to_ticket as _f
    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def update_product_query(**kwargs):
    from igh_search.igh_search.product_query import update_product_query as _f
    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def resolve_product_query(**kwargs):
    from igh_search.igh_search.product_query import resolve_product_query as _f
    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def rate_product_query_solution(**kwargs):
    from igh_search.igh_search.product_query import rate_product_query_solution as _f
    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def reopen_product_query(**kwargs):
    from igh_search.igh_search.product_query import reopen_product_query as _f
    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def get_product_query_rankings(**kwargs):
    from igh_search.igh_search.product_query import get_product_query_rankings as _f
    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def notify_product_query_typing(**kwargs):
    from igh_search.igh_search.product_query import notify_product_query_typing as _f
    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def get_socket_ticket(**kwargs):
    from igh_search.igh_search.product_query import get_socket_ticket as _f
    return _f(**_sanitize_framework_kwargs(kwargs))
