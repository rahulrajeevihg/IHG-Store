import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { check_Image, get_promotion_picks, insert_cart_items, log_suggestion } from "@/libs/api";

// "Picks to push" merchandising spotlight (Part B promotion engine surface).
// The picks-to-push rail lives on /dashboard, which isn't enabled for users — so the
// promotion engine would otherwise be invisible. This is a recurring lightbox GALLERY
// that surfaces those picks on whatever page the rep is on. Modern gallery UI: a big
// hero image with prev/next arrows and a thumbnail filmstrip showing how many there are.
// Governed: dismissible, re-appears ~1 min after it closes, "mute for today" silences it,
// never on login/maintenance. Telemetry: surface="spotlight" impression/click/dismiss/added.

const MUTE_KEY = "ihg_spotlight_muted_until_v1"; // ms epoch; muted while now < value
const FIRST_DELAY_MS = 20000; // let the page settle before the first popup
const REOPEN_MS = 60000;      // "every 1 min" — reopen this long after it closes
const AUTO_MS = 4500;         // auto-advance between slides while open (pauses on hover)
const LIMIT = 8;
const EXCLUDED = new Set(["/login", "/maintenance", "/seller/[login]"]);

export default function PromotionSpotlight() {
  const router = useRouter();
  const [picks, setPicks] = useState([]);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // drives the enter/exit transition
  const [idx, setIdx] = useState(0);
  const hoverRef = useRef(false);
  const timerRef = useRef(null);
  const fetchedRef = useRef(false);

  const muted = () => {
    try { return Number(localStorage.getItem(MUTE_KEY) || 0) > Date.now(); } catch { return false; }
  };

  // Fetch the picks once (cheap, backend-cached). Skip on excluded pages / when muted.
  useEffect(() => {
    if (typeof window === "undefined" || fetchedRef.current) return;
    if (EXCLUDED.has(router.pathname) || muted()) return;
    fetchedRef.current = true;
    get_promotion_picks(LIMIT)
      .then((list) => { if (Array.isArray(list) && list.length) setPicks(list); })
      .catch(() => {});
  }, [router.pathname]);

  const scheduleOpen = useCallback((delay) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (muted() || EXCLUDED.has(router.pathname)) { scheduleOpen(REOPEN_MS); return; }
      setIdx(0);
      setOpen(true);
      requestAnimationFrame(() => setShown(true));
    }, delay);
  }, [router.pathname]);

  // First scheduled open once picks are loaded.
  useEffect(() => {
    if (!picks.length || open) return;
    scheduleOpen(FIRST_DELAY_MS);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks.length]);

  // Log one impression per open.
  useEffect(() => {
    if (open && picks.length) {
      log_suggestion({ surface: "spotlight", block_type: "promotion", item_code: picks[0]?.item_code || "", action: "impression" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-advance slides while open (paused on hover).
  useEffect(() => {
    if (!open || picks.length < 2) return;
    const t = setInterval(() => { if (!hoverRef.current) setIdx((i) => (i + 1) % picks.length); }, AUTO_MS);
    return () => clearInterval(t);
  }, [open, picks.length]);

  // Keyboard: Esc closes, arrows navigate.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close("dismiss");
      else if (e.key === "ArrowRight") setIdx((i) => (i + 1) % picks.length);
      else if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + picks.length) % picks.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, picks.length]);

  // Close if the rep navigates onto an excluded route while it's open.
  useEffect(() => {
    if (EXCLUDED.has(router.pathname) && open) { setShown(false); setOpen(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  const close = (action) => {
    log_suggestion({ surface: "spotlight", block_type: "promotion", item_code: picks[idx]?.item_code || "", action: action || "dismiss" });
    setShown(false);
    setTimeout(() => setOpen(false), 200);
    scheduleOpen(REOPEN_MS); // come back in ~1 min
  };

  const muteToday = () => {
    try {
      const end = new Date(); end.setHours(23, 59, 59, 999);
      localStorage.setItem(MUTE_KEY, String(end.getTime()));
    } catch (_) {}
    close("dismiss");
  };

  const go = (n) => setIdx((i) => (i + n + picks.length) % picks.length);

  const viewProduct = (item) => {
    if (!item?.item_code) return;
    log_suggestion({ surface: "spotlight", block_type: "promotion", item_code: item.item_code, action: "click" });
    setShown(false);
    setTimeout(() => setOpen(false), 150);
    scheduleOpen(REOPEN_MS);
    router.push(`/pr/${encodeURIComponent(item.item_code)}`);
  };

  const addToQuote = async (item) => {
    if (!item?.item_code) return;
    try {
      const r = await insert_cart_items({ item_code: item.item_code, qty: 1 });
      if ((r || {}).status === "success") {
        toast.success(`Added ${item.item_code} to quote`);
        window.dispatchEvent(new Event("cart-updated"));
        log_suggestion({ surface: "spotlight", block_type: "promotion", item_code: item.item_code, action: "added_to_quote" });
      } else toast.error((r || {}).message || "Could not add to cart");
    } catch (_) { toast.error("Could not add to cart"); }
  };

  if (!open || !picks.length) return null;

  const item = picks[idx] || {};
  const image = check_Image(item?.website_image_url || item?.image || "");
  const rate = Number(item?.offer_rate || 0) > 0 && Number(item.offer_rate) < Number(item.rate || 0)
    ? Number(item.offer_rate) : Number(item?.rate || 0);
  const why = item?.why || item?.reason || "Worth putting in front of customers";
  const multi = picks.length > 1;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", transition: "opacity .2s", opacity: shown ? 1 : 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) close("dismiss"); }}
      role="dialog"
      aria-modal="true"
      aria-label="Picks to push"
    >
      <div
        className="w-[min(600px,calc(100vw-32px))] overflow-hidden rounded-[18px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]"
        style={{ transition: "transform .24s cubic-bezier(.22,1,.36,1), opacity .24s", transform: shown ? "translateY(0) scale(1)" : "translateY(14px) scale(.98)", opacity: shown ? 1 : 0 }}
        onMouseEnter={() => { hoverRef.current = true; }}
        onMouseLeave={() => { hoverRef.current = false; }}
      >
        {/* header */}
        <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[9px] bg-gradient-to-br from-[#1b6dff] to-[#3f86ff] text-white">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2.5l1.9 4.6 4.6 1.9-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 2.5z" /></svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight text-[#0f172a]">Picks to push today</p>
            <p className="text-[10.5px] text-[#94a3b8]">Overstock &amp; featured stock worth moving</p>
          </div>
          <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-semibold text-[#64748b]">{idx + 1} / {picks.length}</span>
          <button type="button" onClick={() => close("dismiss")} aria-label="Close" className="rounded-md p-1 text-[#cbd5e1] transition hover:bg-[#f1f5f9] hover:text-[#475569]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {/* hero image + arrows */}
        <div className="relative mx-4 flex h-[262px] items-center justify-center overflow-hidden rounded-[14px] bg-[#f8fafc]">
          <span className="absolute left-3 top-3 z-10 rounded-full bg-[#0f172a] px-2.5 py-1 text-[10px] font-semibold capitalize text-white shadow">{why}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {image ? <img src={image} alt={item?.item_code || "product"} className="max-h-full max-w-full object-contain p-3" /> : <span className="text-[12px] text-[#94a3b8]">No image</span>}
          {multi && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Previous" className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#0f172a] shadow-[0_4px_14px_rgba(15,23,42,0.18)] transition hover:bg-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next" className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#0f172a] shadow-[0_4px_14px_rgba(15,23,42,0.18)] transition hover:bg-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </>
          )}
        </div>

        {/* info + CTAs */}
        <div className="px-4 pt-3">
          <p className="font-mono text-[11px] font-semibold text-[#0f172a]">{item?.item_code || "-"}</p>
          <p className="mt-0.5 line-clamp-2 min-h-[30px] text-[12px] leading-[1.35] text-[#475569]">{item?.item_name || "-"}</p>
          <div className="mt-2 flex items-center gap-3">
            {rate > 0 ? <span className="text-[15px] font-bold text-[#0f172a]">₹{rate.toFixed(2)}</span> : null}
            {item?.stock != null ? <span className="text-[10.5px] font-medium text-[#94a3b8]">{Number(item.stock)} in stock</span> : null}
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={() => viewProduct(item)} className="rounded-[9px] border border-[#e2e8f0] px-3 py-1.5 text-[11.5px] font-semibold text-[#0f172a] transition hover:bg-[#f8fafc]">View product</button>
              <button type="button" onClick={() => addToQuote(item)} className="rounded-[9px] bg-[#0f172a] px-3 py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-[#1e293b]">+ Add to quote</button>
            </div>
          </div>
        </div>

        {/* thumbnail filmstrip */}
        {multi && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {picks.map((p, i) => {
              const thumb = check_Image(p?.website_image_url || p?.image || "");
              const active = i === idx;
              return (
                <button
                  key={`${p.item_code}-${i}`}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Show ${p.item_code}`}
                  className={`flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-[9px] border bg-[#f8fafc] transition ${active ? "border-[#1b6dff] ring-2 ring-[#1b6dff]/30" : "border-[#e8ecf3] opacity-70 hover:opacity-100"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {thumb ? <img src={thumb} alt={p?.item_code || "item"} className="max-h-full max-w-full object-contain p-1" /> : <span className="text-[8px] text-[#cbd5e1]">—</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* footer */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <button type="button" onClick={muteToday} className="text-[10.5px] font-medium text-[#94a3b8] transition hover:text-[#64748b]">Mute for today</button>
          <span className="text-[10px] text-[#cbd5e1]">Auto-rotates · ← → to browse</span>
        </div>
      </div>
    </div>
  );
}
