import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { hasAuthSession } from "@/libs/auth";
import { subscribeToBadge } from "@/libs/realtimeQuery";
import { openRaiseQuery, setQueryBadge } from "@/redux/slice/productQuerySlice";

export default function QueryLauncher() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [state, setState] = useState({ loading: true, unread: 0, openCount: null, isAdmin: false });
  const [unavailable, setUnavailable] = useState(false);
  const [detailOverlayOpen, setDetailOverlayOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const readState = () => setDetailOverlayOpen(document.body?.dataset?.detailViewOpen === "1");
    readState();
    const observer = new MutationObserver(readState);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-detail-view-open"] });
    return () => observer.disconnect();
  }, []);

  const hidden = useMemo(
    () =>
      ["/login"].includes(router.pathname) ||
      router.pathname === "/" ||
      router.pathname.startsWith("/product-queries") ||
      detailOverlayOpen,
    [router.pathname, detailOverlayOpen]
  );

  useEffect(() => {
    if (hidden || unavailable) return undefined;
    if (typeof window !== "undefined" && !hasAuthSession()) return undefined;

    const unsubscribe = subscribeToBadge({
      onBadge: (response) => {
        setState({
          loading: false,
          unread: Number(response?.unread_total || 0),
          openCount: response?.open_count ?? null,
          isAdmin: Boolean(response?.is_admin),
        });
        dispatch(
          setQueryBadge({
            unreadTotal: Number(response?.unread_total || 0),
            openCount: response?.open_count ?? null,
            isAdmin: Boolean(response?.is_admin),
          })
        );
      },
      onError: (error) => {
        if (error?.code === "product_queries_unavailable") {
          setUnavailable(true);
        } else {
          setState((prev) => ({ ...prev, loading: false }));
        }
      },
    });
    return unsubscribe;
  }, [hidden, unavailable, dispatch]);

  if (hidden || unavailable) return null;

  const badge = state.unread;
  const subtitle = state.loading
    ? "Product team chat"
    : state.isAdmin
    ? `${state.openCount ?? 0} open · ${badge} unread`
    : `${badge} unread message${badge === 1 ? "" : "s"}`;

  return (
    <div className="fixed bottom-[92px] right-[18px] left-auto z-[120] flex flex-col items-end gap-2 md:right-[20px]">
      {/* Start a general chat with the team (no product attached). */}
      <button
        type="button"
        onClick={() => dispatch(openRaiseQuery(null))}
        className="inline-flex items-center gap-2 rounded-full border border-[#dbe5ef] bg-white px-3 py-2 text-[12px] font-semibold text-[#344054] shadow-[0_10px_22px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:text-[#111827]"
      >
        <span className="text-[15px] leading-none text-[#1b6dff]">＋</span>
        Chat with team
      </button>

      <Link
        href="/product-queries"
        className="inline-flex min-w-[56px] items-center gap-3 rounded-[18px] border border-[#dbe5ef] bg-white px-3 py-3 shadow-[0_18px_32px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_38px_rgba(15,23,42,0.18)] md:min-w-[190px] md:px-4"
      >
        <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#edf4ff] text-[#1b6dff]">
          <ChatIcon />
          {badge > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#dc2626] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </span>

        <span className="hidden min-w-0 md:block">
          <span className="block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
            {state.isAdmin ? "Product Queries" : "Product Team"}
          </span>
          <span className="mt-1 block text-[14px] font-semibold text-[#111827]">
            {state.isAdmin ? "Query desk" : "Ask the team"}
          </span>
          <span className="mt-0.5 block text-[12px] text-[#667085]">{subtitle}</span>
        </span>
      </Link>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
      <path d="M21 12c0 4.4-4 8-9 8-1.5 0-3-.3-4.2-.9L3 21l1.2-4.1C3.4 15.5 3 13.8 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
    </svg>
  );
}
