

# ── Part B / B1 ambient recommendation engine ──
@frappe.whitelist()
def recommend(*args, **kwargs):
    from igh_search.igh_search.product_recommendations import recommend as _f
    return _f(*args, **_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def find_similar_products(*args, **kwargs):
    from igh_search.igh_search.product_recommendations import find_similar_products as _f
    return _f(*args, **_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def get_promotion_picks(*args, **kwargs):
    from igh_search.igh_search.product_recommendations import get_promotion_picks as _f
    return _f(*args, **_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def log_suggestion(*args, **kwargs):
    from igh_search.igh_search.product_recommendations import log_suggestion as _f
    return _f(*args, **_sanitize_framework_kwargs(kwargs))
