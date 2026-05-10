import { useEffect, useState } from "react";
import Link from "next/link";
import { listProductDataIssues } from "@/libs/api";
import { getProductIssueStatusMeta } from "./shared";

export default function IssueStatusBadge({ itemCode, className = "", compact = false }) {
  const [state, setState] = useState({ loading: true, count: 0, latestStatus: "" });

  useEffect(() => {
    if (!itemCode) return;
    let active = true;

    const load = async () => {
      try {
        const response = await listProductDataIssues({
          item_code: itemCode,
          open_only: 1,
          page_length: 5,
        });

        if (!active) return;

        const items = Array.isArray(response?.items) ? response.items : [];
        setState({
          loading: false,
          count: items.length,
          latestStatus: items[0]?.status || "",
        });
      } catch (_) {
        if (active) {
          setState({ loading: false, count: 0, latestStatus: "" });
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [itemCode]);

  if (state.loading || state.count < 1) return null;

  const statusMeta = getProductIssueStatusMeta(state.latestStatus || "open");

  return (
    <Link
      href={{
        pathname: "/product-data-issues",
        query: { item_code: itemCode, mine: "0" },
      }}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition hover:brightness-[0.98] ${statusMeta.className} ${className}`}
    >
      <span className="inline-flex h-2 w-2 rounded-full bg-current opacity-70" />
      <span>
        {state.count} open data issue{state.count > 1 ? "s" : ""}
      </span>
      {!compact && <span className="text-[10px] uppercase tracking-[0.12em] opacity-75">View</span>}
    </Link>
  );
}
