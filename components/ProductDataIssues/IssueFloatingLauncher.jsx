import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { listProductDataIssues } from "@/libs/api";

function getPendingCount(summary = {}, items = []) {
  if (summary && Object.keys(summary).length > 0) {
    const total = Number(summary.total || 0);
    const closed = Number(summary.closed || 0);
    const fixed = Number(summary.fixed || 0);
    return Math.max(total - closed - fixed, 0);
  }

  return items.filter((item) => !["closed", "fixed"].includes(item?.status)).length;
}

export default function IssueFloatingLauncher() {
  const router = useRouter();
  const [state, setState] = useState({ loading: true, pending: 0, closed: 0, total: 0 });
  const [unavailable, setUnavailable] = useState(false);
  const [detailOverlayOpen, setDetailOverlayOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const readState = () => {
      setDetailOverlayOpen(document.body?.dataset?.detailViewOpen === "1");
    };
    readState();

    const observer = new MutationObserver(readState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-detail-view-open"],
    });

    return () => observer.disconnect();
  }, []);

  const hidden = useMemo(
    () =>
      ["/login"].includes(router.pathname) ||
      router.pathname === "/pr/[...detail]" ||
      router.asPath.startsWith("/pr/") ||
      detailOverlayOpen,
    [router.asPath, router.pathname, detailOverlayOpen]
  );

  useEffect(() => {
    if (hidden || unavailable) return;
    let active = true;

    const load = async () => {
      try {
        const response = await listProductDataIssues({ mine: 0, page_length: 100 });
        if (!active) return;

        const items = Array.isArray(response?.items) ? response.items : [];
        const summary = response?.summary || {};

        setState({
          loading: false,
          pending: getPendingCount(summary, items),
          closed: Number(summary.closed || items.filter((item) => item?.status === "closed").length || 0),
          total: Number(summary.total || items.length || 0),
        });
      } catch (error) {
        const message = String(error?.message || "");
        if (
          error?.code === "product_data_issues_unavailable" ||
          (message.includes("list_product_data_issues") &&
            message.includes("has no attribute"))
        ) {
          if (active) {
            setUnavailable(true);
          }
          return;
        }
        if (active) {
          setState({ loading: false, pending: 0, closed: 0, total: 0 });
        }
      }
    };

    load();
    const intervalId = window.setInterval(load, 45000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [hidden, unavailable]);

  if (hidden || unavailable) return null;

  return (
    <Link
      href={{ pathname: "/product-data-issues", query: { mine: "0" } }}
      className="fixed bottom-[92px] right-[18px] left-auto z-[120] inline-flex min-w-[56px] items-center gap-3 rounded-[18px] border border-[#dbe5ef] bg-white px-3 py-3 shadow-[0_18px_32px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_38px_rgba(15,23,42,0.18)] md:right-[20px] md:min-w-[170px] md:px-4"
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#111827] text-white">
        <TicketIcon />
        {state.pending > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#dc2626] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {state.pending > 99 ? "99+" : state.pending}
          </span>
        )}
      </span>

      <span className="hidden min-w-0 md:block">
        <span className="block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
          Issue Queue
        </span>
        <span className="mt-1 block text-[14px] font-semibold text-[#111827]">
          {state.loading ? "Loading issues..." : `${state.pending} pending`}
        </span>
        <span className="mt-0.5 block text-[12px] text-[#667085]">
          {state.loading ? "Shared product data inbox" : `${state.closed} closed · ${state.total} total`}
        </span>
      </span>
    </Link>
  );
}

function TicketIcon() {
  return (
    <img
      src="https://erp.ihgind.com/files/danger.gif"
      alt="Product Data Issues"
      className="h-11 w-11 rounded-[12px] object-cover"
    />
  );
}
