import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { check_Image, get_product_details } from "@/libs/api";

// In-place product detail modal opened from a chat product card. Renders instantly
// from the chip data, then enriches with get_product_details (specs + warehouse
// stock). Exposes the same actions the chat offers: add-to-quote (with qty),
// find driver, alternatives, and open the full product page.

function SpecRow({ label, value }) {
  if (value === undefined || value === null || value === "" || Number(value) === 0 && typeof value === "number") return null;
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#f1f5f9] py-1.5 last:border-0">
      <span className="text-[11px] text-[#64748b]">{label}</span>
      <span className="text-right text-[11px] font-semibold text-[#0f172a]">{value}</span>
    </div>
  );
}

export default function AssistantProductModal({ product, onClose, onAddToCart, onFindDriver, onAlternatives, onOpenFull }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const reqRef = useRef(0);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const code = product?.item_code;
    if (!code) { setLoading(false); return; }
    const runId = ++reqRef.current;
    setLoading(true);
    setDetail(null);
    setQty(1);
    (async () => {
      try {
        const resp = await get_product_details(code);
        if (runId === reqRef.current) setDetail(resp?.message || {});
      } catch (_) {
        if (runId === reqRef.current) setDetail({});
      } finally {
        if (runId === reqRef.current) setLoading(false);
      }
    })();
  }, [product?.item_code]);

  if (!product || typeof document === "undefined") return null;

  const m = { ...product, ...(detail || {}) };
  const image = check_Image(m?.website_image_url || m?.image || "");
  const rate = Number(m?.rate || 0);
  const offer = Number(m?.offer_rate || 0);
  const discounted = offer > 0 && rate > 0 && offer < rate;
  const price = discounted ? offer : rate;
  const totalStock = Number(m?.stock_qty ?? (Array.isArray(m?.stock) ? 0 : m?.stock) ?? 0) || 0;
  const inStock = m?.in_stock === true || m?.in_stock === 1 || totalStock > 0;
  const warehouses = Array.isArray(detail?.stock) ? detail.stock.filter((r) => Number(r?.actual_qty) > 0) : [];
  const clamp = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 1 ? n : 1; };

  const add = async () => {
    if (adding) return;
    setAdding(true);
    try { await onAddToCart?.(m, clamp(qty)); onClose?.(); }
    catch (_) { setAdding(false); }
  };

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-[10002] flex items-center justify-center bg-[#0b1220]/55 px-4" style={{ animation: "apmBg .18s ease both" }}>
      <style>{`
        @keyframes apmBg{from{opacity:0}to{opacity:1}}
        @keyframes apmPop{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
        .apm-card{animation:apmPop .22s cubic-bezier(.25,.8,.25,1) both}
        .apm-qty::-webkit-inner-spin-button,.apm-qty::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        .apm-qty{-moz-appearance:textfield}
      `}</style>

      <div onClick={(e) => e.stopPropagation()} className="apm-card relative flex max-h-[90vh] w-full max-w-[680px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.3)] md:flex-row">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-2.5 top-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/80 text-[#475569] backdrop-blur transition hover:bg-[#f1f5f9]">✕</button>

        {/* Image */}
        <div className="flex shrink-0 items-center justify-center bg-gradient-to-br from-[#f7f9fc] to-[#eef3fb] py-7 px-5 md:w-[240px]">
          {image ? (
            <img src={image} alt={m?.item_name || m?.item_code} className="max-h-[200px] w-auto object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          ) : (
            <div className="grid h-[160px] w-[160px] place-items-center rounded-[10px] bg-white text-[28px] font-bold text-[#cbd5e1]">{(m?.item_code || "?").slice(0, 1)}</div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-y-auto p-5 md:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#94a3b8]">{m?.item_code}</p>
          <h2 className="mt-1 pr-7 text-[16px] font-bold leading-[1.35] text-[#0f172a]">{m?.item_name || m?.item || "—"}</h2>

          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {m?.brand && <span className="rounded-[4px] bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#334155]">{m.brand}</span>}
            {(m?.category_list || m?.item_group) && <span className="rounded-[4px] bg-[#f1f5f9] px-2 py-0.5 text-[10px] text-[#64748b]">{m.category_list || m.item_group}</span>}
          </div>

          {m?.match_reason && <p className="mt-2 rounded-[8px] bg-[#eef5ff] px-2.5 py-1.5 text-[11px] font-medium text-[#1b6dff]">✓ {m.match_reason}</p>}

          {/* Price + stock */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[22px] font-extrabold leading-none text-[#0f172a]">{price > 0 ? `AED ${price.toFixed(2)}` : "—"}</span>
            {discounted && <span className="text-[12px] text-[#cbd5e1] line-through">AED {rate.toFixed(2)}</span>}
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
              <span className={`text-[11px] font-semibold ${inStock ? "text-[#15803d]" : "text-[#b91c1c]"}`}>{inStock ? `${totalStock || "In"} ${m?.stock_uom || "Nos"} in stock` : "Out of stock"}</span>
            </span>
          </div>

          {m?.spec_summary && <p className="mt-3 text-[11.5px] leading-[1.5] text-[#475569]">{m.spec_summary}</p>}

          {/* Key specs */}
          <div className="mt-3 rounded-[10px] border border-[#eef2f7] px-3 py-1.5">
            <SpecRow label="Power" value={m?.power} />
            <SpecRow label="Color Temperature" value={m?.color_temp} />
            <SpecRow label="Lumen Output" value={m?.lumen || m?.lumen_output} />
            <SpecRow label="Beam Angle" value={m?.beam_angle ? `${m.beam_angle}°` : ""} />
            <SpecRow label="IP Rating" value={m?.ip_rate} />
            <SpecRow label="CRI" value={m?.cri} />
            <SpecRow label="Input Voltage" value={m?.input_voltage} />
            <SpecRow label="Output Voltage" value={m?.output_voltage} />
            <SpecRow label="Output Current" value={m?.output_current} />
            <SpecRow label="Lamp Type" value={m?.lamp_type} />
          </div>

          {/* Warehouse breakdown */}
          {(loading || warehouses.length > 0) && (
            <div className="mt-3 rounded-[10px] border border-[#eef2f7]">
              <div className="flex items-center justify-between border-b border-[#f1f5f9] px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">Warehouse Stock</span>
                <span className="text-[10px] text-[#94a3b8]">{loading ? "loading…" : `${warehouses.length} location${warehouses.length === 1 ? "" : "s"}`}</span>
              </div>
              {loading ? (
                <div className="px-3 py-2 text-[11px] text-[#94a3b8]">Fetching breakdown…</div>
              ) : (
                <ul className="max-h-[120px] divide-y divide-[#f1f5f9] overflow-y-auto">
                  {warehouses.map((r) => (
                    <li key={r.warehouse} className="flex items-center justify-between px-3 py-1.5">
                      <span className="truncate pr-2 text-[11px] text-[#334155]">{r.warehouse}</span>
                      <span className="shrink-0 font-mono text-[11px] font-bold text-[#0f172a]">{Number(r.actual_qty)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            <div className="inline-flex items-stretch overflow-hidden rounded-[9px] border border-[#e2e8f0]">
              <button type="button" onClick={() => setQty((q) => Math.max(1, clamp(q) - 1))} className="grid h-9 w-9 place-items-center bg-[#fafafa] text-[16px] text-[#475569] hover:bg-[#f1f5f9]">−</button>
              <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0))} onBlur={() => setQty(clamp(qty))} className="apm-qty h-9 w-12 border-x border-[#e2e8f0] text-center text-[13px] font-bold text-[#0f172a] outline-none" />
              <button type="button" onClick={() => setQty((q) => clamp(q) + 1)} className="grid h-9 w-9 place-items-center bg-[#fafafa] text-[16px] text-[#475569] hover:bg-[#f1f5f9]">+</button>
            </div>
            <button type="button" onClick={add} disabled={!inStock || adding} className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[9px] text-[12px] font-bold transition ${!inStock || adding ? "cursor-not-allowed bg-[#e2e8f0] text-[#94a3b8]" : "bg-[#0f172a] text-white hover:bg-[#1e293b]"}`}>
              {adding ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : "+"} {adding ? "Adding…" : "Add to quote"}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={() => { onFindDriver?.(m); onClose?.(); }} className="flex-1 rounded-[9px] border border-[#e2e8f0] py-2 text-[11.5px] font-semibold text-[#475569] transition hover:border-[#1b6dff] hover:text-[#1b6dff]">Find driver</button>
            <button type="button" onClick={() => { onAlternatives?.(m); onClose?.(); }} className="flex-1 rounded-[9px] border border-[#e2e8f0] py-2 text-[11.5px] font-semibold text-[#475569] transition hover:border-[#1b6dff] hover:text-[#1b6dff]">Alternatives</button>
            <button type="button" onClick={() => onOpenFull?.(m)} className="flex-1 rounded-[9px] border border-[#e2e8f0] py-2 text-[11.5px] font-semibold text-[#475569] transition hover:border-[#1b6dff] hover:text-[#1b6dff]">Full page ↗</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
