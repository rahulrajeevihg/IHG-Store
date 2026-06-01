

# ── AI Assistant conversation history (server-side persistence + feedback) ──
@frappe.whitelist()
def save_assistant_conversation(*args, **kwargs):
    from igh_search.igh_search.assistant_history import save_assistant_conversation as _f
    return _f(*args, **_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def list_assistant_conversations(*args, **kwargs):
    from igh_search.igh_search.assistant_history import list_assistant_conversations as _f
    return _f(*args, **_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def get_assistant_conversation(*args, **kwargs):
    from igh_search.igh_search.assistant_history import get_assistant_conversation as _f
    return _f(*args, **_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def delete_assistant_conversation(*args, **kwargs):
    from igh_search.igh_search.assistant_history import delete_assistant_conversation as _f
    return _f(*args, **_sanitize_framework_kwargs(kwargs))


@frappe.whitelist()
def submit_assistant_feedback(*args, **kwargs):
    from igh_search.igh_search.assistant_history import submit_assistant_feedback as _f
    return _f(*args, **_sanitize_framework_kwargs(kwargs))
