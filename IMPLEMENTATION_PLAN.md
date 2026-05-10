# IHG Sales Portal — Complete Implementation Plan
**Handoff document for full implementation by AI model or developer.**

---

## Project Overview

**What this is:** An internal sales portal for IHG's sales team. The team uses it to search and filter products, add them to a cart, and create quotations linked to ERPNext Opportunities.

**Tech stack:**
- Frontend: Next.js 14 (Pages Router), React 18, Redux Toolkit, Tailwind CSS
- Backend: ERPNext / Frappe (Python), custom app `igh_search`
- Search: Typesense (vector/keyword hybrid)
- Proxy: Next.js API route at `/pages/api/erp/[...path].js` forwards all ERP calls cookie-preserving to `http://167.71.204.41`

**Key rule:** The `ecommerce_business_store` Frappe app is **NOT installed**. All backend logic lives in the `igh_search` custom app only.

**Server:** `167.71.204.41` — ERPNext/Frappe instance. SSH access available.
**Bench path:** `/home/frappe/frappe-bench`
**App path:** `/home/frappe/frappe-bench/apps/igh_search/igh_search/igh_search/`
**Currency:** AED (UAE Dirham)

---

## Repository Structure (relevant files)

```
IHG-Front-End-App/
├── pages/
│   ├── index.js                          ← Homepage (currently calls go1_cms — broken)
│   ├── login.js                          ← Login page
│   ├── api/
│   │   └── erp/[...path].js              ← ERP cookie-forwarding proxy
│   ├── search/index.js                   ← Search page entry
│   ├── list/index.js                     ← Product list
│   └── pr/[...detail]/index.js           ← Product detail
├── components/
│   ├── Sales/
│   │   ├── CartModal.jsx                 ← Modal wrapper around CartSidebar
│   │   ├── CartSidebar.jsx               ← Full cart + opportunity + quotation UI
│   │   ├── QuotationHistoryDrawer.jsx    ← Recent quotations slide-out
│   │   └── SalesAddToCartModal.jsx       ← Product quick-add modal with stock
│   ├── Search/v2/
│   │   ├── V2SearchPage.jsx              ← Main search UI (Typesense)
│   │   └── components/ProductCard.jsx   ← Product card in search results
│   ├── Auth/
│   │   ├── Login.jsx                     ← Login form component
│   │   └── AuthModal.jsx                 ← Auth modal wrapper
│   └── Headers/
│       └── webheader/MainHeader.jsx      ← Desktop header with search bar
├── libs/
│   ├── api.js                            ← All API call functions (frontend)
│   ├── auth.js                           ← Session management helpers
│   └── config/siteConfig.js             ← Domain, API keys config
├── redux/
│   └── slice/
│       ├── cartSettings.js               ← Cart Redux slice
│       └── logInInfo.js                  ← Login state slice
└── server/                               ← Created by previous work session
    ├── api_implementation.py             ← Complete backend Python implementation
    ├── deploy.sh                         ← Deployment script
    └── test_apis.sh                      ← API test script
```

---

## Authentication Flow

Login → `POST /api/erp/api/method/login` (form-encoded `usr` + `pwd`) → Frappe sets HttpOnly `sid` cookie → all subsequent API calls include `credentials: 'include'` → proxy forwards `Cookie` header verbatim to ERP.

**Frontend login signal:** `localStorage['full_name']` (written on successful login, cleared on logout). The `sid` cookie is HttpOnly so JavaScript cannot read it.

**After login, these localStorage keys are set:**
- `full_name` — user display name
- `CustomerId` / `customerRefId` / `CustomerName` — customer profile
- `email`

---

---

# PHASE 1 — Backend: Python APIs on ERPNext Server

**Status:** Implementation written at `server/api_implementation.py`. Must be deployed to server.

## 1.1 Deploy Steps

SSH into server and run:

```bash
# 1. Login to server
ssh root@167.71.204.41
# password: IhG@dEV$2025@12e

# 2. Find exact app directory
find /home -path "*/igh_search/igh_search/igh_search" -type d 2>/dev/null
# Expected: /home/frappe/frappe-bench/apps/igh_search/igh_search/igh_search

# 3. Check/backup existing api.py
APP_DIR="/home/frappe/frappe-bench/apps/igh_search/igh_search/igh_search"
ls -la $APP_DIR/api.py
cp $APP_DIR/api.py $APP_DIR/api.py.bak_$(date +%Y%m%d) 2>/dev/null || echo "no existing file"

# 4. Deploy the implementation
# Either SCP the file:
#   scp server/api_implementation.py root@167.71.204.41:$APP_DIR/api.py
# Or paste content using heredoc (see section 1.2)

# 5. Also ensure top-level wrapper exists at:
TOPLEVEL="/home/frappe/frappe-bench/apps/igh_search/igh_search/api.py"
# This file should already exist. If it doesn't, create it (see section 1.3)

# 6. Restart
cd /home/frappe/frappe-bench
bench restart

# 7. Syntax check
python3 -c "import ast; ast.parse(open('$APP_DIR/api.py').read()); print('OK')"
```

## 1.2 Complete Python Implementation

**File to create/replace:** `/home/frappe/frappe-bench/apps/igh_search/igh_search/igh_search/api.py`

The full implementation is in `server/api_implementation.py`. Copy it verbatim. Here is the complete content:

```python
"""
IHG Search – Sales Portal API
File: apps/igh_search/igh_search/igh_search/api.py
"""

import json
import uuid

import frappe
from frappe import _
from frappe.utils import flt, cstr, getdate, nowdate


# ─── CART HELPERS (Redis, per-user, 24h TTL) ──────────────────────────────────

_CART_TTL = 86_400


def _cart_key():
    return f"ihg_cart:{frappe.session.user}"


def _get_raw_cart():
    raw = frappe.cache().get_value(_cart_key())
    if not raw:
        return []
    try:
        return json.loads(raw) if isinstance(raw, str) else list(raw)
    except Exception:
        return []


def _save_raw_cart(items):
    frappe.cache().set_value(_cart_key(), json.dumps(items), expires_in_sec=_CART_TTL)


def _get_item_rate(item_code):
    price_list = (
        frappe.db.get_single_value("Selling Settings", "selling_price_list")
        or "Standard Selling"
    )
    rate = frappe.db.get_value(
        "Item Price",
        {"item_code": item_code, "price_list": price_list, "selling": 1},
        "price_list_rate",
    )
    return flt(rate)


def _enrich_item(item_code, qty):
    try:
        item = frappe.db.get_value(
            "Item",
            item_code,
            ["item_code", "item_name", "stock_uom", "brand", "item_group", "image"],
            as_dict=True,
        )
        if not item:
            return None
        rate = _get_item_rate(item_code)
        qty = flt(qty) or 1
        return {
            "name": str(uuid.uuid4()),
            "item_code": item.item_code,
            "item_name": item.item_name or item_code,
            "quantity": qty,
            "rate": rate,
            "amount": round(qty * rate, 2),
            "stock_uom": item.stock_uom or "Nos",
            "brand": item.brand or "",
            "item_group": item.item_group or "",
            "website_image_url": item.image or "",
            "image": item.image or "",
        }
    except Exception:
        frappe.log_error(frappe.get_traceback(), "IHG Cart: _enrich_item error")
        return None


def _cart_totals(items):
    total = sum(flt(i.get("rate", 0)) * flt(i.get("quantity", 0)) for i in items)
    return round(total, 2)


def _require_login():
    if not frappe.session.user or frappe.session.user == "Guest":
        frappe.throw(_("Authentication required"), frappe.AuthenticationError)


# ─── CART APIs ────────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_cart_items(**kwargs):
    _require_login()
    items = _get_raw_cart()
    total = _cart_totals(items)
    return {
        "status": "success",
        "cart": {"marketplace_items": items},
        "total": total,
        "grand_total": total,
    }


@frappe.whitelist()
def insert_cart_items(item_code=None, qty=1, **kwargs):
    _require_login()
    if not item_code:
        return {"status": "error", "message": "item_code is required"}
    qty = flt(qty) or 1
    items = _get_raw_cart()
    existing = next((i for i in items if i["item_code"] == item_code), None)
    if existing:
        existing["quantity"] = flt(existing["quantity"]) + qty
        existing["amount"] = round(existing["quantity"] * flt(existing.get("rate", 0)), 2)
    else:
        new_item = _enrich_item(item_code, qty)
        if not new_item:
            return {"status": "error", "message": f"Item '{item_code}' not found"}
        items.append(new_item)
    _save_raw_cart(items)
    total = _cart_totals(items)
    return {
        "status": "success",
        "message": "Added to cart",
        "cart": {"marketplace_items": items},
        "total": total,
        "grand_total": total,
    }


@frappe.whitelist()
def update_cartitem(item_code=None, qty=0, **kwargs):
    _require_login()
    if not item_code:
        return {"status": "error", "message": "item_code is required"}
    qty = flt(qty)
    items = _get_raw_cart()
    if qty <= 0:
        items = [i for i in items if i["item_code"] != item_code]
    else:
        found = False
        for item in items:
            if item["item_code"] == item_code:
                item["quantity"] = qty
                item["amount"] = round(qty * flt(item.get("rate", 0)), 2)
                found = True
                break
        if not found:
            return {"status": "error", "message": "Item not found in cart"}
    _save_raw_cart(items)
    return {"status": "success", "message": "Cart updated"}


@frappe.whitelist()
def delete_cart_items(cart_id=None, **kwargs):
    _require_login()
    items = _get_raw_cart()
    before = len(items)
    filtered = [i for i in items if i.get("name") != cart_id]
    if len(filtered) == before:
        filtered = [i for i in items if i.get("item_code") != cart_id]
    _save_raw_cart(filtered)
    return {"status": "success", "message": "Item removed"}


@frappe.whitelist()
def clear_cart(**kwargs):
    _require_login()
    frappe.cache().delete_value(_cart_key())
    return {"status": "success", "message": "Cart cleared"}


@frappe.whitelist()
def clear_cartitem(**kwargs):
    return clear_cart(**kwargs)


@frappe.whitelist()
def move_item_to_cart(**kwargs):
    return {"status": "success", "message": "Not applicable for sales portal"}


@frappe.whitelist()
def move_all_tocart(**kwargs):
    return {"status": "success", "message": "Not applicable for sales portal"}


# ─── OPPORTUNITY APIs ─────────────────────────────────────────────────────────

@frappe.whitelist()
def search_opportunities(search="", customer_id="", **kwargs):
    _require_login()
    search = cstr(search).strip()
    if search:
        rows = frappe.db.sql(
            """
            SELECT name, customer_name, customer, title, status, expected_closing
            FROM   `tabOpportunity`
            WHERE  status NOT IN ('Closed', 'Lost', 'Converted')
              AND  (name LIKE %(s)s OR customer_name LIKE %(s)s OR title LIKE %(s)s)
            ORDER  BY modified DESC
            LIMIT  25
            """,
            {"s": f"%{search}%"},
            as_dict=True,
        )
    else:
        rows = frappe.get_list(
            "Opportunity",
            filters={"status": ["not in", ["Closed", "Lost", "Converted"]]},
            fields=["name", "customer_name", "customer", "title", "status", "expected_closing"],
            order_by="modified desc",
            limit=25,
        )
    return {"status": "success", "data": rows}


@frappe.whitelist()
def get_user_opportunities(**kwargs):
    _require_login()
    rows = frappe.get_list(
        "Opportunity",
        filters={"status": ["not in", ["Closed", "Lost", "Converted"]]},
        fields=["name", "customer_name", "customer", "title", "status", "expected_closing"],
        order_by="modified desc",
        limit=50,
    )
    return {"status": "success", "data": rows}


# ─── QUOTATION APIs ───────────────────────────────────────────────────────────

@frappe.whitelist()
def create_quotation_from_portal(opportunity=None, items=None, **kwargs):
    _require_login()
    if not opportunity:
        frappe.throw(_("opportunity is required"))
    if not items:
        frappe.throw(_("items list is required"))
    if isinstance(items, str):
        items = json.loads(items)
    if not isinstance(items, list) or not items:
        frappe.throw(_("items list is empty"))

    opp = frappe.db.get_value(
        "Opportunity",
        opportunity,
        ["customer", "customer_name", "opportunity_from", "party_name"],
        as_dict=True,
    )
    if not opp:
        frappe.throw(_(f"Opportunity '{opportunity}' not found"))

    party_name = opp.customer or opp.party_name or opp.customer_name
    if not party_name:
        frappe.throw(_("Opportunity has no linked customer"))

    q_items = []
    for row in items:
        code = cstr(row.get("item_code", "")).strip()
        if not code:
            continue
        if not frappe.db.exists("Item", code):
            frappe.throw(_(f"Item '{code}' does not exist"))
        q_items.append({
            "doctype": "Quotation Item",
            "item_code": code,
            "qty": flt(row.get("qty", 1)) or 1,
            "rate": flt(row.get("rate", 0)),
            "description": cstr(row.get("description", "")),
        })

    if not q_items:
        frappe.throw(_("No valid items provided"))

    quotation = frappe.get_doc({
        "doctype": "Quotation",
        "quotation_to": "Customer",
        "party_name": party_name,
        "opportunity": opportunity,
        "transaction_date": getdate(nowdate()),
        "valid_till": frappe.utils.add_days(nowdate(), 30),
        "order_type": "Sales",
        "items": q_items,
    })
    quotation.insert()
    return {"status": "success", "quotation": quotation.name}


@frappe.whitelist()
def get_recent_quotations(**kwargs):
    _require_login()
    rows = frappe.get_list(
        "Quotation",
        filters={"owner": frappe.session.user},
        fields=["name", "party_name", "customer_name", "opportunity",
                "grand_total", "status", "transaction_date", "creation"],
        order_by="creation desc",
        limit=20,
    )
    for r in rows:
        if not r.get("customer_name") and r.get("party_name"):
            r["customer_name"] = r["party_name"]
    return {"status": "success", "data": rows}


# ─── PRODUCT APIs ─────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_product_info(item_code=None, **kwargs):
    if not item_code:
        return {"status": "error", "message": "item_code is required"}
    item_code = cstr(item_code).strip()
    item = frappe.db.get_value(
        "Item",
        item_code,
        ["item_code", "item_name", "description", "brand", "item_group",
         "stock_uom", "image", "min_order_qty", "has_variants"],
        as_dict=True,
    )
    if not item:
        return {"status": "error", "message": f"Item '{item_code}' not found"}

    rate = _get_item_rate(item_code)

    stock_rows = frappe.db.sql(
        """
        SELECT warehouse, actual_qty, reserved_qty,
               GREATEST(actual_qty - reserved_qty, 0) AS available_qty
        FROM   `tabBin`
        WHERE  item_code = %s
        ORDER  BY actual_qty DESC
        """,
        item_code,
        as_dict=True,
    )
    stock_list = [dict(r) for r in stock_rows]
    total_stock = sum(flt(r.actual_qty) for r in stock_rows)

    return {
        "item_code":         item.item_code,
        "item_name":         item.item_name,
        "description":       item.description or "",
        "brand":             item.brand or "",
        "item_group":        item.item_group or "",
        "category_list":     item.item_group or "",
        "stock_uom":         item.stock_uom or "Nos",
        "image":             item.image or "",
        "website_image_url": item.image or "",
        "rate":              rate,
        "offer_rate":        0,
        "in_stock":          total_stock > 0,
        "stock":             stock_list,
        "total_stock":       total_stock,
        "minimum_order_qty": flt(item.min_order_qty) or 1,
        "has_variants":      item.has_variants,
    }


@frappe.whitelist()
def get_product_details(item_code=None, **kwargs):
    return get_product_info(item_code=item_code, **kwargs)


# ─── MASTERS ─────────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_all_masters(**kwargs):
    brands = frappe.db.sql(
        "SELECT DISTINCT brand AS name FROM `tabItem` "
        "WHERE brand IS NOT NULL AND brand != '' AND disabled = 0 ORDER BY brand LIMIT 500",
        as_dict=True,
    )
    item_groups = frappe.db.sql(
        "SELECT name FROM `tabItem Group` WHERE name != 'All Item Groups' ORDER BY name LIMIT 300",
        as_dict=True,
    )
    attr_rows = frappe.db.sql(
        """
        SELECT ia.attribute, iav.attribute_value AS value
        FROM   `tabItem Attribute` ia
        JOIN   `tabItem Attribute Value` iav ON iav.parent = ia.name
        ORDER  BY ia.attribute, iav.attribute_value
        LIMIT  3000
        """,
        as_dict=True,
    )
    attributes = {}
    for r in attr_rows:
        attributes.setdefault(r.attribute, []).append(r.value)
    return {
        "brands":      [b.name for b in brands],
        "item_groups": [g.name for g in item_groups],
        "attributes":  attributes,
    }


# ─── AI SEARCH ───────────────────────────────────────────────────────────────

@frappe.whitelist()
def ai_product_search(query=None, filters=None, **kwargs):
    if not query:
        return {"status": "error", "message": "query is required"}
    query = cstr(query).strip()
    if not query:
        return {"status": "success", "items": []}
    rows = frappe.db.sql(
        """
        SELECT item_code, item_name, brand, item_group, image
        FROM   `tabItem`
        WHERE  disabled = 0
          AND  (item_code LIKE %(q)s OR item_name LIKE %(q)s OR description LIKE %(q)s)
        ORDER  BY item_name
        LIMIT  50
        """,
        {"q": f"%{query}%"},
        as_dict=True,
    )
    return {"status": "success", "items": [dict(r) for r in rows]}


# ─── CUSTOMER INFO ────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_customer_info(**kwargs):
    _require_login()
    user = frappe.session.user
    customer_name = frappe.db.get_value("Customer", {"email_id": user}, "name")
    if not customer_name:
        contact = frappe.db.get_value("Contact", {"email_id": user}, "name")
        if contact:
            customer_name = frappe.db.get_value(
                "Dynamic Link",
                {"parent": contact, "link_doctype": "Customer"},
                "link_name",
            )
    if customer_name:
        cust = frappe.db.get_value(
            "Customer",
            customer_name,
            ["name", "customer_name", "customer_group", "territory", "email_id"],
            as_dict=True,
        )
        return {
            "status": "success",
            "message": [{
                "name":           cust.name,
                "full_name":      cust.customer_name,
                "email":          cust.email_id or user,
                "customer_group": cust.customer_group,
                "territory":      cust.territory,
                "first_name":     cust.customer_name,
                "last_name":      "",
                "phone":          "",
                "user_id":        user,
                "referral_code":  "",
            }],
        }
    user_doc = frappe.db.get_value("User", user, ["name", "full_name", "email"], as_dict=True)
    return {
        "status": "success",
        "message": [{
            "name":      user_doc.name if user_doc else user,
            "full_name": user_doc.full_name if user_doc else user,
            "email":     user_doc.email if user_doc else user,
            "user_id":   user,
        }],
    }
```

## 1.3 Top-Level Wrapper Fix

**File:** `/home/frappe/frappe-bench/apps/igh_search/igh_search/api.py`

Check if this file exists. If it does, verify it has `get_user_opportunities`. If not, add it. If file doesn't exist, create it:

```python
"""
igh_search top-level API — delegates to igh_search.igh_search.api
This file handles the igh_search.api.* call path (without double igh_search).
"""
import frappe
from importlib import import_module


def _impl():
    return import_module("igh_search.igh_search.api")


def _clean(kwargs):
    cleaned = dict(kwargs or {})
    for key in ("cmd", "data"):
        cleaned.pop(key, None)
    return cleaned


@frappe.whitelist(allow_guest=True)
def get_cart_items(*args, **kwargs):
    return _impl().get_cart_items(*args, **_clean(kwargs))

@frappe.whitelist(allow_guest=True)
def update_cartitem(*args, **kwargs):
    return _impl().update_cartitem(*args, **_clean(kwargs))

@frappe.whitelist(allow_guest=True)
def insert_cart_items(*args, **kwargs):
    return _impl().insert_cart_items(*args, **_clean(kwargs))

@frappe.whitelist(allow_guest=True)
def delete_cart_items(*args, **kwargs):
    return _impl().delete_cart_items(*args, **_clean(kwargs))

@frappe.whitelist(allow_guest=True)
def get_user_opportunities(*args, **kwargs):
    return _impl().get_user_opportunities(*args, **_clean(kwargs))

@frappe.whitelist(allow_guest=True)
def create_quotation_from_portal(*args, **kwargs):
    return _impl().create_quotation_from_portal(*args, **_clean(kwargs))

@frappe.whitelist(allow_guest=True)
def get_customer_info(*args, **kwargs):
    return _impl().get_customer_info(*args, **_clean(kwargs))

@frappe.whitelist(allow_guest=True)
def get_product_details(*args, **kwargs):
    return _impl().get_product_details(*args, **_clean(kwargs))

@frappe.whitelist(allow_guest=True)
def clear_cartitem(*args, **kwargs):
    return _impl().clear_cartitem(*args, **_clean(kwargs))

@frappe.whitelist(allow_guest=True)
def move_item_to_cart(*args, **kwargs):
    return _impl().move_item_to_cart(*args, **_clean(kwargs))

@frappe.whitelist(allow_guest=True)
def move_all_tocart(*args, **kwargs):
    return _impl().move_all_tocart(*args, **_clean(kwargs))
```

## 1.4 API Test Commands

Run these curl commands from the server or any machine that can reach `167.71.204.41`. Save them in a script:

```bash
BASE="http://167.71.204.41"
COOKIE="/tmp/ihg_test.txt"

# Login
curl -s -c $COOKIE -X POST "$BASE/api/method/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "usr=Administrator&pwd=IhG%40dEV%242025%4012e" | python3 -m json.tool

# --- CART TESTS ---

# get_cart_items (expect: status=success, cart.marketplace_items=[])
curl -s -b $COOKIE "$BASE/api/method/igh_search.igh_search.api.get_cart_items" | python3 -m json.tool

# insert_cart_items (replace ITEM-001 with a real item code from your ERP)
curl -s -b $COOKIE -X POST "$BASE/api/method/igh_search.igh_search.api.insert_cart_items" \
  -H "Content-Type: application/json" \
  -d '{"item_code":"ITEM-001","qty":2}' | python3 -m json.tool

# update_cartitem
curl -s -b $COOKIE -X POST "$BASE/api/method/igh_search.igh_search.api.update_cartitem" \
  -H "Content-Type: application/json" \
  -d '{"item_code":"ITEM-001","qty":5}' | python3 -m json.tool

# delete_cart_items (use name UUID from insert response)
curl -s -b $COOKIE -X POST "$BASE/api/method/igh_search.igh_search.api.delete_cart_items" \
  -H "Content-Type: application/json" \
  -d '{"cart_id":"<UUID from insert response>"}' | python3 -m json.tool

# clear_cart
curl -s -b $COOKIE -X POST "$BASE/api/method/igh_search.igh_search.api.clear_cart" \
  -H "Content-Type: application/json" -d '{}' | python3 -m json.tool

# --- OPPORTUNITY TESTS ---

# search_opportunities
curl -s -b $COOKIE -X POST "$BASE/api/method/igh_search.igh_search.api.search_opportunities" \
  -H "Content-Type: application/json" \
  -d '{"search":""}' | python3 -m json.tool

# get_user_opportunities (direct path)
curl -s -b $COOKIE "$BASE/api/method/igh_search.igh_search.api.get_user_opportunities" | python3 -m json.tool

# get_user_opportunities (wrapper path — MUST also work)
curl -s -b $COOKIE "$BASE/api/method/igh_search.api.get_user_opportunities" | python3 -m json.tool

# --- QUOTATION TESTS ---

# create_quotation_from_portal (replace OPP-0001 with real opportunity, ITEM-001 with real item)
curl -s -b $COOKIE -X POST "$BASE/api/method/igh_search.igh_search.api.create_quotation_from_portal" \
  -H "Content-Type: application/json" \
  -d '{"opportunity":"OPP-0001","items":[{"item_code":"ITEM-001","qty":1,"rate":100}]}' | python3 -m json.tool

# get_recent_quotations
curl -s -b $COOKIE -X POST "$BASE/api/method/igh_search.igh_search.api.get_recent_quotations" \
  -H "Content-Type: application/json" -d '{}' | python3 -m json.tool

# --- PRODUCT TESTS ---

# get_product_info (replace ITEM-001 with real item)
curl -s -b $COOKIE -X POST "$BASE/api/method/igh_search.igh_search.api.get_product_info" \
  -H "Content-Type: application/json" \
  -d '{"item_code":"ITEM-001"}' | python3 -m json.tool

# --- MASTERS ---

curl -s -b $COOKIE "$BASE/api/method/igh_search.igh_search.api.get_all_masters" | python3 -m json.tool

# --- AI SEARCH ---
curl -s -b $COOKIE -X POST "$BASE/api/method/igh_search.igh_search.api.ai_product_search" \
  -H "Content-Type: application/json" \
  -d '{"query":"led lamp"}' | python3 -m json.tool
```

## 1.5 Expected Responses

| API | Expected response shape |
|-----|------------------------|
| `get_cart_items` | `{"message":{"status":"success","cart":{"marketplace_items":[]},"total":0,"grand_total":0}}` |
| `insert_cart_items` | `{"message":{"status":"success","cart":{"marketplace_items":[{...item...}]},...}}` |
| `update_cartitem` | `{"message":{"status":"success","message":"Cart updated"}}` |
| `delete_cart_items` | `{"message":{"status":"success","message":"Item removed"}}` |
| `clear_cart` | `{"message":{"status":"success","message":"Cart cleared"}}` |
| `search_opportunities` | `{"message":{"status":"success","data":[{name,customer_name,customer,title,status}]}}` |
| `create_quotation_from_portal` | `{"message":{"status":"success","quotation":"QTN-2026-00001"}}` |
| `get_recent_quotations` | `{"message":{"status":"success","data":[{name,customer_name,grand_total,status,...}]}}` |
| `get_product_info` | `{"message":{"item_code":"...","rate":100,"in_stock":true,"stock":[{warehouse,actual_qty}],...}}` |
| `get_all_masters` | `{"message":{"brands":["Brand A"],"item_groups":["Lighting"],"attributes":{...}}}` |

## 1.6 Common Errors and Fixes

**Error:** `"AuthenticationError: Authentication required"` on any API
- **Cause:** Cookie not forwarded or user is Guest. Check that the Frappe `sid` cookie exists.
- **Fix:** Ensure the proxy at `/pages/api/erp/[...path].js` forwards `req.headers.cookie`. It already does — verify login was successful and the cookie jar has a `sid` cookie.

**Error:** `"create_quotation_from_portal" — Quotation has no linked customer`
- **Cause:** The Opportunity has no `customer` field set.
- **Fix:** In ERPNext desk, open the Opportunity and link it to a Customer, or set `opportunity_from = "Lead"` and handle the Lead type in the Python code.
- **Code fix in `create_quotation_from_portal`:** If `opp.opportunity_from == "Lead"`, set `quotation_to = "Lead"` instead of `"Customer"`.

**Error:** `"Item 'XXX' does not exist"`
- **Cause:** The item code passed from cart doesn't exist in ERPNext Item master.
- **Fix:** Verify the item codes in Typesense match exactly with ERPNext Item codes.

**Error:** `500 Internal Server Error` on `get_all_masters`
- **Cause:** `tabItem Attribute` or `tabItem Attribute Value` tables may not exist if the Item Variants feature is disabled.
- **Fix:** Wrap the attribute query in a try/except and return `attributes: {}` on failure.

---

---

# PHASE 2 — Frontend Bug Fixes

**All changes are in `IHG-Front-End-App/`. Run `npm run dev` to test after each change.**

## 2.1 Fix: `isLoggedIn` Check in CartSidebar

**File:** `components/Sales/CartSidebar.jsx`
**Line:** 210
**Problem:** `localStorage.getItem('full_name')` — this is the correct key (written at login line 87 of `Login.jsx`). This is actually fine as-is. BUT it only works after the component mounts. The issue is SSR — on server render `typeof window === 'undefined'` causes it to always be `false`.

**Current code (line 210):**
```javascript
const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('full_name');
```

**Fix:** Move to state with useEffect to ensure hydration works:
```javascript
// Add this at the top of CartSidebar component (with other useState calls):
const [isLoggedIn, setIsLoggedIn] = useState(false);
useEffect(() => {
  setIsLoggedIn(!!localStorage.getItem('full_name'));
}, []);
```
**Delete** the existing line 210 `const isLoggedIn = ...`.

## 2.2 Fix: ERPNext Desk URL Port

**File:** `libs/api.js`
**Line:** 148
**Problem:** `getErpDeskQuotationUrl` hardcodes `:8000` port. Frappe in production runs on port 80 (no port).

**Current code:**
```javascript
return `http://${domain}:8000/app/quotation/${encodeURIComponent(quotationName)}`;
```

**Fix:**
```javascript
return `http://${domain}/app/quotation/${encodeURIComponent(quotationName)}`;
```

**Note:** If Frappe runs on port 8000 on this specific server, keep `:8000`. Test by visiting `http://167.71.204.41/app` in browser. If it opens ERPNext desk, remove `:8000`. If not, try `http://167.71.204.41:8000/app`.

## 2.3 Fix: Currency Formatter Inconsistency

**File:** `libs/api.js`
**Line:** 46-49
**Problem:** `currencyFormatter` uses `INR` but the whole app uses AED.

**Current code:**
```javascript
export const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
});
```

**Fix:**
```javascript
export const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AED',
});
```

## 2.4 Fix: Homepage Broken API Call

**File:** `pages/index.js`
**Problem:** Calls `go1_cms.go1_cms.api.get_page_content` which is NOT installed. Page shows loading forever.

**File:** `libs/api.js` line 370-373:
```javascript
export async function HomePage(data) {
    let api = methodUrl + 'go1_cms.go1_cms.api.get_page_content';
    return await postMethod(api, data)
}
```

**Fix option A — Replace with a Sales Dashboard (recommended, see Phase 4).**

**Fix option B — Quick fix to stop the infinite load:** Replace `pages/index.js` `getData` call to handle the 404 gracefully:

In `pages/index.js`, change:
```javascript
const resp = await HomePage(param);
const data = resp.message ? resp.message : {}
setData(data)
setLoading(false)
```
To:
```javascript
try {
    const resp = await HomePage(param);
    const data = resp?.message || {};
    setData(data);
} catch (e) {
    setData({});
} finally {
    setLoading(false);
}
```
This prevents the infinite spinner. The homepage will be empty until Phase 4 replaces it.

## 2.5 Fix: Cart Not Loading on App Start

**Problem:** `V2SearchPage.jsx` has a comment at line 165:
```javascript
// Cart state loading intentionally removed from V2.
// ecommerce_business_store is not installed on this server — get_cart_items would 417.
```
Now that Phase 1 is deployed, cart loading should be re-enabled.

**File:** `components/Search/v2/V2SearchPage.jsx`
**Find the comment block around line 165 and add after it:**
```javascript
useEffect(() => {
    let active = true;
    (async () => {
        try {
            const res = await get_cart_items();
            if (active && res?.message?.status === 'success') {
                dispatch(setCartItems(res.message));
            }
        } catch (_) {}
    })();
    return () => { active = false; };
}, []);
```

**Also add to imports at top of V2SearchPage.jsx:**
```javascript
import { useDispatch } from 'react-redux';
import { setCartItems } from '@/redux/slice/cartSettings';
// (get_cart_items is already imported)
```
**And add inside the component:**
```javascript
const dispatch = useDispatch();
```

## 2.6 Fix: `get_user_opportunities` Module Path (ALREADY DONE)

**File:** `libs/api.js` line 848-851
**Already fixed** in the previous work session. Verify it reads:
```javascript
export async function get_user_opportunities() {
    let api = methodUrl + 'igh_search.igh_search.api.get_user_opportunities';
    return await get(api);
}
```

## 2.7 Fix: total_stock Display in SalesAddToCartModal

**File:** `components/Sales/SalesAddToCartModal.jsx`
**Line:** 49
**Problem:** `const totalStock = Number(merged?.stock) || 0` — `stock` is now an array (warehouse breakdown), so `Number(array) = NaN → 0`. Display shows "In units in stock" instead of the actual count.

**Current code:**
```javascript
const totalStock = Number(merged?.stock) || 0;
```

**Fix:**
```javascript
const totalStock = Number(merged?.total_stock) || 0;
```

This uses the `total_stock` numeric field returned by `get_product_info`.

---

---

# PHASE 3 — Sales Feature Enhancements

## 3.1 Customer Selection Without Opportunity

**Problem:** Currently, a quotation can only be created if an Opportunity exists. Sales reps sometimes want to quote directly to a customer.

### 3.1.1 Backend: New API `create_quotation_direct`

**Add to:** `/home/frappe/frappe-bench/apps/igh_search/igh_search/igh_search/api.py`

```python
@frappe.whitelist()
def search_customers(search="", **kwargs):
    _require_login()
    search = cstr(search).strip()
    if not search:
        rows = frappe.get_list(
            "Customer",
            fields=["name", "customer_name", "customer_group", "territory"],
            order_by="customer_name asc",
            limit=25,
        )
    else:
        rows = frappe.db.sql(
            """
            SELECT name, customer_name, customer_group, territory
            FROM   `tabCustomer`
            WHERE  (name LIKE %(s)s OR customer_name LIKE %(s)s)
              AND  disabled = 0
            ORDER  BY customer_name
            LIMIT  25
            """,
            {"s": f"%{search}%"},
            as_dict=True,
        )
    return {"status": "success", "data": rows}


@frappe.whitelist()
def create_quotation_direct(customer=None, items=None, **kwargs):
    """Create quotation directly against a customer (no Opportunity required)."""
    _require_login()
    if not customer:
        frappe.throw(_("customer is required"))
    if not items:
        frappe.throw(_("items list is required"))
    if isinstance(items, str):
        items = json.loads(items)

    if not frappe.db.exists("Customer", customer):
        frappe.throw(_(f"Customer '{customer}' not found"))

    q_items = []
    for row in items:
        code = cstr(row.get("item_code", "")).strip()
        if not code or not frappe.db.exists("Item", code):
            continue
        q_items.append({
            "doctype": "Quotation Item",
            "item_code": code,
            "qty": flt(row.get("qty", 1)) or 1,
            "rate": flt(row.get("rate", 0)),
            "description": cstr(row.get("description", "")),
        })

    if not q_items:
        frappe.throw(_("No valid items provided"))

    quotation = frappe.get_doc({
        "doctype": "Quotation",
        "quotation_to": "Customer",
        "party_name": customer,
        "transaction_date": getdate(nowdate()),
        "valid_till": frappe.utils.add_days(nowdate(), 30),
        "order_type": "Sales",
        "items": q_items,
    })
    quotation.insert()
    return {"status": "success", "quotation": quotation.name}
```

**Also add to top-level wrapper** (`igh_search/api.py`):
```python
@frappe.whitelist(allow_guest=True)
def search_customers(*args, **kwargs):
    return _impl().search_customers(*args, **_clean(kwargs))

@frappe.whitelist(allow_guest=True)
def create_quotation_direct(*args, **kwargs):
    return _impl().create_quotation_direct(*args, **_clean(kwargs))
```

### 3.1.2 Frontend: Add API functions

**File:** `libs/api.js` — add at the end:

```javascript
export async function search_customers(search) {
    let api = methodUrl + 'igh_search.igh_search.api.search_customers';
    return await postMethod(api, { search });
}

export async function create_quotation_direct(payload) {
    let api = methodUrl + 'igh_search.igh_search.api.create_quotation_direct';
    return await postMethod(api, payload);
}
```

### 3.1.3 Frontend: Update CartSidebar to support both modes

**File:** `components/Sales/CartSidebar.jsx`

Add a toggle at the top of the opportunity selector section — a radio/toggle between "Link to Opportunity" and "Direct Customer":

**Inside the `return` JSX, find the `{/* Opportunity selector */}` section (around line 290) and replace with:**

```jsx
{/* Mode Toggle */}
<div className="flex gap-[4px] mb-[8px]">
    {['opportunity', 'customer'].map((m) => (
        <button
            key={m}
            onClick={() => { setMode(m); clearOpp(); clearCustomer(); }}
            className={`flex-1 py-[5px] text-[10px] font-bold uppercase tracking-[0.08em] border transition-colors ${
                mode === m ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#6b7280] border-[#d1d5db] hover:border-[#111]'
            }`}
        >
            {m === 'opportunity' ? 'Opportunity' : 'Direct Customer'}
        </button>
    ))}
</div>

{/* Opportunity search (existing code, visible when mode==='opportunity') */}
{mode === 'opportunity' && (
    /* ...existing opportunity selector JSX... */
)}

{/* Customer search (new, visible when mode==='customer') */}
{mode === 'customer' && (
    <CustomerSelector
        selected={selectedCustomer}
        onSelect={setSelectedCustomer}
        onClear={clearCustomer}
    />
)}
```

**Add state at top of CartSidebar:**
```javascript
const [mode, setMode] = useState('opportunity'); // 'opportunity' | 'customer'
const [selectedCustomer, setSelectedCustomer] = useState(null);
const clearCustomer = () => setSelectedCustomer(null);
```

**Update `handleCreateQuotation`** to branch on mode:
```javascript
const handleCreateQuotation = async () => {
    if (mode === 'opportunity' && !selectedOpp) {
        toast.warning('Select an opportunity first');
        return;
    }
    if (mode === 'customer' && !selectedCustomer) {
        toast.warning('Select a customer first');
        return;
    }
    if (!cartItems.length) {
        toast.warning('Cart is empty');
        return;
    }

    const quotationWindow = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    setIsCreating(true);
    try {
        const itemsPayload = cartItems.map((item) => ({
            item_code: item.item_code,
            qty: item.quantity || item.count || 1,
            rate: item.rate,
            description: itemNotes[item.item_code] || '',
        }));

        let resp;
        if (mode === 'opportunity') {
            resp = await create_quotation_from_portal({
                opportunity: selectedOpp.name,
                items: itemsPayload,
            });
        } else {
            resp = await create_quotation_direct({
                customer: selectedCustomer.name,
                items: itemsPayload,
            });
        }
        // ...rest of success handling (same as existing)...
    }
};
```

**Add `CustomerSelector` component** at the bottom of `CartSidebar.jsx` (same file, after `Spinner`):

```jsx
function CustomerSelector({ selected, onSelect, onClear }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const debounce = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (debounce.current) clearTimeout(debounce.current);
        if (!val.trim()) { setResults([]); setOpen(false); return; }
        debounce.current = setTimeout(async () => {
            setLoading(true); setOpen(true);
            try {
                const resp = await search_customers(val.trim());
                setResults(resp?.message?.data || []);
            } catch { setResults([]); }
            finally { setLoading(false); }
        }, 300);
    };

    if (selected) {
        return (
            <div className="flex items-center gap-[6px] px-[8px] py-[6px] bg-[#f0fdf4] border border-[#bbf7d0] rounded-[4px]">
                <svg className="w-[11px] h-[11px] text-[#16a34a] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" strokeLinecap="round"/></svg>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-[#15803d] truncate">{selected.customer_name || selected.name}</p>
                    <p className="text-[10px] text-[#16a34a]">{selected.name}</p>
                </div>
                <button onClick={onClear} className="text-[#9ca3af] hover:text-[#111]">
                    <svg className="w-[11px] h-[11px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/></svg>
                </button>
            </div>
        );
    }

    return (
        <div className="relative" ref={ref}>
            <div className="flex items-center gap-[6px] border border-[#d1d5db] rounded-[4px] px-[8px]">
                <svg className="w-[11px] h-[11px] text-[#9ca3af] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                    type="text" value={query} onChange={handleChange}
                    placeholder="Search customer..."
                    className="w-full py-[7px] bg-transparent outline-none text-[11px] text-[#111] placeholder-[#9ca3af]"
                />
            </div>
            {open && (
                <div className="absolute z-50 w-full mt-[2px] bg-white border border-[#e5e7eb] shadow-lg rounded-[4px] max-h-[180px] overflow-y-auto">
                    {loading ? (
                        <div className="px-[10px] py-[8px] text-[11px] text-[#9ca3af]">Searching...</div>
                    ) : results.length === 0 ? (
                        <div className="px-[10px] py-[8px] text-[11px] text-[#9ca3af]">No customers found</div>
                    ) : (
                        <ul className="divide-y divide-[#f3f4f6]">
                            {results.map((c) => (
                                <li key={c.name} onClick={() => { onSelect(c); setQuery(c.customer_name || c.name); setOpen(false); }}
                                    className="px-[10px] py-[8px] cursor-pointer hover:bg-[#f9fafb]">
                                    <p className="text-[11px] font-semibold text-[#111]">{c.customer_name}</p>
                                    <p className="text-[10px] text-[#9ca3af]">{c.name}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
```

**Add missing import** at top of CartSidebar.jsx:
```javascript
import { search_customers, create_quotation_direct } from '@/libs/api';
```

## 3.2 Per-Line Discount Input in Cart

**File:** `components/Sales/CartSidebar.jsx` — inside `CartItemRow` component

**After the qty stepper div (around line 509), add:**
```jsx
{/* Discount input */}
<div className="flex items-center gap-[4px] mt-[4px]">
    <span className="text-[9px] text-[#9ca3af]">Disc %</span>
    <input
        type="number"
        min="0"
        max="100"
        placeholder="0"
        value={discount}
        onChange={(e) => {
            const d = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
            setDiscount(d);
            // update rate with discount applied
            const discountedRate = item.original_rate * (1 - d / 100);
            dispatch(updateItemRate({ item_code: item.item_code, rate: discountedRate }));
        }}
        className="w-[38px] h-[22px] border border-[#e5e7eb] text-center text-[11px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
</div>
```

**Add to CartItemRow state:**
```javascript
const [discount, setDiscount] = useState(0);
```

**Add to Redux slice** `redux/slice/cartSettings.js`:
```javascript
updateItemRate: (state, action) => {
    const { item_code, rate } = action.payload;
    const item = state.cartItems.find(i => i.item_code === item_code);
    if (item) {
        item.rate = rate;
        item.amount = rate * (item.quantity || item.count || 0);
    }
},
```
And export it: add `updateItemRate` to the exports list at the bottom of `cartSettings.js`.

**Also store `original_rate` on cart items** — in `_enrich_item` in the Python backend, no change needed. In `cartSettings.js` reducer `setCartItems`, add:
```javascript
res.original_rate = res.original_rate || res.rate;  // preserve original before discounts
```

## 3.3 Quotation Validity Date

**File:** `components/Sales/CartSidebar.jsx`

**Add state:**
```javascript
const [validDays, setValidDays] = useState(30);
```

**Add input above the Create Quotation button:**
```jsx
<div className="flex items-center gap-[6px]">
    <label className="text-[10px] text-[#6b7280] whitespace-nowrap">Valid for</label>
    <input
        type="number"
        min="1"
        max="365"
        value={validDays}
        onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
        className="w-[48px] h-[26px] border border-[#d1d5db] text-center text-[11px] outline-none rounded-[3px]"
    />
    <span className="text-[10px] text-[#6b7280]">days</span>
</div>
```

**Pass `valid_days` in quotation payload in `handleCreateQuotation`:**
```javascript
const payload = {
    opportunity: selectedOpp.name,
    valid_days: validDays,
    items: cartItems.map(...)
};
```

**Update backend `create_quotation_from_portal`** to accept `valid_days`:
```python
@frappe.whitelist()
def create_quotation_from_portal(opportunity=None, items=None, valid_days=30, **kwargs):
    ...
    quotation = frappe.get_doc({
        ...
        "valid_till": frappe.utils.add_days(nowdate(), int(valid_days or 30)),
        ...
    })
```

## 3.4 Quotation PDF Download

### Backend (add to `igh_search/igh_search/api.py`):
```python
@frappe.whitelist()
def get_quotation_pdf_url(quotation_name=None, **kwargs):
    if not quotation_name:
        frappe.throw(_("quotation_name is required"))
    if not frappe.db.exists("Quotation", quotation_name):
        frappe.throw(_(f"Quotation '{quotation_name}' not found"))
    # Return the standard Frappe PDF print URL
    url = f"/api/method/frappe.utils.print_format.download_pdf?doctype=Quotation&name={quotation_name}&format=Standard&no_letterhead=0"
    return {"status": "success", "url": url}
```

### Frontend (add to `libs/api.js`):
```javascript
export async function get_quotation_pdf_url(quotation_name) {
    let api = methodUrl + 'igh_search.igh_search.api.get_quotation_pdf_url';
    return await postMethod(api, { quotation_name });
}
```

### Frontend: Add PDF button in `QuotationHistoryDrawer.jsx`

In the quotation list item (around line 69), add a PDF icon link next to the external link icon:
```jsx
<a
    href={`/api/erp/api/method/frappe.utils.print_format.download_pdf?doctype=Quotation&name=${encodeURIComponent(q.name)}&format=Standard&no_letterhead=0`}
    target="_blank"
    rel="noreferrer"
    title="Download PDF"
    className="shrink-0 ml-[4px]"
>
    <svg className="h-[12px] w-[12px] text-[#d1d5db] hover:text-[#111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
    </svg>
</a>
```

---

---

# PHASE 4 — Sales Dashboard (Replace Homepage)

## 4.1 Replace Homepage with Sales Dashboard

**Problem:** `pages/index.js` calls `go1_cms.go1_cms.api.get_page_content` which does not exist. The homepage is broken.

**Solution:** Replace the homepage with a purpose-built sales dashboard.

**File to replace:** `pages/index.js`

**Complete new `pages/index.js`:**

```jsx
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { get_recent_quotations, get_user_opportunities } from '@/libs/api';
import { getErpDeskQuotationUrl } from '@/libs/api';

export default function SalesDashboard() {
    const router = useRouter();
    const loginInfo = useSelector((s) => s.logInInfo.customerInfo);
    const cartCount = useSelector((s) => s.cartSettings.cartCount);

    const [quotations, setQuotations] = useState([]);
    const [opportunities, setOpportunities] = useState([]);
    const [loadingQ, setLoadingQ] = useState(true);
    const [loadingO, setLoadingO] = useState(true);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setUserName(localStorage.getItem('full_name') || '');
        }
    }, [loginInfo]);

    useEffect(() => {
        (async () => {
            try {
                const r = await get_recent_quotations();
                setQuotations(r?.message?.data?.slice(0, 5) || []);
            } catch (_) {}
            finally { setLoadingQ(false); }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const r = await get_user_opportunities();
                setOpportunities(r?.message?.data?.slice(0, 5) || []);
            } catch (_) {}
            finally { setLoadingO(false); }
        })();
    }, []);

    const statusColor = (s) => ({
        Draft: 'bg-yellow-100 text-yellow-800',
        Submitted: 'bg-green-100 text-green-800',
        Cancelled: 'bg-red-100 text-red-800',
    }[s] || 'bg-gray-100 text-gray-600');

    return (
        <>
            <Head><title>IHG Sales Portal</title></Head>

            <div className="min-h-screen bg-[#f9fafb] px-[16px] py-[24px] md:px-[40px] md:py-[32px]">
                {/* Header */}
                <div className="mb-[24px]">
                    <h1 className="text-[22px] font-bold text-[#111]">
                        {userName ? `Welcome, ${userName}` : 'IHG Sales Portal'}
                    </h1>
                    <p className="text-[13px] text-[#6b7280] mt-[2px]">
                        Search products, build carts, and create quotations.
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px] mb-[32px]">
                    {[
                        { label: 'Search Products', icon: '🔍', href: '/list' },
                        { label: 'My Cart', icon: '🛒', href: '/list', badge: cartCount },
                        { label: 'New Quotation', icon: '📄', href: '/list' },
                        { label: 'Scan Barcode', icon: '📷', href: '/scanner' },
                    ].map((a) => (
                        <Link key={a.label} href={a.href}
                            className="relative bg-white border border-[#e5e7eb] rounded-[8px] p-[16px] flex flex-col items-center gap-[8px] hover:border-[#111] hover:shadow-sm transition-all cursor-pointer"
                        >
                            <span className="text-[24px]">{a.icon}</span>
                            <span className="text-[12px] font-semibold text-[#374151] text-center">{a.label}</span>
                            {a.badge > 0 && (
                                <span className="absolute top-[8px] right-[8px] bg-red-500 text-white text-[9px] font-bold rounded-full h-[16px] w-[16px] flex items-center justify-center">
                                    {a.badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-[20px]">
                    {/* Recent Quotations */}
                    <div className="bg-white border border-[#e5e7eb] rounded-[8px] overflow-hidden">
                        <div className="flex items-center justify-between px-[16px] py-[12px] border-b border-[#f3f4f6]">
                            <h2 className="text-[13px] font-bold text-[#111]">Recent Quotations</h2>
                            <span className="text-[11px] text-[#9ca3af]">Last 5</span>
                        </div>
                        {loadingQ ? (
                            <div className="px-[16px] py-[20px] text-[12px] text-[#9ca3af]">Loading...</div>
                        ) : quotations.length === 0 ? (
                            <div className="px-[16px] py-[20px] text-[12px] text-[#9ca3af]">No quotations yet.</div>
                        ) : (
                            <ul className="divide-y divide-[#f9fafb]">
                                {quotations.map((q) => (
                                    <li key={q.name}>
                                        <a href={getErpDeskQuotationUrl(q.name)} target="_blank" rel="noreferrer"
                                            className="flex items-center justify-between px-[16px] py-[10px] hover:bg-[#f9fafb]">
                                            <div>
                                                <p className="text-[12px] font-bold text-[#111]">{q.name}</p>
                                                <p className="text-[11px] text-[#6b7280]">{q.customer_name || q.party_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] font-bold">AED {parseFloat(q.grand_total || 0).toFixed(2)}</p>
                                                <span className={`inline-block px-[6px] py-[1px] text-[9px] font-bold uppercase rounded-full ${statusColor(q.status)}`}>
                                                    {q.status || 'Draft'}
                                                </span>
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Open Opportunities */}
                    <div className="bg-white border border-[#e5e7eb] rounded-[8px] overflow-hidden">
                        <div className="flex items-center justify-between px-[16px] py-[12px] border-b border-[#f3f4f6]">
                            <h2 className="text-[13px] font-bold text-[#111]">Open Opportunities</h2>
                            <span className="text-[11px] text-[#9ca3af]">Last 5</span>
                        </div>
                        {loadingO ? (
                            <div className="px-[16px] py-[20px] text-[12px] text-[#9ca3af]">Loading...</div>
                        ) : opportunities.length === 0 ? (
                            <div className="px-[16px] py-[20px] text-[12px] text-[#9ca3af]">No open opportunities.</div>
                        ) : (
                            <ul className="divide-y divide-[#f9fafb]">
                                {opportunities.map((o) => (
                                    <li key={o.name}>
                                        <button
                                            onClick={() => router.push(`/list`)}
                                            className="w-full flex items-center justify-between px-[16px] py-[10px] hover:bg-[#f9fafb] text-left"
                                        >
                                            <div>
                                                <p className="text-[12px] font-bold text-[#111]">{o.name}</p>
                                                <p className="text-[11px] text-[#6b7280]">{o.customer_name || o.customer}</p>
                                            </div>
                                            <div>
                                                <span className={`inline-block px-[6px] py-[1px] text-[9px] font-bold uppercase rounded-full ${
                                                    o.status === 'Open' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {o.status}
                                                </span>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export async function getServerSideProps() {
    return { props: {} };
}
```

## 4.2 Update Navigation: Cart Icon Opens CartModal

**File:** `components/Headers/webheader/MainHeader.jsx`
**Problem:** The cart icon at line 516 links to `/tabs/yourcart` (an e-commerce tab route). For the sales portal it should open CartModal.

**Current code (around line 516):**
```jsx
<Link href="/tabs/yourcart" className="relative headerBtbs">
    <Image ... alt='cart' src={'/Navbar/Cart.svg'}/>
    {cartCount > 0 && (
        <span className="absolute ...">
            {cartCount}
        </span>
    )}
</Link>
```

**Fix:** Replace `Link` with a button that opens CartModal:

```jsx
// Add import at top of MainHeader.jsx:
import CartModal from '@/components/Sales/CartModal';

// Add state inside component:
const [cartOpen, setCartOpen] = useState(false);

// Replace the Link with:
<>
    <button onClick={() => setCartOpen(true)} className="relative headerBtbs">
        <Image style={{ objectFit: 'contain' }} className='h-[25px] w-[23px]' height={25} width={25} alt='cart' src={'/Navbar/Cart.svg'}/>
        {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
            </span>
        )}
    </button>
    <CartModal open={cartOpen} onClose={() => setCartOpen(false)} />
</>
```

## 4.3 Load Cart on App Start

**File:** `layouts/RootLayout.js` (or wherever the Redux store is initialized)

Find where the app initializes and add a cart load on startup. If there is no suitable layout file, add it to `pages/_app.js`:

**File:** `pages/_app.js` — add inside the main component after imports:

```javascript
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCartItems } from '@/redux/slice/cartSettings';
import { get_cart_items } from '@/libs/api';

// Inside App component, add:
const dispatch = useDispatch();
useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('full_name')) return; // only load if logged in
    (async () => {
        try {
            const res = await get_cart_items();
            if (res?.message?.status === 'success') {
                dispatch(setCartItems(res.message));
            }
        } catch (_) {}
    })();
}, []);
```

---

---

# PHASE 5 — Configuration, Security, and Deployment

## 5.1 Move Hardcoded Values to Environment Variables

**File:** `libs/config/siteConfig.js`

**Current:**
```javascript
export const domain = '167.71.204.41';
export const typesense_api_key = "gjbRIS6NQkArF5lJx08U7bVJgg8beTIFFvQVBf7xdKiIWNb8";
export const system_api_key = 'c047ac7e8f8a565';
export const system_api_secret = '6236f8c55e6fe0d';
```

**Fix:** Create `.env.local` (never commit this file):
```
NEXT_PUBLIC_ERP_DOMAIN=167.71.204.41
NEXT_PUBLIC_TYPESENSE_API_KEY=gjbRIS6NQkArF5lJx08U7bVJgg8beTIFFvQVBf7xdKiIWNb8
NEXT_PUBLIC_SITE_URL=https://ihg-sigma.vercel.app
```

**Update `siteConfig.js`:**
```javascript
export const domain = process.env.NEXT_PUBLIC_ERP_DOMAIN || '167.71.204.41';
export const typesense_api_key = process.env.NEXT_PUBLIC_TYPESENSE_API_KEY || '';
export const website = process.env.NEXT_PUBLIC_SITE_URL || '';
export const system_api_key = process.env.NEXT_PUBLIC_SYSTEM_API_KEY || '';
export const system_api_secret = process.env.NEXT_PUBLIC_SYSTEM_API_SECRET || '';
```

**Update `pages/api/erp/[...path].js` line 18:**
```javascript
const ERP_BASE_URL = process.env.ERP_BASE_URL || 'http://167.71.204.41';
```
Add `ERP_BASE_URL=http://167.71.204.41` to `.env.local` (no `NEXT_PUBLIC_` since this is server-side only).

## 5.2 Add `.env.local` to `.gitignore`

**File:** `.gitignore`
Verify `.env.local` is listed. If not, add:
```
.env.local
.env*.local
```

## 5.3 Login: Remove Register Option for Internal Tool

**File:** `components/Auth/AuthModal.jsx`
Find the "Sign Up" / register tab and remove it. Sales portal users are internal ERPNext users only — no self-registration needed. Comment out or delete the register tab and its handler.

## 5.4 Session Timeout

**Already implemented** in `libs/auth.js` with `SESSION_TIMEOUT_MS = 20 * 60 * 1000` (20 minutes).

**To wire up the timeout enforcer**, add to `pages/_app.js`:
```javascript
import { enforceSessionTimeout, touchSessionActivity } from '@/libs/auth';

// Inside App component:
useEffect(() => {
    const interval = setInterval(() => {
        enforceSessionTimeout();
    }, 60_000); // check every minute

    const touch = () => touchSessionActivity();
    window.addEventListener('click', touch);
    window.addEventListener('keydown', touch);

    return () => {
        clearInterval(interval);
        window.removeEventListener('click', touch);
        window.removeEventListener('keydown', touch);
    };
}, []);
```

---

---

# IMPLEMENTATION ORDER & DEPENDENCIES

```
Phase 1 (Backend) must be done BEFORE Phase 2, 3, 4.
Phase 2 (Bug Fixes) must be done BEFORE Phase 3, 4.
Phase 3 and Phase 4 are independent after Phase 2.
Phase 5 can be done any time.

Strict order:
  1.1 Deploy api_implementation.py to server
  1.2 Deploy/verify top-level wrapper api.py
  1.3 bench restart
  1.4 Run all curl tests and verify 15/15 pass
  2.1 Fix isLoggedIn (CartSidebar)
  2.2 Fix getErpDeskQuotationUrl port
  2.3 Fix currency formatter
  2.4 Fix homepage broken API
  2.5 Re-enable cart loading in V2SearchPage
  2.7 Fix total_stock display
  3.1 Customer search + direct quotation (backend + frontend)
  3.2 Per-line discount
  3.3 Valid days input
  3.4 PDF download
  4.1 Replace homepage with sales dashboard
  4.2 Cart icon → CartModal in header
  4.3 Load cart on app start
  5.1 Environment variables
  5.2 .gitignore check
  5.3 Remove register from login
  5.4 Session timeout wiring
```

---

# KEY API REFERENCE

## Frontend → Backend URL mapping

All frontend API calls go through the Next.js proxy at `/api/erp/` which forwards to `http://167.71.204.41`.

| Frontend function | HTTP method | Full URL after proxy | Backend Python function |
|---|---|---|---|
| `get_cart_items()` | GET | `/api/method/igh_search.igh_search.api.get_cart_items` | `get_cart_items` |
| `insert_cart_items(data)` | POST | `/api/method/igh_search.igh_search.api.insert_cart_items` | `insert_cart_items` |
| `update_cartitem(data)` | POST | `/api/method/igh_search.igh_search.api.update_cartitem` | `update_cartitem` |
| `delete_cart_items(data)` | POST | `/api/method/igh_search.igh_search.api.delete_cart_items` | `delete_cart_items` |
| `clear_cart()` | POST | `/api/method/igh_search.igh_search.api.clear_cart` | `clear_cart` |
| `search_opportunities(q)` | POST | `/api/method/igh_search.igh_search.api.search_opportunities` | `search_opportunities` |
| `get_user_opportunities()` | GET | `/api/method/igh_search.igh_search.api.get_user_opportunities` | `get_user_opportunities` |
| `create_quotation_from_portal(p)` | POST | `/api/method/igh_search.igh_search.api.create_quotation_from_portal` | `create_quotation_from_portal` |
| `get_recent_quotations()` | POST | `/api/method/igh_search.igh_search.api.get_recent_quotations` | `get_recent_quotations` |
| `get_product_details(code)` | POST | `/api/method/igh_search.igh_search.api.get_product_info` | `get_product_info` |
| `get_all_masters()` | GET | `/api/method/igh_search.igh_search.api.get_all_masters` | `get_all_masters` |
| `ai_product_search(data)` | POST | `/api/method/igh_search.igh_search.api.ai_product_search` | `ai_product_search` |
| `login(data)` | POST | `/api/method/login` | Frappe built-in |
| `logout()` | POST | `/api/method/logout` | Frappe built-in |

## Redux Store Shape

```javascript
store = {
    cartSettings: {
        cartItems: [],          // [{name, item_code, item_name, quantity, rate, amount, ...}]
        cartCount: 0,
        cartValue: { total: 0, grand_total: 0 },
        wishlistItems: [],
        selectedOpportunity: null,  // {name, customer, customer_name, title}
        itemNotes: {},              // {item_code: "note text"}
    },
    logInInfo: {
        customerInfo: {}
    },
    webSettings: {
        websiteSettings: {},
    }
}
```

## Cart Item Shape (frontend ↔ backend)

```javascript
{
    "name": "uuid-string",          // used as cart_id for delete
    "item_code": "ITEM-001",
    "item_name": "LED Panel 30W",
    "quantity": 2,
    "rate": 150.00,
    "amount": 300.00,
    "stock_uom": "Nos",
    "brand": "Philips",
    "item_group": "Lighting",
    "website_image_url": "/files/item.jpg",
    "image": "/files/item.jpg"
}
```

## Quotation Payload (frontend → backend)

```javascript
// create_quotation_from_portal
{
    "opportunity": "OPP-2026-00001",
    "valid_days": 30,
    "items": [
        {
            "item_code": "ITEM-001",
            "qty": 2,
            "rate": 150.00,
            "description": "optional note"
        }
    ]
}

// create_quotation_direct (Phase 3.1)
{
    "customer": "CUST-0001",
    "valid_days": 30,
    "items": [...]
}
```

---

# FILES CHANGED SUMMARY

## Backend (server — via SSH)
| File | Action |
|------|--------|
| `apps/igh_search/igh_search/igh_search/api.py` | **CREATE/REPLACE** — full implementation |
| `apps/igh_search/igh_search/api.py` | **CREATE/UPDATE** — top-level wrapper |

## Frontend (Next.js — `IHG-Front-End-App/`)
| File | Action | Phase |
|------|--------|-------|
| `libs/api.js` | Fix `get_user_opportunities` path, fix currency formatter, fix ERP desk URL port, add `search_customers`, `create_quotation_direct`, `get_quotation_pdf_url` | 1+2+3 |
| `components/Sales/CartSidebar.jsx` | Fix `isLoggedIn` SSR bug, add customer mode toggle, add `CustomerSelector` component, add discount input, add valid days input | 2+3 |
| `components/Sales/SalesAddToCartModal.jsx` | Fix `total_stock` field name | 2 |
| `components/Search/v2/V2SearchPage.jsx` | Re-enable cart loading after login | 2 |
| `components/Headers/webheader/MainHeader.jsx` | Replace cart Link with CartModal button | 4 |
| `pages/index.js` | **REPLACE** with Sales Dashboard | 4 |
| `pages/_app.js` | Add cart load on startup, session timeout wiring | 4+5 |
| `redux/slice/cartSettings.js` | Add `updateItemRate` reducer | 3 |
| `libs/config/siteConfig.js` | Use environment variables | 5 |
| `pages/api/erp/[...path].js` | Use `process.env.ERP_BASE_URL` | 5 |
| `.env.local` (new file) | Add secrets — never commit | 5 |
| `components/Auth/AuthModal.jsx` | Remove register tab | 5 |
