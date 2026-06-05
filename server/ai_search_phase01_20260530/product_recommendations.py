# Part B / B1 — Ambient recommendation engine.
#
# One brain for every surface (product page, home workspace, search grid). Reuses
# the existing relationship endpoints (related context, alternatives, driver intel)
# and adds two new capabilities: embedding find-similar and a push-to-sell promotion
# ranker. recommend(surface, context) returns typed blocks the UI renders as rails.
#
# Suggestion impressions/clicks are logged (AI Suggestion Event) to measure CTR /
# conversion and feed the Phase 4 learning loop. All read-only except the logger.

import json

import frappe
from frappe.utils import cint, cstr, flt

SLIM_FIELDS = (
    "item_code", "item_name", "brand", "category_list", "power", "color_temp",
    "ip_rate", "beam_angle", "rate", "offer_rate", "stock", "in_stock", "stock_uom",
    "website_image_url", "image",
)


def _slim(doc):
    out = {k: doc.get(k) for k in SLIM_FIELDS if doc.get(k) not in (None, "")}
    return out


def _hybrid():
    from igh_search.igh_search.product_search_v2 import (
        create_typesense_client, get_hybrid_collection,
    )
    return create_typesense_client(), get_hybrid_collection()


def _resolve_seed(client, coll, item_code):
    """Find a product's Typesense doc (id + category) in the hybrid collection."""
    try:
        r = client.collections[coll].documents.search({
            "q": "*", "query_by": "item_code", "filter_by": f"item_code:=[`{item_code}`]",
            "per_page": 1, "include_fields": "id,item_code,category_list,item_name",
        })
        hits = r.get("hits") or []
        return hits[0].get("document", {}) if hits else None
    except Exception:
        return None


@frappe.whitelist()
def find_similar_products(item_code=None, limit=8):
    """Products most similar to a given SKU by embedding nearest-neighbour, filtered
    to the same category and active/sellable, excluding the item itself. Works for
    any SKU app-wide ('find similar' on every card)."""
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required")
    item_code = cstr(item_code).strip()
    if not item_code:
        return {"item_code": item_code, "results": []}
    try:
        client, coll = _hybrid()
        seed = _resolve_seed(client, coll, item_code)
        if not seed or not seed.get("id"):
            return {"item_code": item_code, "results": []}
        category = cstr(seed.get("category_list") or "").strip()
        filt = ["is_active:=1", f"item_code:!=[`{item_code}`]"]
        if category:
            filt.append(f"category_list:=[`{category}`]")
        res = client.collections[coll].documents.search({
            "q": "*",
            "vector_query": f"embedding:([], id: {seed['id']})",
            "filter_by": " && ".join(filt),
            "per_page": max(min(cint(limit) or 8, 20), 1),
            "exclude_fields": "embedding",
        })
        out = []
        for h in res.get("hits", []):
            d = _slim(h.get("document", {}))
            if d.get("item_code"):
                d["similarity"] = round(1.0 - flt(h.get("vector_distance") or 0), 3)
                out.append(d)
        return {"item_code": item_code, "results": out}
    except Exception as exc:
        return {"item_code": item_code, "results": [], "error": cstr(exc)[:160]}


def _fetch_docs_by_codes(client, coll, codes):
    """Slim docs for specific item_codes, keyed by code (for the featured list)."""
    codes = [cstr(c).strip() for c in codes if cstr(c).strip()][:50]
    if not codes:
        return {}
    quoted = ",".join("`%s`" % c.replace("`", "") for c in codes)
    try:
        r = client.collections[coll].documents.search({
            "q": "*", "query_by": "item_name",
            "filter_by": "item_code:=[%s]" % quoted,
            "per_page": len(codes), "exclude_fields": "embedding",
        })
        out = {}
        for h in r.get("hits", []):
            d = h.get("document", {})
            if d.get("item_code"):
                out[cstr(d.get("item_code")).strip()] = d
        return out
    except Exception:
        return {}


def _promotion_picks(limit=8):
    """Push-to-sell picks = items carrying a PROMO / OFFER price (dead stock the
    business has already marked to clear), ranked by tied-up VALUE = price x stock so
    the biggest dead-stock liabilities surface first. This deliberately keys off the
    promo price (not raw stock count) so raw materials / accessories like end caps and
    mounting clips — which hold huge stock but never carry a promo price — never show.
    Manager-picked Featured Products are woven in ahead of them when present."""
    from igh_search.igh_search.product_search_v2 import (
        create_typesense_client, get_default_collection,
    )
    limit = max(min(cint(limit) or 8, 20), 1)
    picks, seen = [], set()
    try:
        client = create_typesense_client(); coll = get_default_collection()
    except Exception:
        return []

    # 1) manager-picked featured first (fetch + actually show them)
    try:
        if frappe.db.exists("DocType", "Featured Product"):
            feat = frappe.get_all("Featured Product", filters={"enabled": 1},
                                  fields=["item_code"], limit_page_length=limit)
            codes = [cstr(f.get("item_code")).strip() for f in feat if f.get("item_code")]
            docs = _fetch_docs_by_codes(client, coll, codes)
            for code in codes:
                d = docs.get(code)
                if d and code not in seen:
                    seen.add(code)
                    s = _slim(d); s["why"] = "featured"
                    picks.append(s)
    except Exception:
        pass

    # 2) promo-priced dead stock, ranked by value = price x stock.
    # Pull a wide candidate set of items that have a promo price, then re-rank in
    # Python by tied-up value (Typesense can't sort on a computed price*stock).
    candidates = []
    # Prefer a tight promo filter; if offer_rate isn't a filterable numeric field on
    # the index, fall back to a broad active+stock pull (the Python promo-guard below
    # still keeps only genuine promo-priced items).
    for filt in ("is_active:=1 && offer_rate:>0 && stock:>0", "is_active:=1 && stock:>0"):
        try:
            r = client.collections[coll].documents.search({
                "q": "*", "query_by": "item_name",
                "filter_by": filt,
                "sort_by": "stock:desc",  # coarse pre-rank; re-ranked by value below
                "per_page": 250, "exclude_fields": "embedding",
            })
            candidates = [h.get("document", {}) for h in r.get("hits", [])]
        except Exception:
            candidates = []
        if candidates:
            break

    ranked = []
    for d in candidates:
        base = flt(d.get("rate"))
        offer = flt(d.get("offer_rate"))
        stock = flt(d.get("stock"))
        price = base if base > 0 else offer
        if price <= 0 or stock <= 0:
            continue
        # genuine promo only: offer below list price (or no list price to compare)
        if base > 0 and not (0 < offer < base):
            continue
        d["_value"] = price * stock
        d["_disc"] = int(round((base - offer) / base * 100)) if (base > 0 and offer > 0) else 0
        ranked.append(d)
    ranked.sort(key=lambda x: x.get("_value", 0), reverse=True)

    for d in ranked:
        code = cstr(d.get("item_code")).strip()
        if not code or code in seen:
            continue
        seen.add(code)
        s = _slim(d)
        s["why"] = ("%d%% off · clearance" % d["_disc"]) if d.get("_disc") else "promo · clearance"
        picks.append(s)
        if len(picks) >= limit:
            break

    return picks[:limit]


@frappe.whitelist()
def recommend(surface=None, item_code=None, limit=6):
    """Typed recommendation blocks for a surface. surface in {product, home, search}.
    Reuses existing relationship endpoints; thin so every UI rail calls one method."""
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required")
    surface = cstr(surface or "product").strip()
    item_code = cstr(item_code or "").strip()
    limit = max(min(cint(limit) or 6, 12), 1)
    blocks = {}

    if surface == "product" and item_code:
        blocks["similar"] = find_similar_products(item_code, limit=limit).get("results", [])
        try:
            from igh_search.igh_search.product_search_v2 import get_product_alternatives_v2
            alt = get_product_alternatives_v2(item_code, mode="alternatives", limit=limit, feature_flag_override=1)
            blocks["alternatives"] = [{**_slim(x.get("document", {})), "reason": x.get("reason")}
                                      for x in (alt.get("results") or [])]
            cross = get_product_alternatives_v2(item_code, mode="cross_sell", limit=limit, feature_flag_override=1)
            blocks["complete_the_look"] = [{**_slim(x.get("document", {})), "reason": x.get("reason")}
                                           for x in (cross.get("results") or [])]
        except Exception:
            pass
        try:
            from igh_search.igh_search.product_search_v2 import analyze_driver_requirement
            dr = analyze_driver_requirement(item_code, feature_flag_override=1)
            blocks["driver"] = {"driver_required": dr.get("driver_required"), "reason": dr.get("reason")}
        except Exception:
            pass

    elif surface == "home":
        blocks["picks_to_push"] = _promotion_picks(limit=limit)

    elif surface == "search" and item_code:
        blocks["similar"] = find_similar_products(item_code, limit=limit).get("results", [])

    return {"surface": surface, "item_code": item_code, "blocks": blocks}


@frappe.whitelist()
def get_promotion_picks(limit=8):
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required")
    return {"picks": _promotion_picks(limit=cint(limit) or 8)}


def log_suggestion_event(surface=None, block_type=None, item_code=None, action=None, query=None):
    """Record a suggestion impression/click/dismiss/added_to_quote for CTR + the
    learning loop. Best-effort async; no-op if the doctype isn't present yet."""
    try:
        if not frappe.db.exists("DocType", "AI Suggestion Event"):
            return
        frappe.get_doc({
            "doctype": "AI Suggestion Event",
            "surface": cstr(surface)[:60],
            "block_type": cstr(block_type)[:60],
            "item_code": cstr(item_code)[:140],
            "action": cstr(action)[:30],
            "query": cstr(query)[:200],
            "rep": frappe.session.user,
        }).insert(ignore_permissions=True)
        frappe.db.commit()
    except Exception:
        pass


@frappe.whitelist()
def log_suggestion(surface=None, block_type=None, item_code=None, action=None, query=None):
    if frappe.session.user == "Guest":
        return {"status": "skipped"}
    log_suggestion_event(surface=surface, block_type=block_type, item_code=item_code, action=action, query=query)
    return {"status": "success"}
