import { useEffect, useState } from "react";
import Link from "next/link";
import { listProductQueries } from "@/libs/api";
import { getQueryStatusMeta } from "./shared";

export default function QueryStatusBadge({ itemCode, className = "", compact = false }) {
  const [state, setState] = useState({ loading: true, count: 0, latestStatus: "" });

  useEffect(() => {
    if (!itemCode) return undefined;
    let active = true;

    (async () => {
      try {
        const response = await listProductQueries({ item_code: itemCode, open_only: 1, page_length: 5 });
        if (!active) return;
        const items = Array.isArray(response?.items) ? response.items : [];
        setState({ loading: false, count: items.length, latestStatus: items[0]?.status || "" });
      } catch (_) {
        if (active) setState({ loading: false, count: 0, latestStatus: "" });
      }
    })();

    return () => {
      active = false;
    };
  }, [itemCode]);

  if (state.loading || state.count < 1) return null;

  const statusMeta = getQueryStatusMeta(state.latestStatus || "open");

  return (
    <Link
      href={{ pathname: "/product-queries", query: { item_code: itemCode } }}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition hover:brightness-[0.98] ${statusMeta.className} ${className}`}
    >
      <span className="inline-flex h-2 w-2 rounded-full bg-current opacity-70" />
      <span>
        {state.count} open quer{state.count > 1 ? "ies" : "y"}
      </span>
      {!compact && <span className="text-[10px] uppercase tracking-[0.12em] opacity-75">View</span>}
    </Link>
  );
}
