# ──────────────────────────────────────────────────────────────────────────────
# Stock freshness wrappers for igh_search/igh_search/api.py
# Append these functions to app api.py and wire hooks/scheduler as documented.
# ──────────────────────────────────────────────────────────────────────────────


@frappe.whitelist()
def get_search_freshness_health(**kwargs):
    from igh_search.igh_search.product_stock_freshness import get_search_freshness_health as _f

    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def run_stock_drift_repair(**kwargs):
    from igh_search.igh_search.product_stock_freshness import run_stock_drift_repair as _f

    return _f(**_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def reindex_stock_for_items(**kwargs):
    from igh_search.igh_search.product_stock_freshness import reindex_stock_for_items_api as _f

    return _f(**_sanitize_framework_kwargs(kwargs))
