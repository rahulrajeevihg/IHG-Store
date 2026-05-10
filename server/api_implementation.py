"""
IHG Search – Sales Portal API
File location on server: apps/igh_search/igh_search/igh_search/api.py

Implements:
  Cart       : get_cart_items, insert_cart_items, update_cartitem,
               delete_cart_items, clear_cart, clear_cartitem,
               move_item_to_cart, move_all_tocart
  Quotation  : search_opportunities, get_user_opportunities,
               create_quotation_from_portal, get_recent_quotations
  Product    : get_product_info, get_product_details
  Masters    : get_all_masters
  AI Search  : ai_product_search (keyword fallback – replace with LLM later)
  Customer   : get_customer_info

Cart storage: Frappe Redis cache, key = "ihg_cart:{user}", TTL = 24 h.
No new Doctypes required.
"""

import json
import uuid

import frappe
from frappe import _
from frappe.utils import flt, cstr, getdate, nowdate


# ─────────────────────────────────────────────────────────────────────────────
#  CART HELPERS  (Redis-backed, per user, 24-hour TTL)
# ─────────────────────────────────────────────────────────────────────────────

_CART_TTL = 86_400  # seconds


def _cart_key():
    return f"ihg_cart:{frappe.session.user}"


def _get_raw_cart():
    """Return the current user's cart as a Python list."""
    raw = frappe.cache().get_value(_cart_key())
    if not raw:
        return []
    try:
        return json.loads(raw) if isinstance(raw, str) else list(raw)
    except Exception:
        return []


def _save_raw_cart(items):
    frappe.cache().set_value(
        _cart_key(), json.dumps(items), expires_in_sec=_CART_TTL
    )


def _get_item_rate(item_code):
    """Return the selling rate for an item from the default price list."""
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
    """
    Fetch item master data and build a cart-item dict.
    Returns None if the item does not exist.
    """
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
            "name": str(uuid.uuid4()),         # used as cart_id on frontend
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


# ─────────────────────────────────────────────────────────────────────────────
#  CART APIs
# ─────────────────────────────────────────────────────────────────────────────

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
        # Increment if already in cart
        existing["quantity"] = flt(existing["quantity"]) + qty
        existing["amount"] = round(
            existing["quantity"] * flt(existing.get("rate", 0)), 2
        )
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

    # Match by UUID (cart_id) first, then fall back to item_code
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


# Aliases expected by the api.py wrapper
@frappe.whitelist()
def clear_cartitem(**kwargs):
    return clear_cart(**kwargs)


@frappe.whitelist()
def move_item_to_cart(**kwargs):
    return {"status": "success", "message": "Not applicable for sales portal"}


@frappe.whitelist()
def move_all_tocart(**kwargs):
    return {"status": "success", "message": "Not applicable for sales portal"}


# ─────────────────────────────────────────────────────────────────────────────
#  OPPORTUNITY & QUOTATION APIs
# ─────────────────────────────────────────────────────────────────────────────

@frappe.whitelist()
def search_opportunities(search="", customer_id="", **kwargs):
    _require_login()

    search = cstr(search).strip()

    base_filters = [
        ["status", "not in", ["Closed", "Lost", "Converted"]],
    ]

    if search:
        # Use OR across three fields via SQL
        rows = frappe.db.sql(
            """
            SELECT name, customer_name, customer, title, status, expected_closing
            FROM   `tabOpportunity`
            WHERE  status NOT IN ('Closed', 'Lost', 'Converted')
              AND  (name         LIKE %(s)s
                OR  customer_name LIKE %(s)s
                OR  title        LIKE %(s)s)
            ORDER BY modified DESC
            LIMIT  25
            """,
            {"s": f"%{search}%"},
            as_dict=True,
        )
    else:
        rows = frappe.get_list(
            "Opportunity",
            filters=base_filters,
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


@frappe.whitelist()
def create_quotation_from_portal(opportunity=None, items=None, **kwargs):
    _require_login()

    if not opportunity:
        frappe.throw(_("opportunity is required"))
    if not items:
        frappe.throw(_("items list is required"))

    if isinstance(items, str):
        try:
            items = json.loads(items)
        except Exception:
            frappe.throw(_("items must be a valid JSON list"))

    if not isinstance(items, list) or len(items) == 0:
        frappe.throw(_("items list is empty"))

    # Fetch opportunity to get customer details
    opp = frappe.db.get_value(
        "Opportunity",
        opportunity,
        ["customer", "customer_name", "opportunity_from", "party_name"],
        as_dict=True,
    )
    if not opp:
        frappe.throw(_(f"Opportunity '{opportunity}' not found"))

    # Resolve party
    party_name = opp.customer or opp.party_name or opp.customer_name
    quotation_to = "Customer"

    # If no linked customer, use Lead or fallback
    if not party_name:
        frappe.throw(_("Opportunity has no linked customer"))

    # Build items list
    q_items = []
    for row in items:
        code = cstr(row.get("item_code", "")).strip()
        if not code:
            continue
        if not frappe.db.exists("Item", code):
            frappe.throw(_(f"Item '{code}' does not exist in ERPNext"))
        q_items.append({
            "doctype": "Quotation Item",
            "item_code": code,
            "qty": flt(row.get("qty", 1)) or 1,
            "rate": flt(row.get("rate", 0)),
            "description": cstr(row.get("description", "")),
        })

    if not q_items:
        frappe.throw(_("No valid items provided"))

    # Create quotation
    quotation = frappe.get_doc({
        "doctype": "Quotation",
        "quotation_to": quotation_to,
        "party_name": party_name,
        "opportunity": opportunity,
        "transaction_date": getdate(nowdate()),
        "valid_till": frappe.utils.add_days(nowdate(), 30),
        "order_type": "Sales",
        "items": q_items,
    })
    quotation.flags.ignore_permissions = False   # enforce normal doctype perms
    quotation.insert()

    return {"status": "success", "quotation": quotation.name}


@frappe.whitelist()
def get_recent_quotations(**kwargs):
    _require_login()

    rows = frappe.get_list(
        "Quotation",
        filters={"owner": frappe.session.user},
        fields=[
            "name", "party_name", "customer_name", "opportunity",
            "grand_total", "status", "transaction_date", "creation",
        ],
        order_by="creation desc",
        limit=20,
    )

    # Normalize: frontend expects customer_name
    for r in rows:
        if not r.get("customer_name") and r.get("party_name"):
            r["customer_name"] = r["party_name"]

    return {"status": "success", "data": rows}


# ─────────────────────────────────────────────────────────────────────────────
#  PRODUCT INFO
# ─────────────────────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_product_info(item_code=None, **kwargs):
    if not item_code:
        return {"status": "error", "message": "item_code is required"}

    item_code = cstr(item_code).strip()
    item = frappe.db.get_value(
        "Item",
        item_code,
        [
            "item_code", "item_name", "description", "brand",
            "item_group", "stock_uom", "image", "min_order_qty",
            "has_variants",
        ],
        as_dict=True,
    )
    if not item:
        return {"status": "error", "message": f"Item '{item_code}' not found"}

    rate = _get_item_rate(item_code)

    # Warehouse-level stock breakdown
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
    in_stock = total_stock > 0

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
        "in_stock":          in_stock,
        "stock":             stock_list,           # array – warehouse breakdown
        "total_stock":       total_stock,          # numeric total for display
        "minimum_order_qty": flt(item.min_order_qty) or 1,
        "has_variants":      item.has_variants,
    }


# Alias: frontend calls get_product_details but the URL resolves to get_product_info
@frappe.whitelist()
def get_product_details(item_code=None, **kwargs):
    return get_product_info(item_code=item_code, **kwargs)


# ─────────────────────────────────────────────────────────────────────────────
#  MASTERS  (for filter panel in search UI)
# ─────────────────────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_all_masters(**kwargs):
    brands = frappe.db.sql(
        """
        SELECT DISTINCT brand AS name
        FROM   `tabItem`
        WHERE  brand IS NOT NULL AND brand != '' AND disabled = 0
        ORDER  BY brand
        LIMIT  500
        """,
        as_dict=True,
    )

    item_groups = frappe.db.sql(
        """
        SELECT name
        FROM   `tabItem Group`
        WHERE  name != 'All Item Groups'
        ORDER  BY name
        LIMIT  300
        """,
        as_dict=True,
    )

    # Item-level attribute values
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


# ─────────────────────────────────────────────────────────────────────────────
#  AI / KEYWORD PRODUCT SEARCH
# ─────────────────────────────────────────────────────────────────────────────

@frappe.whitelist()
def ai_product_search(query=None, filters=None, **kwargs):
    """
    Keyword-based search fallback.
    Replace the SQL body with a vector/LLM search when infrastructure is ready.
    """
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
          AND  (item_code   LIKE %(q)s
             OR item_name   LIKE %(q)s
             OR description LIKE %(q)s)
        ORDER  BY item_name
        LIMIT  50
        """,
        {"q": f"%{query}%"},
        as_dict=True,
    )
    return {"status": "success", "items": [dict(r) for r in rows]}


# ─────────────────────────────────────────────────────────────────────────────
#  CUSTOMER INFO
# ─────────────────────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_customer_info(**kwargs):
    _require_login()

    user = frappe.session.user

    # 1. Direct match on Customer.email_id
    customer_name = frappe.db.get_value("Customer", {"email_id": user}, "name")

    # 2. Via Contact → Dynamic Link
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
            "message": [
                {
                    "name":           cust.name,
                    "full_name":      cust.customer_name,
                    "email":          cust.email_id or user,
                    "customer_group": cust.customer_group,
                    "territory":      cust.territory,
                    # Legacy keys expected by storeCustomerInfo()
                    "first_name":     cust.customer_name,
                    "last_name":      "",
                    "phone":          "",
                    "user_id":        user,
                    "referral_code":  "",
                }
            ],
        }

    # Fallback: return logged-in user details without a customer record
    user_doc = frappe.db.get_value(
        "User", user, ["name", "full_name", "email"], as_dict=True
    )
    return {
        "status": "success",
        "message": [
            {
                "name":      user_doc.name if user_doc else user,
                "full_name": user_doc.full_name if user_doc else user,
                "email":     user_doc.email if user_doc else user,
                "user_id":   user,
            }
        ],
    }
