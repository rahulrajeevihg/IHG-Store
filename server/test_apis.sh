#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  IHG Sales Portal – Phase 1 API Test Script
#  Run ON THE SERVER (or from any machine that can reach it).
#  Usage:  bash test_apis.sh
# ─────────────────────────────────────────────────────────────────────────────

BASE="http://erp.ihgind.com"
ADMIN_USER="Administrator"
ADMIN_PASS="IhG@dEV\$2025@12e"   # dollar signs escaped for bash
COOKIE_JAR="/tmp/ihg_test_cookies.txt"
PASS=0
FAIL=0

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[PASS]${NC} $1"; ((PASS++));  }
fail() { echo -e "${RED}[FAIL]${NC} $1";  ((FAIL++));   }
info() { echo -e "${YELLOW}[INFO]${NC} $1"; }

# ── Helper: POST to Frappe method ─────────────────────────────────────────────
post_method() {
    local method="$1"
    local body="$2"
    curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
         -X POST "$BASE/api/method/$method" \
         -H "Content-Type: application/json" \
         -H "Accept: application/json" \
         -d "$body"
}

get_method() {
    local method="$1"
    curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
         -X GET "$BASE/api/method/$method" \
         -H "Accept: application/json"
}

# ── Helper: extract status from response ──────────────────────────────────────
has_key() {
    echo "$1" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    keys = '$2'.split('.')
    val = d
    for k in keys:
        val = val[k]
    print(val)
    sys.exit(0)
except Exception as e:
    sys.exit(1)
" 2>/dev/null
}

assert_key() {
    local label="$1"
    local response="$2"
    local keypath="$3"
    local expected="$4"

    actual=$(has_key "$response" "$keypath")
    if [ "$actual" = "$expected" ]; then
        ok "$label (${keypath}=${expected})"
    else
        fail "$label (expected ${keypath}=${expected}, got '${actual}')"
        echo "     Response: $(echo "$response" | head -c 300)"
    fi
}

assert_contains() {
    local label="$1"
    local response="$2"
    local pattern="$3"
    if echo "$response" | grep -q "$pattern"; then
        ok "$label (contains '${pattern}')"
    else
        fail "$label (missing '${pattern}')"
        echo "     Response: $(echo "$response" | head -c 300)"
    fi
}

# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  IHG Sales Portal – Phase 1 API Tests"
echo "  Server: $BASE"
echo "══════════════════════════════════════════════════════════════"
echo ""

# ─── T0: Login ────────────────────────────────────────────────────────────────
echo "── T0: Login as Administrator ──"
rm -f "$COOKIE_JAR"
LOGIN_RESP=$(curl -s -c "$COOKIE_JAR" -X POST "$BASE/api/method/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "usr=${ADMIN_USER}&pwd=${ADMIN_PASS}")

if echo "$LOGIN_RESP" | grep -q '"message":\s*"Logged In"'; then
    ok "Login successful"
else
    fail "Login FAILED – all subsequent tests will fail"
    echo "     Response: $LOGIN_RESP"
    exit 1
fi

# Extract CSRF token from cookies for POST requests
CSRF=$(grep "csrf_token" "$COOKIE_JAR" | awk '{print $NF}')
info "CSRF token: ${CSRF:0:20}..."
echo ""

# ─── T1: get_cart_items (empty cart) ─────────────────────────────────────────
echo "── T1: get_cart_items (empty cart) ──"
R=$(get_method "igh_search.igh_search.api.get_cart_items")
assert_key "get_cart_items returns status=success" "$R" "message.status" "success"
assert_contains "get_cart_items returns cart object" "$R" "marketplace_items"
echo ""

# ─── T2: insert_cart_items ────────────────────────────────────────────────────
echo "── T2: insert_cart_items ──"
# First, find a real item code
ITEM_CODE=$(curl -s -b "$COOKIE_JAR" \
    "$BASE/api/resource/Item?limit=1&fields=[\"name\"]" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['name'])" 2>/dev/null)

if [ -z "$ITEM_CODE" ]; then
    info "Could not find an Item to test with – skipping insert/update/delete tests"
    ITEM_CODE="TEST-ITEM-001"
    SKIP_CART_WRITE=1
fi

if [ -z "$SKIP_CART_WRITE" ]; then
    info "Using item: $ITEM_CODE"
    R=$(post_method "igh_search.igh_search.api.insert_cart_items" \
        "{\"item_code\":\"${ITEM_CODE}\",\"qty\":2}")
    assert_key "insert_cart_items returns status=success" "$R" "message.status" "success"
    assert_contains "insert_cart_items returns cart" "$R" "marketplace_items"
    echo ""

    # ─── T3: get_cart_items (should have 1 item) ─────────────────────────────
    echo "── T3: get_cart_items (should have item) ──"
    R=$(get_method "igh_search.igh_search.api.get_cart_items")
    assert_key "get_cart_items status=success" "$R" "message.status" "success"
    assert_contains "cart has the inserted item" "$R" "$ITEM_CODE"

    CART_ID=$(echo "$R" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d['message']['cart']['marketplace_items']
print(items[0]['name'] if items else '')
" 2>/dev/null)
    info "cart_id for inserted item: $CART_ID"
    echo ""

    # ─── T4: update_cartitem ─────────────────────────────────────────────────
    echo "── T4: update_cartitem (qty=5) ──"
    R=$(post_method "igh_search.igh_search.api.update_cartitem" \
        "{\"item_code\":\"${ITEM_CODE}\",\"qty\":5}")
    assert_key "update_cartitem status=success" "$R" "message.status" "success"
    echo ""

    # ─── T5: delete_cart_items ────────────────────────────────────────────────
    echo "── T5: delete_cart_items ──"
    if [ -n "$CART_ID" ]; then
        R=$(post_method "igh_search.igh_search.api.delete_cart_items" \
            "{\"cart_id\":\"${CART_ID}\"}")
        assert_key "delete_cart_items status=success" "$R" "message.status" "success"
    else
        info "No cart_id found – skipping delete test"
    fi
    echo ""
fi

# ─── T6: clear_cart ───────────────────────────────────────────────────────────
echo "── T6: clear_cart ──"
R=$(post_method "igh_search.igh_search.api.clear_cart" "{}")
assert_key "clear_cart status=success" "$R" "message.status" "success"
echo ""

# ─── T7: search_opportunities ─────────────────────────────────────────────────
echo "── T7: search_opportunities ──"
R=$(post_method "igh_search.igh_search.api.search_opportunities" \
    "{\"search\":\"\"}")
assert_key "search_opportunities status=success" "$R" "message.status" "success"
assert_contains "search_opportunities returns data array" "$R" '"data"'

OPP_COUNT=$(echo "$R" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(len(d['message']['data']))
" 2>/dev/null)
info "Opportunities found: $OPP_COUNT"

# Find a real opportunity for quotation test
OPP_NAME=$(echo "$R" | python3 -c "
import sys, json
d = json.load(sys.stdin)
rows = d['message']['data']
print(rows[0]['name'] if rows else '')
" 2>/dev/null)
info "First opportunity: $OPP_NAME"
echo ""

# ─── T8: get_user_opportunities ───────────────────────────────────────────────
echo "── T8: get_user_opportunities (igh_search.api path) ──"
R=$(get_method "igh_search.api.get_user_opportunities")
if echo "$R" | grep -q '"data"'; then
    ok "get_user_opportunities (wrapper path) returned data array"
else
    fail "get_user_opportunities (wrapper path) – unexpected response"
    echo "     Response: $(echo "$R" | head -c 300)"
fi
echo ""

# ─── T9: get_user_opportunities (direct path) ─────────────────────────────────
echo "── T9: get_user_opportunities (igh_search.igh_search.api path) ──"
R=$(get_method "igh_search.igh_search.api.get_user_opportunities")
assert_key "get_user_opportunities direct path" "$R" "message.status" "success"
echo ""

# ─── T10: create_quotation_from_portal ────────────────────────────────────────
echo "── T10: create_quotation_from_portal ──"
if [ -z "$OPP_NAME" ] || [ -z "$ITEM_CODE" ]; then
    info "Skipping quotation creation – no opportunity or item available"
else
    ITEMS_JSON="[{\"item_code\":\"${ITEM_CODE}\",\"qty\":1,\"rate\":100}]"
    R=$(post_method "igh_search.igh_search.api.create_quotation_from_portal" \
        "{\"opportunity\":\"${OPP_NAME}\",\"items\":${ITEMS_JSON}}")
    if echo "$R" | grep -q '"status": *"success"'; then
        QUOT_NAME=$(echo "$R" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d['message']['quotation'])
" 2>/dev/null)
        ok "create_quotation_from_portal created: $QUOT_NAME"
    else
        fail "create_quotation_from_portal failed"
        echo "     Response: $(echo "$R" | head -c 400)"
    fi
fi
echo ""

# ─── T11: get_recent_quotations ───────────────────────────────────────────────
echo "── T11: get_recent_quotations ──"
R=$(post_method "igh_search.igh_search.api.get_recent_quotations" "{}")
assert_key "get_recent_quotations status=success" "$R" "message.status" "success"
assert_contains "get_recent_quotations returns data array" "$R" '"data"'
QUOT_COUNT=$(echo "$R" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(len(d['message']['data']))
" 2>/dev/null)
info "Quotations found: $QUOT_COUNT"
echo ""

# ─── T12: get_product_info ────────────────────────────────────────────────────
echo "── T12: get_product_info ──"
if [ -n "$ITEM_CODE" ]; then
    R=$(post_method "igh_search.igh_search.api.get_product_info" \
        "{\"item_code\":\"${ITEM_CODE}\"}")
    assert_contains "get_product_info returns item_code" "$R" '"item_code"'
    assert_contains "get_product_info returns stock array" "$R" '"stock"'
    assert_contains "get_product_info returns rate" "$R" '"rate"'
    assert_contains "get_product_info returns in_stock" "$R" '"in_stock"'
fi
echo ""

# ─── T13: get_all_masters ─────────────────────────────────────────────────────
echo "── T13: get_all_masters ──"
R=$(get_method "igh_search.igh_search.api.get_all_masters")
assert_contains "get_all_masters returns brands" "$R" '"brands"'
assert_contains "get_all_masters returns item_groups" "$R" '"item_groups"'
assert_contains "get_all_masters returns attributes" "$R" '"attributes"'
echo ""

# ─── T14: ai_product_search ───────────────────────────────────────────────────
echo "── T14: ai_product_search ──"
R=$(post_method "igh_search.igh_search.api.ai_product_search" \
    "{\"query\":\"test\"}")
assert_key "ai_product_search status=success" "$R" "message.status" "success"
assert_contains "ai_product_search returns items array" "$R" '"items"'
echo ""

# ─── T15: get_customer_info ───────────────────────────────────────────────────
echo "── T15: get_customer_info ──"
R=$(get_method "igh_search.igh_search.api.get_customer_info")
assert_key "get_customer_info status=success" "$R" "message.status" "success"
echo ""

# ─── SUMMARY ─────────────────────────────────────────────────────────────────
echo "══════════════════════════════════════════════════════════════"
echo -e "  Results: ${GREEN}${PASS} passed${NC}  /  ${RED}${FAIL} failed${NC}"
echo "══════════════════════════════════════════════════════════════"

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}  All tests passed. Phase 1 backend is ready.${NC}"
    exit 0
else
    echo -e "${RED}  Some tests failed. Check the output above.${NC}"
    exit 1
fi
