#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  IHG Sales Portal – Phase 1 Backend Deployment Script
#  Run this ON THE SERVER as the frappe user (not root):
#    sudo -u frappe bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ── Config ────────────────────────────────────────────────────────────────────
APP_DIR="/home/frappe/frappe-bench/apps/igh_search/igh_search/igh_search"
BENCH_DIR="/home/frappe/frappe-bench"
SITE="ihgind.com"          # <-- change to your actual site name if different
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ── 1. Locate app directory ───────────────────────────────────────────────────
echo ""
echo "=== Step 1: Locating igh_search app ==="
if [ ! -d "$APP_DIR" ]; then
    echo "[ERROR] Directory not found: $APP_DIR"
    echo "Searching for igh_search app..."
    find /home -name "igh_search" -type d 2>/dev/null | grep -v __pycache__ | head -10
    find /opt  -name "igh_search" -type d 2>/dev/null | grep -v __pycache__ | head -10
    echo ""
    echo "Please update APP_DIR in this script and re-run."
    exit 1
fi
echo "[OK] App directory: $APP_DIR"

# ── 2. Show existing api.py (if any) ─────────────────────────────────────────
echo ""
echo "=== Step 2: Existing api.py ==="
if [ -f "$APP_DIR/api.py" ]; then
    echo "[INFO] Existing api.py found. Showing first 40 lines:"
    head -40 "$APP_DIR/api.py"
    echo ""
    echo "Full path: $APP_DIR/api.py"
else
    echo "[INFO] No existing api.py found – will create fresh."
fi

# ── 3. Backup ─────────────────────────────────────────────────────────────────
echo ""
echo "=== Step 3: Backup ==="
if [ -f "$APP_DIR/api.py" ]; then
    cp "$APP_DIR/api.py" "$APP_DIR/api.py.bak_${TIMESTAMP}"
    echo "[OK] Backup saved: api.py.bak_${TIMESTAMP}"
else
    echo "[INFO] Nothing to back up."
fi

# ── 4. Deploy api_implementation.py ──────────────────────────────────────────
echo ""
echo "=== Step 4: Deploying new api.py ==="

# This script expects api_implementation.py in the same directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$SCRIPT_DIR/api_implementation.py"

if [ ! -f "$SRC" ]; then
    echo "[ERROR] api_implementation.py not found at: $SRC"
    echo "Please copy api_implementation.py to the same folder as this script."
    exit 1
fi

cp "$SRC" "$APP_DIR/api.py"
echo "[OK] api.py deployed to $APP_DIR/api.py"

# ── 5. Also update/create the top-level wrapper (igh_search/api.py) ───────────
# This handles the frontend call: igh_search.api.get_user_opportunities
TOPLEVEL="$BENCH_DIR/apps/igh_search/igh_search/api.py"
echo ""
echo "=== Step 5: Checking top-level wrapper ($TOPLEVEL) ==="

if [ -f "$TOPLEVEL" ]; then
    echo "[INFO] Top-level api.py already exists:"
    head -20 "$TOPLEVEL"
    echo ""
    # Check if get_user_opportunities is already there
    if grep -q "get_user_opportunities" "$TOPLEVEL"; then
        echo "[OK] get_user_opportunities already in top-level wrapper."
    else
        echo "[INFO] Adding get_user_opportunities to top-level wrapper..."
        cat >> "$TOPLEVEL" << 'PYEOF'


# Added by deploy.sh – delegates to igh_search.igh_search.api
@frappe.whitelist()
def get_user_opportunities(**kwargs):
    from igh_search.igh_search.api import get_user_opportunities as _f
    return _f(**kwargs)
PYEOF
        echo "[OK] Appended get_user_opportunities to top-level wrapper."
    fi
else
    echo "[INFO] No top-level api.py found at $TOPLEVEL"
    echo "[INFO] Creating minimal top-level wrapper..."
    cat > "$TOPLEVEL" << 'PYEOF'
"""
igh_search top-level API wrapper.
Delegates every call to igh_search.igh_search.api
"""
import frappe


@frappe.whitelist()
def get_user_opportunities(**kwargs):
    from igh_search.igh_search.api import get_user_opportunities as _f
    return _f(**kwargs)
PYEOF
    echo "[OK] Created top-level wrapper."
fi

# ── 6. Restart workers ────────────────────────────────────────────────────────
echo ""
echo "=== Step 6: Restarting Frappe workers ==="
cd "$BENCH_DIR"
bench restart
echo "[OK] Workers restarted."

# ── 7. Quick sanity check ─────────────────────────────────────────────────────
echo ""
echo "=== Step 7: Syntax check on deployed api.py ==="
python3 -c "
import ast, sys
with open('$APP_DIR/api.py') as f:
    src = f.read()
try:
    ast.parse(src)
    print('[OK] api.py syntax is valid.')
except SyntaxError as e:
    print(f'[ERROR] Syntax error: {e}')
    sys.exit(1)
"

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  Deployment complete. Run test_apis.sh next to verify APIs."
echo "══════════════════════════════════════════════════════════════"
