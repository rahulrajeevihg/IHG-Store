"""Hook snippet for `igh_search/hooks.py`.

Copy these entries into the real app's `hooks.py`:

doc_events.update({
    "Bin": {
        "on_update": "igh_search.igh_search.product_stock_freshness.on_bin_change",
        "after_insert": "igh_search.igh_search.product_stock_freshness.on_bin_change",
    },
    "Stock Ledger Entry": {
        "on_update": "igh_search.igh_search.product_stock_freshness.on_stock_ledger_entry_change",
        "after_insert": "igh_search.igh_search.product_stock_freshness.on_stock_ledger_entry_change",
    },
})

scheduler_events.update({
    "cron": {
        "*/1 * * * *": [
            "igh_search.igh_search.product_stock_freshness.process_pending_stock_sync_batch",
        ],
        "*/30 * * * *": [
            "igh_search.igh_search.product_stock_freshness.run_stock_drift_repair",
        ],
    }
})

site_config feature flags:
{
  "stock_event_sync_enabled": 0,
  "stock_runtime_reconcile_enabled": 1,
  "stock_drift_scan_enabled": 0
}
"""

