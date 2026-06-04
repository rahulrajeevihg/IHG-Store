

# ── Phase 4 learning loop / observability ──
@frappe.whitelist()
def build_gap_list(*args, **kwargs):
    from igh_search.igh_search.ai_learning import build_gap_list as _f
    return _f(*args, **_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def get_ai_observability(*args, **kwargs):
    from igh_search.igh_search.ai_learning import get_ai_observability as _f
    return _f(*args, **_sanitize_framework_kwargs(kwargs))
