import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { get_promotion_picks, log_suggestion } from "@/libs/api";

// Governed proactive nudges (Part B / B4c). Deliberately restrained so reps don't
// abandon the tool: at most ONE nudge per app load, a hard frequency cap, per-rep
// dismissal memory (a dismissed nudge stays gone for days), a delay before first
// show, and never on login/maintenance/home. Sources are CHEAP (no extra LLM cost).
// Add more sources to NUDGE_SOURCES (priority order) over time.

const DISMISS_KEY = "ihg_nudge_dismissed_v1";   // {nudgeKey: dismissedAtMs}
const LAST_KEY = "ihg_nudge_last_shown_v1";     // ms of last shown nudge (any)
const COOLDOWN_MS = 12 * 60 * 1000;             // >=12 min between nudges
const REDISMISS_MS = 5 * 24 * 60 * 60 * 1000;   // a dismissed nudge hides 5 days
const FIRST_DELAY_MS = 9000;                     // settle before nudging
const EXCLUDED = new Set(["/login", "/maintenance", "/"]); // home already shows picks

function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}

// Each source: async () => nudge | null. Keep cheap (cached Typesense / rep data).
const NUDGE_SOURCES = [
  async (router) => {
    const picks = await get_promotion_picks(3).catch(() => []);
    if (!picks || picks.length < 2) return null;
    return {
      key: "clearance",
      icon: "🏷️",
      title: `${picks.length} items to move today`,
      body: "Overstock & featured stock worth putting in front of customers.",
      cta: "Show picks",
      onCta: () => router.push("/"),
    };
  },
];

export default function NudgeManager() {
  const router = useRouter();
  const [nudge, setNudge] = useState(null);
  const [shown, setShown] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || firedRef.current) return;
    if (EXCLUDED.has(router.pathname)) return;
    const last = Number(localStorage.getItem(LAST_KEY) || 0);
    if (Date.now() - last < COOLDOWN_MS) return; // frequency cap
    firedRef.current = true;

    const timer = setTimeout(async () => {
      const dismissed = readJSON(DISMISS_KEY);
      const eligible = (key) => !(dismissed[key] && Date.now() - dismissed[key] < REDISMISS_MS);
      for (const source of NUDGE_SOURCES) {
        try {
          const n = await source(router);
          if (n && eligible(n.key)) {
            setNudge(n);
            requestAnimationFrame(() => setShown(true));
            try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch (_) {}
            log_suggestion({ surface: "nudge", block_type: n.key, action: "impression" });
            return;
          }
        } catch (_) { /* try next source */ }
      }
    }, FIRST_DELAY_MS);
    return () => clearTimeout(timer);
  }, [router.pathname]);

  if (!nudge) return null;

  const close = (action) => {
    const d = readJSON(DISMISS_KEY); d[nudge.key] = Date.now();
    try { localStorage.setItem(DISMISS_KEY, JSON.stringify(d)); } catch (_) {}
    log_suggestion({ surface: "nudge", block_type: nudge.key, action });
    setShown(false);
    setTimeout(() => setNudge(null), 220);
  };

  return (
    <div
      className="fixed bottom-[150px] left-[18px] z-[9997] w-[300px] max-w-[calc(100vw-36px)] rounded-[14px] border border-[#e8ecf3] bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.18)] lg:bottom-[28px] lg:left-[28px]"
      style={{ transition: "transform .22s cubic-bezier(.22,1,.36,1), opacity .22s", transform: shown ? "translateY(0)" : "translateY(12px)", opacity: shown ? 1 : 0 }}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-gradient-to-br from-[#1b6dff] to-[#3f86ff] text-[15px]">{nudge.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-[#0f172a]">{nudge.title}</p>
          <p className="mt-0.5 text-[11px] leading-[1.45] text-[#64748b]">{nudge.body}</p>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={() => { nudge.onCta?.(); close("click"); }} className="rounded-[8px] bg-[#0f172a] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#1e293b]">{nudge.cta}</button>
            <button type="button" onClick={() => close("dismiss")} className="text-[11px] font-medium text-[#94a3b8] transition hover:text-[#475569]">Dismiss</button>
          </div>
        </div>
        <button type="button" onClick={() => close("dismiss")} aria-label="Close" className="rounded-md p-1 text-[#cbd5e1] transition hover:bg-[#f1f5f9] hover:text-[#475569]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </div>
  );
}
