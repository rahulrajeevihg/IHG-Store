import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { listProductQueries, isProductTeamAdmin } from "@/libs/api";
import { openQueryChat, openRaiseQuery } from "@/redux/slice/productQuerySlice";
import {
  PRODUCT_QUERY_STAGES,
  PRODUCT_QUERY_STATUSES,
  PRODUCT_QUERY_TYPES,
  formatQueryLabel,
  formatRelativeTime,
  getQueryStatusMeta,
} from "@/components/ProductQuery/shared";

const RootLayout = dynamic(() => import("@/layouts/RootLayout"));
const MobileHeader = dynamic(() => import("@/components/Headers/mobileHeader/MobileHeader"));

const DEFAULT_FILTERS = { item_code: "", status: "", stage: "", query_type: "" };

export default function ProductQueriesPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const refreshToken = useSelector((state) => state.productQuery.refreshToken);

  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState({ loading: true, items: [], summary: {}, unavailable: false });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [mineOnly, setMineOnly] = useState(false);

  const isAdmin = useMemo(() => isProductTeamAdmin(), [hydrated]);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!router.isReady) return;
    setFilters((current) => ({
      ...current,
      item_code: typeof router.query.item_code === "string" ? router.query.item_code : current.item_code,
    }));
  }, [router.isReady, router.query.item_code]);

  useEffect(() => {
    if (!hydrated) return undefined;
    let active = true;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const payload = {
          mine: !isAdmin || mineOnly ? 1 : 0,
          page_length: 100,
          ...(filters.item_code ? { item_code: filters.item_code } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.stage ? { stage: filters.stage } : {}),
          ...(filters.query_type ? { query_type: filters.query_type } : {}),
        };
        const response = await listProductQueries(payload);
        if (!active) return;
        setState({
          loading: false,
          items: response?.items || [],
          summary: response?.summary || {},
          unavailable: false,
        });
      } catch (error) {
        if (!active) return;
        if (error?.code === "product_queries_unavailable") {
          setState({ loading: false, items: [], summary: {}, unavailable: true });
        } else {
          setState({ loading: false, items: [], summary: {}, unavailable: false });
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [hydrated, isAdmin, mineOnly, filters, refreshToken]);

  const total = state.summary?.total ?? state.items.length;

  return (
    <RootLayout>
      <MobileHeader />
      <main className="mx-auto w-full max-w-[1100px] px-4 py-6 md:py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9aa4b2]">
              Product Query Desk
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-[#111827]">
              {isAdmin ? "Incoming queries" : "My product queries"}
            </h1>
            <p className="mt-1 text-[13px] text-[#667085]">
              {isAdmin
                ? "Chat back with sales, escalate to tickets, and resolve product data queries."
                : "Chat with the product team about any product. Tap a query to continue the conversation."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch(openRaiseQuery(null))}
              className="inline-flex h-10 items-center gap-1 rounded-xl bg-[#111827] px-4 text-[13px] font-semibold text-white transition hover:bg-black"
            >
              <span className="text-[15px] leading-none">＋</span> New chat
            </button>
            {isAdmin && (
              <Link
                href="/product-queries/rankings"
                className="inline-flex h-10 items-center rounded-xl border border-[#dbe5ef] px-4 text-[13px] font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
              >
                View rankings →
              </Link>
            )}
          </div>
        </header>

        {/* Filters */}
        <section className="mt-6 flex flex-wrap items-center gap-3">
          {isAdmin && (
            <label className="inline-flex items-center gap-2 text-[13px] font-medium text-[#344054]">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(event) => setMineOnly(event.target.checked)}
                className="h-4 w-4 rounded border-[#cbd5e1]"
              />
              Only mine
            </label>
          )}
          <FilterSelect
            value={filters.status}
            onChange={(value) => setFilters((c) => ({ ...c, status: value }))}
            placeholder="All statuses"
            options={PRODUCT_QUERY_STATUSES}
          />
          <FilterSelect
            value={filters.stage}
            onChange={(value) => setFilters((c) => ({ ...c, stage: value }))}
            placeholder="All stages"
            options={PRODUCT_QUERY_STAGES}
          />
          <FilterSelect
            value={filters.query_type}
            onChange={(value) => setFilters((c) => ({ ...c, query_type: value }))}
            placeholder="All types"
            options={PRODUCT_QUERY_TYPES}
          />
          {filters.item_code && (
            <button
              type="button"
              onClick={() => setFilters((c) => ({ ...c, item_code: "" }))}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-[#dbe5ef] bg-white px-3 text-[12px] font-semibold text-[#344054]"
            >
              {filters.item_code} ✕
            </button>
          )}
          <span className="ml-auto text-[12px] text-[#98a2b3]">{total} total</span>
        </section>

        {/* List */}
        <section className="mt-4 overflow-hidden rounded-2xl border border-[#e7ecf3] bg-white">
          {state.unavailable ? (
            <EmptyState
              title="Query desk unavailable"
              body="The Product Query API is not reachable right now. Please try again shortly."
            />
          ) : state.loading ? (
            <EmptyState title="Loading…" body="Fetching your queries." />
          ) : state.items.length === 0 ? (
            <EmptyState
              title="No queries yet"
              body={isAdmin ? "Incoming product queries will appear here." : "Open a product and tap “Ask product team” to start."}
            />
          ) : (
            <ul className="divide-y divide-[#f1f4f8]">
              {state.items.map((query) => {
                const statusMeta = getQueryStatusMeta(query.status);
                const unread = isAdmin ? query.unread_for_admin : query.unread_for_reporter;
                return (
                  <li key={query.id}>
                    <button
                      type="button"
                      onClick={() => dispatch(openQueryChat(query.id))}
                      className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-[#f8fafc]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-semibold text-[#111827]">
                            {query.item_name_snapshot || query.item_code}
                          </span>
                          {query.stage === "ticket" && (
                            <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-semibold text-[#4338ca]">
                              Ticket
                            </span>
                          )}
                          {unread > 0 && (
                            <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#dc2626] px-1.5 text-[10px] font-bold text-white">
                              {unread}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-[#667085]">
                          {query.last_message_preview || formatQueryLabel(PRODUCT_QUERY_TYPES, query.query_type)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#98a2b3]">
                          {query.id} · {query.reporter_name || query.reporter_user}
                          {query.last_message_at ? ` · ${formatRelativeTime(query.last_message_at)}` : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </RootLayout>
  );
}

function FilterSelect({ value, onChange, placeholder, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-lg border border-[#dbe5ef] bg-white px-3 text-[13px] font-medium text-[#344054] outline-none"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="px-6 py-16 text-center">
      <h3 className="text-[16px] font-semibold text-[#111827]">{title}</h3>
      <p className="mx-auto mt-1 max-w-[420px] text-[13px] text-[#667085]">{body}</p>
    </div>
  );
}
