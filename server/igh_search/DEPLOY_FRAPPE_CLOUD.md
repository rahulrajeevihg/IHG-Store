# Deploy "Product Query Desk" to the `igh_search` app (Frappe Cloud / production)

These files implement the chat + ticket + rankings backend that the new frontend
calls. They were already deployed and verified on the self-hosted dev bench
(`site1.local`); apply the same changes to the production `igh_search` app on
**Frappe Cloud** (`erp.ihgind.com`).

> Frappe Cloud deploys from the `igh_search` app's **git repository** + a "Deploy"
> from the dashboard (Bench → Update). Commit these files to that repo, push, then
> deploy. `bench migrate` runs automatically on a Frappe Cloud deploy; if you have
> SSH/console access you can also run it manually (see step 3).

## File placement (paths are inside the `igh_search` app)

App package root = `igh_search/` (the dir containing `hooks.py`, `patches.txt`).
Module dir = `igh_search/igh_search/` (the dir containing `api.py`, `doctype/`).

| This repo (`server/igh_search/…`) | → igh_search app destination |
|---|---|
| `product_query.py` | `igh_search/igh_search/product_query.py` |
| `doctype/product_query/` (json, py, __init__) | `igh_search/igh_search/doctype/product_query/` |
| `doctype/product_query_message/` (json, py, __init__) | `igh_search/igh_search/doctype/product_query_message/` |
| `patches/migrate_product_data_issues_to_query.py` + `patches/__init__.py` | `igh_search/patches/` (create dir if missing) |
| `api_product_query_wrappers.py` (contents) | **append** to `igh_search/igh_search/api.py` |

## Steps

1. **Copy the DocTypes + module** into the module dir (`igh_search/igh_search/`):
   `product_query.py`, `doctype/product_query/`, `doctype/product_query_message/`.

2. **Append the API wrappers**: paste the body of `api_product_query_wrappers.py`
   to the end of `igh_search/igh_search/api.py`. Each wrapper does a local
   `from igh_search.igh_search.product_query import …` and reuses the existing
   `_sanitize_framework_kwargs` helper already defined in that file. (Do **not**
   replace the file — append only.)

3. **Register + run the migration patch**: place `patches/` at the app package
   root, then add this line under `[post_model_sync]` in `igh_search/patches.txt`:

   ```
   igh_search.patches.migrate_product_data_issues_to_query
   ```

   Then deploy (Frappe Cloud runs migrate), or manually:
   `bench --site erp.ihgind.com migrate && bench restart`
   (the patch copies legacy `Product Data Issue` rows → `Product Query` and their
   `Comment` thread → `Product Query Message`, once).

4. **Reload code**: a Frappe Cloud deploy restarts workers automatically. On a
   self-hosted bench, gunicorn here runs with `--preload`, so do a full
   `supervisorctl restart frappe-bench-web:` (worker recycling alone won't reload
   preloaded code).

## Roles required (already standard ERPNext)
- **Item Manager** → product-team admins (queue, chat back, escalate, resolve).
- **System Manager** → super admins (everything + `/product-queries/rankings`).
Both are granted on the two DocTypes; server code also enforces role checks.

## Verify (guest curl — should say "PermissionError", NOT "has no attribute")
```
curl -s -X POST https://erp.ihgind.com/api/method/igh_search.igh_search.api.list_product_queries \
  -H 'Content-Type: application/json' -d '{}'
```
`PermissionError` (login required) = wired correctly. `has no attribute …` = the
wrappers weren't appended / workers not reloaded.

## Whitelisted methods added (all under `igh_search.igh_search.api.`)
create_product_query · list_product_queries · get_product_query ·
post_product_query_message · poll_product_query_updates · mark_product_query_read ·
escalate_product_query_to_ticket · update_product_query · resolve_product_query ·
rate_product_query_solution · reopen_product_query · get_product_query_rankings

---

## v2 — Realtime + general chat + Item-Manager reporting (2026-05-30)

Re-apply `product_query.py` and the doctype JSON, **append the two new wrappers**,
and re-deploy. All changes are backward-compatible.

**What changed**
- `_append_message` now emits `frappe.publish_realtime("product_query_message", …, after_commit=True)`
  to the reporter + all admins (`_thread_recipients` / `_admin_user_ids`, cached 60s).
  Inert/no-cost when no socket client is connected — **safe to deploy to Frappe Cloud now**.
- New whitelisted methods: **`notify_product_query_typing`** (ephemeral typing fan-out,
  no DB write) and **`get_socket_ticket`** (short-lived redis ticket for the optional
  socket gateway). Append their wrappers from `api_product_query_wrappers.py`.
- `Product Query` doctype: **`item_code` is no longer `reqd`** → supports general
  "chat with the team" threads (no product). `create_product_query` accepts a missing
  `item_code` and falls back to `subject`/message for the title.
- **Rankings opened to Item Manager**: `get_product_query_rankings` now gates on
  `_is_admin()` (Item Manager + System Manager) instead of `_is_super_admin()`.

**Steps**: copy `product_query.py` + `doctype/product_query/product_query.json`,
append the 2 new wrappers to `api.py`, deploy (runs `bench migrate` to pick up the
`item_code` field change). No new patch needed.

**Verify** (guest curl — both must say `PermissionError`, NOT `has no attribute`):
```
for m in notify_product_query_typing get_socket_ticket; do
  curl -s -X POST https://erp.ihgind.com/api/method/igh_search.igh_search.api.$m \
    -H 'Content-Type: application/json' -d '{}' | head -c 120; echo;
done
```

**Optional true push (later, not required for prod):** set the frontend env
`NEXT_PUBLIC_ERP_SOCKET_URL` to an authenticated socket.io gateway and `npm i
socket.io-client`. Until then the frontend uses adaptive polling + optimistic UI,
and the realtime events above are simply dropped. The gateway must validate the
`get_socket_ticket` value (in redis key `pq_socket_ticket:<ticket>`) and join the
socket to the per-user room used by `publish_realtime(user=…)`.

---

## Stock Freshness Pipeline (new)

To keep `/list` stock near-real-time and avoid stale Typesense values:

1. Copy `server/igh_search/product_stock_freshness.py` to:
   `igh_search/igh_search/product_stock_freshness.py`

2. Append wrappers from `server/igh_search/api_stock_freshness_wrappers.py`
   into `igh_search/igh_search/api.py`.

3. Add hook entries shown in `server/igh_search/hooks_stock_freshness.py`
   into app `hooks.py`:
   - `doc_events` for `Bin` and `Stock Ledger Entry`
   - scheduler cron jobs for:
     - `process_pending_stock_sync_batch` (every minute)
     - `run_stock_drift_repair` (every 30 minutes)

4. Add feature flags to site config (`site_config.json`) with safe defaults:

   ```json
   {
     "stock_event_sync_enabled": 0,
     "stock_runtime_reconcile_enabled": 1,
     "stock_drift_scan_enabled": 0
   }
   ```

5. Deploy dark (flags off), then phased enable:
   - enable `stock_event_sync_enabled` for live event sync
   - monitor health endpoint:
     `igh_search.igh_search.api.get_search_freshness_health`
   - enable `stock_drift_scan_enabled` after event sync stability

6. Admin endpoints:
   - `igh_search.igh_search.api.get_search_freshness_health`
   - `igh_search.igh_search.api.run_stock_drift_repair`
   - `igh_search.igh_search.api.reindex_stock_for_items`
