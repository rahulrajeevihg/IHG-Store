import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { check_Image, get_product_details } from '@/libs/api';

export default function SalesAddToCartModal({ product, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prev = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    return () => { window.document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    let active = true;
    const code = product?.item_code;
    if (!code) { setLoading(false); return; }
    (async () => {
      try {
        const resp = await get_product_details(code);
        if (active) setDetail(resp?.message || {});
      } catch {
        if (active) setDetail({});
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [product?.item_code]);

  useEffect(() => {
    const merged = { ...product, ...(detail || {}) };
    const minQty = Number(merged?.minimum_order_qty);
    if (Number.isFinite(minQty) && minQty > 0) setQty(minQty);
    setTimeout(() => inputRef.current?.select(), 80);
  }, [detail]);

  const merged = { ...product, ...(detail || {}) };
  const rate = Number(merged?.rate);
  const offer = Number(merged?.offer_rate);
  const discounted = offer > 0 && rate > 0 && offer < rate;
  const discountPct = discounted ? Math.round(((rate - offer) / rate) * 100) : 0;
  const price = discounted ? offer : rate;
  const totalStock = Number(merged?.stock) || 0;
  const inStock = merged?.in_stock === true || merged?.in_stock === 1 || totalStock > 0;
  const warehouseStocks = Array.isArray(detail?.stock)
    ? detail.stock.filter((row) => Number(row?.actual_qty) > 0)
    : [];
  const imageUrl = resolveImage(merged);

  const clamp = (val) => {
    const n = parseInt(val, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  };

  const handleInput = (e) => {
    const raw = e.target.value;
    if (raw === '') { setQty(''); return; }
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 0) setQty(n);
  };

  const handleAdd = async () => {
    if (!inStock || adding) return;
    const finalQty = clamp(qty);
    setAdding(true);
    try {
      await onConfirm?.(finalQty);
      onClose?.();
    } catch {
      setAdding(false);
    }
  };

  const modal = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/55 px-[16px]"
      style={{ animation: 'satc_bg .18s ease both' }}
    >
      <style>{`
        @keyframes satc_bg { from{opacity:0} to{opacity:1} }
        @keyframes satc_pop { from{opacity:0;transform:translateY(14px) scale(.98)} to{opacity:1;transform:none} }
        .satc_card { animation:satc_pop .22s cubic-bezier(.25,.8,.25,1) both }
        .satc_qty::-webkit-inner-spin-button,
        .satc_qty::-webkit-outer-spin-button { -webkit-appearance:none; margin:0 }
        .satc_qty { -moz-appearance:textfield }
      `}</style>

      <div
        data-tour="sales-atc-modal"
        onClick={(e) => e.stopPropagation()}
        className="satc_card relative flex w-full max-w-[760px] max-h-[92vh] overflow-hidden bg-white rounded-[12px] shadow-[0_24px_60px_rgba(0,0,0,0.22)] flex-col md:flex-row"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-[10px] top-[10px] z-10 grid h-[30px] w-[30px] place-items-center rounded-full bg-[#f3f4f6] text-[#555] hover:bg-[#e5e7eb]"
        >
          ✕
        </button>

        {/* Image side */}
        <div className="flex shrink-0 items-center justify-center bg-[#f7f7f7] md:w-[260px] md:min-h-[260px] py-[24px] px-[18px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={merged?.item_name || merged?.item_code}
              className="max-h-[220px] w-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="flex h-[180px] w-[180px] items-center justify-center rounded-[8px] bg-white text-[28px] font-bold text-[#9ca3af]">
              {(merged?.item_code || '?').slice(0, 1)}
            </div>
          )}
        </div>

        {/* Body side */}
        <div className="flex flex-1 flex-col overflow-y-auto p-[20px] md:p-[24px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#9ca3af]">
            {merged?.item_code}
          </p>
          <h2 className="mt-[4px] text-[16px] font-bold leading-[1.35] text-[#111] pr-[28px]">
            {merged?.item_name || merged?.item || '—'}
          </h2>

          <div className="mt-[6px] flex flex-wrap gap-[6px]">
            {merged?.brand && (
              <span className="rounded-[3px] bg-[#f3f4f6] px-[6px] py-[2px] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#374151]">
                {merged.brand}
              </span>
            )}
            {(merged?.category_list || merged?.item_group) && (
              <span className="rounded-[3px] bg-[#f3f4f6] px-[6px] py-[2px] text-[10px] text-[#6b7280]">
                {merged.category_list || merged.item_group}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="mt-[12px] flex flex-wrap items-baseline gap-[8px]">
            <span className="text-[24px] font-extrabold leading-none text-[#111]">
              {price > 0 ? `AED ${price.toFixed(2)}` : '—'}
            </span>
            {discounted && (
              <>
                <span className="text-[13px] text-[#bbb] line-through">
                  AED {rate.toFixed(2)}
                </span>
                <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-[7px] py-[2px] text-[10px] font-bold text-[#16a34a]">
                  -{discountPct}%
                </span>
              </>
            )}
          </div>

          {/* Stock summary */}
          <div className="mt-[10px] flex items-center gap-[6px]">
            <span className={`h-[7px] w-[7px] rounded-full ${inStock ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
            <span className={`text-[12px] font-medium ${inStock ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
              {inStock
                ? `${totalStock || 'In'} ${merged?.stock_uom || 'units'} in stock`
                : 'Out of stock'}
            </span>
          </div>

          {/* Warehouse breakdown */}
          <div className="mt-[14px] rounded-[6px] border border-[#e5e7eb]">
            <div className="flex items-center justify-between border-b border-[#f3f4f6] px-[12px] py-[7px]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6b7280]">
                Warehouse Stock
              </span>
              <span className="text-[10px] text-[#9ca3af]">
                {loading ? 'loading…' : `${warehouseStocks.length} location${warehouseStocks.length === 1 ? '' : 's'}`}
              </span>
            </div>
            <div className="max-h-[140px] overflow-y-auto">
              {loading ? (
                <div className="px-[12px] py-[10px] text-[11px] text-[#9ca3af]">Fetching warehouse breakdown…</div>
              ) : warehouseStocks.length === 0 ? (
                <div className="px-[12px] py-[10px] text-[11px] text-[#9ca3af]">No warehouse breakdown available.</div>
              ) : (
                <ul className="divide-y divide-[#f3f4f6]">
                  {warehouseStocks.map((row) => (
                    <li key={row.warehouse} className="flex items-center justify-between px-[12px] py-[7px]">
                      <span className="truncate pr-[8px] text-[11px] text-[#374151]">{row.warehouse}</span>
                      <span className="shrink-0 font-mono text-[11px] font-bold text-[#111]">
                        {Number(row.actual_qty)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Qty + line total */}
          <div className="mt-[16px] flex flex-wrap items-center justify-between gap-[12px]">
            <div>
              <p className="mb-[6px] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6b7280]">
                Quantity
              </p>
              <div className="inline-flex items-stretch overflow-hidden rounded-[8px] border border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, clamp(q) - 1))}
                  className="flex h-[40px] w-[40px] items-center justify-center bg-[#fafafa] text-[18px] text-[#374151] hover:bg-[#f3f4f6]"
                >
                  −
                </button>
                <input
                  data-tour="sales-atc-qty-input"
                  ref={inputRef}
                  type="number"
                  min="1"
                  value={qty}
                  onChange={handleInput}
                  onBlur={() => setQty(clamp(qty))}
                  className="satc_qty h-[40px] w-[64px] border-x border-[#e5e7eb] bg-white text-center text-[14px] font-bold text-[#111] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQty((q) => clamp(q) + 1)}
                  className="flex h-[40px] w-[40px] items-center justify-center bg-[#fafafa] text-[18px] text-[#374151] hover:bg-[#f3f4f6]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="min-w-[140px] flex-1">
              <p className="mb-[6px] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6b7280]">
                Line total
              </p>
              <p className="text-[18px] font-bold text-[#111]">
                AED {(Math.max(1, clamp(qty)) * (price > 0 ? price : 0)).toFixed(2)}
              </p>
            </div>
          </div>

          <button
            data-tour="sales-atc-confirm"
            type="button"
            onClick={handleAdd}
            disabled={!inStock || adding}
            className={`mt-[18px] flex h-[46px] w-full items-center justify-center gap-[8px] rounded-[8px] text-[13px] font-bold uppercase tracking-[0.12em] transition ${
              !inStock || adding
                ? 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                : 'bg-[#111] text-white hover:bg-[#333]'
            }`}
          >
            {adding ? (
              <span className="inline-block h-[14px] w-[14px] animate-spin rounded-full border-[2px] border-white/30 border-t-white" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            )}
            {adding ? 'Adding…' : inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modal, window.document.body);
}

function resolveImage(doc) {
  const raw = doc?.image || doc?.website_image_url || doc?.product_image || '';
  if (!raw || typeof raw !== 'string' || !raw.trim()) return '';
  const t = raw.trim();
  if (t.startsWith('https://')) return t;
  if (t.startsWith('http://')) return t.replace('http://', 'https://');
  return check_Image(t);
}
