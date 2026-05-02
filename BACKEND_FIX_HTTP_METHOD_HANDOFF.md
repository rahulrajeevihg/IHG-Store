# Hand-off: Permanent fix for `Method GET not allowed` errors in `igh_search`

**Audience:** ERPNext / Frappe backend developer for the `igh_search` app
**Affected file:** `apps/igh_search/igh_search/igh_search/api.py`
**Status:** Recurring blocker for the IHG sales portal frontend. Needs a structural fix, not per-endpoint patching.

---

## 1. The symptom

Every time a frontend call hits an `igh_search` endpoint, the server raises:

```
frappe.exceptions.ValidationError: Method GET not allowed. Allowed methods: POST
```

Full traceback (one example, from `search_opportunities`):

```
File "apps/frappe/frappe/app.py", line 98, in application
    response = frappe.api.handle()
File "apps/frappe/frappe/handler.py", line 50, in handle
    data = execute_cmd(cmd)
File "apps/igh_search/igh_search/igh_search/api.py", line 840, in search_opportunities
    user = _ensure_authenticated_user()
File "apps/igh_search/igh_search/igh_search/api.py", line 420, in _ensure_http_methods
    frappe.throw(f"Method {request_method or 'UNKNOWN'} not allowed. ...")
```

This shows up across many endpoints — it is **not** specific to `search_opportunities`.

---

## 2. Root cause

`_ensure_authenticated_user()` calls `_ensure_http_methods()` internally. That means **every** authenticated endpoint inherits the same HTTP-method restriction baked into the auth helper, regardless of whether that endpoint is a read or a write.

This cross-couples two unrelated concerns:

| Concern               | Where it belongs                                                   |
| --------------------- | ------------------------------------------------------------------ |
| Authentication        | `_ensure_authenticated_user()` — runs on every protected endpoint  |
| HTTP method whitelist | The endpoint itself — varies per endpoint (GET/POST/PUT/DELETE)    |

Because they are coupled today, a read endpoint like `search_opportunities` cannot accept a natural GET request without manually overriding the helper, and any new endpoint added later inherits the wrong default.

This is the structural bug. Per-endpoint workarounds will keep failing as new endpoints are added.

---

## 3. Required fix

### 3.1 Decouple method enforcement from auth

In `apps/igh_search/igh_search/igh_search/api.py`:

**Remove** the `_ensure_http_methods()` call from inside `_ensure_authenticated_user()`. The auth helper should authenticate, nothing else.

```python
# BEFORE (current — wrong)
def _ensure_authenticated_user():
    _ensure_http_methods(["POST"])         # ← remove this line
    user = frappe.session.user
    if not user or user == "Guest":
        frappe.throw("Authentication required", frappe.AuthenticationError)
    return user

# AFTER (correct)
def _ensure_authenticated_user():
    user = frappe.session.user
    if not user or user == "Guest":
        frappe.throw("Authentication required", frappe.AuthenticationError)
    return user
```

### 3.2 Use Frappe's idiomatic per-endpoint method whitelist

Frappe already supports HTTP method restriction at the decorator level. Use it. Drop the custom `_ensure_http_methods()` helper entirely once all endpoints have been migrated.

```python
# Read endpoint — accepts GET (and POST for callers that prefer JSON bodies)
@frappe.whitelist(methods=["GET", "POST"])
def search_opportunities(search=None, customer_id=None):
    user = _ensure_authenticated_user()
    ...

# Write endpoint — POST only
@frappe.whitelist(methods=["POST"])
def create_quotation_from_portal(opportunity=None, items=None):
    user = _ensure_authenticated_user()
    ...
```

This is the Frappe-native way: it returns proper 405 responses, surfaces in OpenAPI tooling, and keeps method policy local to the function it governs.

### 3.3 Apply the correct method per endpoint

Use this matrix. It matches what the frontend actually sends today (`IHG-Front-End-App/libs/api.js`).

| Endpoint                                       | Methods       | Reason                              |
| ---------------------------------------------- | ------------- | ----------------------------------- |
| `get_cart_items`                               | GET, POST     | Read                                |
| `get_user_opportunities`                       | GET, POST     | Read                                |
| `search_opportunities`                         | GET, POST     | Read (search)                       |
| `get_customer_info`                            | GET, POST     | Read                                |
| `get_product_details` / `get_product_info`     | GET, POST     | Read                                |
| `get_all_masters`                              | GET, POST     | Read                                |
| `get_all_website_settings`                     | GET, POST     | Read                                |
| `get_country_list` / `get_country_states`      | GET, POST     | Read                                |
| `ai_product_search`                            | POST          | Has structured body                 |
| `insert_cart_items`                            | POST          | Mutates                             |
| `update_cartitem`                              | POST          | Mutates                             |
| `delete_cart_items`                            | POST          | Mutates                             |
| `move_item_to_cart` / `move_all_tocart`        | POST          | Mutates                             |
| `clear_cartitem`                               | POST          | Mutates                             |
| `create_quotation_from_portal`                 | POST          | Mutates                             |
| `insert_order`                                 | POST          | Mutates                             |
| `insert_address` / `update_address` / `delete_address` | POST  | Mutates                             |

**Rule of thumb for new endpoints going forward:**

- Reads (anything starting with `get_`, `search_`, `list_`, `find_`, `fetch_`) → `methods=["GET", "POST"]`
- Mutations (anything starting with `insert_`, `update_`, `delete_`, `create_`, `set_`, `move_`, `clear_`, `cancel_`, `reorder`, etc.) → `methods=["POST"]`

### 3.4 Delete the custom helper once unused

Once every endpoint uses `@frappe.whitelist(methods=[...])`, remove `_ensure_http_methods()` from the file. It is no longer needed and its presence invites future regressions.

---

## 4. Why "just allow POST in the frontend" is not the fix

The frontend already sends POST for `search_opportunities` ([`libs/api.js:777-780`](libs/api.js)). The same error appears for read endpoints that are naturally GET (cart fetch, opportunity list, masters, etc.). Patching one endpoint at a time will not stop the next one from breaking.

The structural fix above eliminates the entire class of error.

---

## 5. Acceptance criteria

A reviewer / QA should confirm all of the following before sign-off:

- [ ] `_ensure_authenticated_user()` no longer calls `_ensure_http_methods()`.
- [ ] Every `@frappe.whitelist()` decorator on `igh_search.igh_search.api` declares `methods=[...]` explicitly.
- [ ] Read endpoints accept both `GET` and `POST`.
- [ ] Write endpoints accept only `POST` (or `POST, PUT` where appropriate).
- [ ] `_ensure_http_methods()` helper is deleted from the file.
- [ ] `curl -X GET <site>/api/method/igh_search.igh_search.api.search_opportunities?search=test` returns valid JSON (auth permitting), **not** the `Method GET not allowed` error.
- [ ] `curl -X GET <site>/api/method/igh_search.igh_search.api.create_quotation_from_portal` returns a 405 / `Method GET not allowed` (since this endpoint is correctly POST-only at the decorator level).
- [ ] No regression in existing POST-only flows: cart insert/update/delete, quotation creation, login.

---

## 6. Smoke test (run after deploy)

From any authenticated browser session against the dev server:

```bash
# Should succeed (GET on a read endpoint)
curl -b cookies.txt -X GET \
  "http://<erp-host>/api/method/igh_search.igh_search.api.search_opportunities?search=test"

# Should succeed (POST on a write endpoint)
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"item_code":"X","qty":1}' \
  "http://<erp-host>/api/method/igh_search.igh_search.api.update_cartitem"

# Should return 405 (GET on a write endpoint — confirms method policy still works)
curl -b cookies.txt -X GET \
  "http://<erp-host>/api/method/igh_search.igh_search.api.create_quotation_from_portal"
```

---

## 7. Contact

Frontend repo: `IHG-Front-End-App` (Next.js).
Frontend API surface called by the portal: `IHG-Front-End-App/libs/api.js`.
Frontend proxy that forwards to ERP: `IHG-Front-End-App/pages/api/erp/[...path].js` (preserves cookies, CSRF token, and HTTP method).

If any endpoint must remain POST-only by design, leave a one-line comment on the function saying *why* — that prevents the next round of frontend changes from rediscovering this issue.
