import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProductQueryRankings, isProductTeamAdmin } from "@/libs/api";
import { formatDuration } from "@/components/ProductQuery/shared";

const RootLayout = dynamic(() => import("@/layouts/RootLayout"));
const MobileHeader = dynamic(() => import("@/components/Headers/mobileHeader/MobileHeader"));

const PERIODS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

export default function ProductQueryRankingsPage() {
  const [hydrated, setHydrated] = useState(false);
  const [period, setPeriod] = useState(30);
  const [state, setState] = useState({ loading: true, leaderboard: [], denied: false });

  const allowed = useMemo(() => isProductTeamAdmin(), [hydrated]);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return undefined;
    if (!allowed) {
      setState({ loading: false, leaderboard: [], denied: true });
      return undefined;
    }
    let active = true;

    (async () => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const response = await getProductQueryRankings(period);
        if (!active) return;
        setState({ loading: false, leaderboard: response?.leaderboard || [], denied: false });
      } catch (error) {
        if (!active) return;
        setState({ loading: false, leaderboard: [], denied: error?.code === "product_queries_unavailable" });
      }
    })();

    return () => {
      active = false;
    };
  }, [hydrated, allowed, period]);

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
              Agent rankings
            </h1>
            <p className="mt-1 text-[13px] text-[#667085]">
              Item-manager performance: resolution volume, response SLA, and solution ratings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/product-queries"
              className="inline-flex h-10 items-center rounded-xl border border-[#dbe5ef] px-4 text-[13px] font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
            >
              ← Queries
            </Link>
            <select
              value={period}
              onChange={(event) => setPeriod(Number(event.target.value))}
              className="h-10 rounded-xl border border-[#dbe5ef] bg-white px-3 text-[13px] font-semibold text-[#344054]"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7ecf3] bg-white">
          {state.denied ? (
            <Empty title="Restricted" body="Only the product team (Item Manager / System Manager) can view rankings." />
          ) : state.loading ? (
            <Empty title="Loading…" body="Crunching the numbers." />
          ) : state.leaderboard.length === 0 ? (
            <Empty title="No data yet" body="No resolved or assigned queries in this period." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#eef2f7] bg-[#f8fafc] text-[11px] uppercase tracking-[0.08em] text-[#94a3b8]">
                    <Th>#</Th>
                    <Th>Agent</Th>
                    <Th className="text-right">Resolved</Th>
                    <Th className="text-right">Open load</Th>
                    <Th className="text-right">Avg first response</Th>
                    <Th className="text-right">Avg resolution</Th>
                    <Th className="text-right">Avg rating</Th>
                  </tr>
                </thead>
                <tbody>
                  {state.leaderboard.map((agent) => (
                    <tr key={agent.agent} className="border-b border-[#f1f4f8] text-[13px] text-[#111827]">
                      <Td>
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#111827] text-[11px] font-bold text-white">
                          {agent.rank}
                        </span>
                      </Td>
                      <Td>
                        <div className="font-semibold">{agent.agent_name || agent.agent}</div>
                        <div className="text-[11px] text-[#98a2b3]">{agent.agent}</div>
                      </Td>
                      <Td className="text-right font-semibold">{agent.resolved}</Td>
                      <Td className="text-right">{agent.open_load}</Td>
                      <Td className="text-right">{formatDuration(agent.avg_first_response_secs)}</Td>
                      <Td className="text-right">{formatDuration(agent.avg_resolution_secs)}</Td>
                      <Td className="text-right">
                        {agent.avg_rating ? (
                          <span className="font-semibold text-[#b45309]">
                            ★ {agent.avg_rating}
                            <span className="ml-1 text-[11px] font-normal text-[#98a2b3]">({agent.rated_count})</span>
                          </span>
                        ) : (
                          <span className="text-[#cbd5e1]">—</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </RootLayout>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}

function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

function Empty({ title, body }) {
  return (
    <div className="px-6 py-16 text-center">
      <h3 className="text-[16px] font-semibold text-[#111827]">{title}</h3>
      <p className="mx-auto mt-1 max-w-[420px] text-[13px] text-[#667085]">{body}</p>
    </div>
  );
}
