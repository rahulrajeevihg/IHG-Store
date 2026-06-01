import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { check_Image, get_driver_suggestions, get_product_alternatives } from "@/libs/api";

// Self-contained "Driver & Compatibility" + "Alternatives" block for the product
// detail page. Calls the AI backend (find_suitable_drivers / get_product_alternatives_v2)
// and renders the result as horizontally-scrollable product cards. Conservative:
// when driver_required is "unknown" it shows a verify-manually note, never a guess.

function DriverCard({ item, onClick }) {
  const image = check_Image(item?.website_image_url || item?.image || "");
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="flex w-[78vw] min-w-[180px] max-w-[230px] flex-none snap-start flex-col rounded-[14px] border border-[#ececf0] bg-white p-2.5 text-left transition hover:border-[#111827] hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)] sm:w-[200px] sm:min-w-[200px]"
    >
      <div className="relative mb-2 h-[88px] w-full overflow-hidden rounded-[10px] bg-[#fafafa]">
        {!!image && (
          <Image src={image} alt={item?.item_name || item?.item_code || "item"} fill className="object-contain p-2" />
        )}
      </div>
      <p className="line-clamp-1 font-mono text-[11px] font-semibold text-[#111827]">{item?.item_code || "-"}</p>
      <p className="line-clamp-2 min-h-[32px] text-[11px] leading-[1.3] text-[#4b5563]">{item?.item_name || "-"}</p>
      {item?.match_reason ? (
        <p className="mt-1 line-clamp-2 text-[10px] leading-[1.3] text-[#2563eb]">✓ {item.match_reason}</p>
      ) : null}
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className={`text-[10px] font-semibold ${Number(item?.stock || 0) > 0 ? "text-[#15803d]" : "text-[#b91c1c]"}`}>
          {Number(item?.stock || 0) > 0 ? `${Number(item?.stock || 0)} ${item?.stock_uom || "Nos"}` : "Out of stock"}
        </span>
        <span className="text-[10px] font-semibold text-[#111827]">{Number(item?.rate || 0).toFixed(2)}</span>
      </div>
    </button>
  );
}

function CardRow({ items, onOpen }) {
  return (
    <div className="flex snap-x gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item, i) => (
        <DriverCard key={`${item.item_code}-${i}`} item={item} onClick={onOpen} />
      ))}
    </div>
  );
}

function Badge({ tone, children }) {
  const tones = {
    required: "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
    none: "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
    unknown: "bg-[#f8fafc] text-[#475569] border-[#e2e8f0]",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-[3px] text-[11px] font-semibold ${tones[tone] || tones.unknown}`}>
      {children}
    </span>
  );
}

// Backend returns drivers/alternatives as {score, match_reason, document:{...}}.
// Flatten so the card can read item_code/rate/stock, keeping match_reason.
function flatten(entry) {
  const doc = entry?.document || entry || {};
  return { ...doc, match_reason: entry?.match_reason || doc?.match_reason };
}

export default function DriverCompatibilitySection({ itemCode }) {
  const router = useRouter();
  const [driver, setDriver] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const reqRef = useRef(0);

  // Reset whenever the product changes — user must click again (saves AI credits;
  // the backend driver/alternatives calls hit the LLM/hybrid index).
  useEffect(() => {
    setRequested(false);
    setDriver(null);
    setAlternatives([]);
    setLoading(false);
  }, [itemCode]);

  const runCheck = () => {
    if (!itemCode || loading) return;
    const runId = ++reqRef.current;
    setRequested(true);
    setLoading(true);
    Promise.allSettled([
      get_driver_suggestions(itemCode),
      get_product_alternatives(itemCode, "alternatives", 8),
    ]).then(([d, a]) => {
      if (runId !== reqRef.current) return;
      if (d.status === "fulfilled") setDriver(d.value);
      if (a.status === "fulfilled") setAlternatives((a.value?.results || []).map(flatten));
      setLoading(false);
    });
  };

  const openProduct = (item) => {
    const code = item?.item_code;
    if (code) router.push(`/pr/${encodeURIComponent(code)}`);
  };

  // Collapsed call-to-action (default) — nothing is fetched until clicked.
  if (!requested) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e8ecf3] bg-gradient-to-r from-[#f5f9ff] to-[#eef5ff] p-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#1b6dff] to-[#3f86ff] text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </span>
          <div>
            <p className="text-[13px] font-semibold text-[#0f172a]">Driver &amp; Compatibility</p>
            <p className="text-[11px] text-[#64748b]">Check if a driver is required and find matching drivers &amp; alternatives.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={runCheck}
          className="rounded-[10px] bg-[#0f172a] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#1e293b]"
        >
          Check with AI
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-4 rounded-[14px] border border-[#ececf0] bg-white p-3">
        <div className="h-[14px] w-[180px] animate-pulse rounded bg-[#eef0f4]" />
        <div className="mt-3 flex gap-2.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[150px] w-[190px] animate-pulse rounded-[14px] bg-[#f3f4f6]" />
          ))}
        </div>
      </div>
    );
  }

  const dr = driver?.driver_required;
  const drivers = (driver?.drivers || []).map(flatten);
  const hasAnything = driver || alternatives.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="mt-4 space-y-4">
      {/* Driver & Compatibility */}
      {driver && (
        <div className="rounded-[14px] border border-[#ececf0] bg-white p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h4 className="text-[13px] font-semibold text-[#111827]">Driver &amp; Compatibility</h4>
            {dr === true && <Badge tone="required">Driver required</Badge>}
            {dr === false && <Badge tone="none">No external driver needed</Badge>}
            {dr === "unknown" && <Badge tone="unknown">Spec unavailable</Badge>}
          </div>
          {driver?.reason ? (
            <p className="mb-2 text-[11px] leading-[1.4] text-[#6b7280]">{driver.reason}</p>
          ) : null}
          {dr === true && drivers.length > 0 ? (
            <CardRow items={drivers} onOpen={openProduct} />
          ) : dr === true ? (
            <p className="text-[11px] text-[#b91c1c]">No matching driver found in catalog — please verify manually.</p>
          ) : null}
        </div>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="rounded-[14px] border border-[#ececf0] bg-white p-3">
          <h4 className="mb-2 text-[13px] font-semibold text-[#111827]">
            Alternatives <span className="text-[11px] font-medium text-[#6b7280]">(similar, in stock)</span>
          </h4>
          <CardRow items={alternatives} onOpen={openProduct} />
        </div>
      )}
    </div>
  );
}
