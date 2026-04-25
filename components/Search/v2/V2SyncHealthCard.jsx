import { useEffect, useState } from "react";
import { getTypesenseSyncHealth } from "@/libs/ighSearchV2";

export default function V2SyncHealthCard() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadHealth = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getTypesenseSyncHealth();
        if (!active) {
          return;
        }
        setHealth(response || {});
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err?.message || "Unable to load sync health.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadHealth();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="rounded-[12px] border border-[#e7e2d8] bg-white p-[18px] shadow-sm">
      <div className="mb-[12px]">
        <h3 className="text-[16px] font-semibold text-[#1b1b1b]">
          Search Sync Health
        </h3>
        <p className="text-[12px] text-[#666]">
          Admin-only observability for the Typesense sync queue.
        </p>
      </div>

      {loading ? (
        <p className="text-[13px] text-[#666]">Loading sync health…</p>
      ) : error ? (
        <p className="text-[13px] text-[#b42318]">{error}</p>
      ) : (
        <div className="grid gap-[10px] text-[13px] text-[#333] md:grid-cols-2">
          <Metric
            label="Last successful sync"
            value={health?.last_successful_sync || "Unknown"}
          />
          <Metric
            label="Failed item count"
            value={health?.failed_item_count ?? 0}
          />
          <Metric label="Dead-letter count" value={health?.dead_letter_count ?? 0} />
          <Metric label="Backlog count" value={health?.backlog_count ?? 0} />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-[10px] bg-[#faf7f2] p-[12px]">
      <p className="text-[11px] uppercase tracking-[0.4px] text-[#8a7f70]">
        {label}
      </p>
      <p className="mt-[3px] text-[14px] font-semibold text-[#1b1b1b]">{value}</p>
    </div>
  );
}
