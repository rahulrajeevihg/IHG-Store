import { useState } from "react";
import { check_Image } from "@/libs/api";
import { highlightText, formatPrice } from "../utils/format";

export default function ProductCard({
  document,
  query,
  onNavigate,
  onQuickView,
  onShortlist,
  onWishlist,
  onSimilar,
  isWishlisted,
  isShortlisted,
  includeInactive,
  dense = false,
}) {
  const [copied, setCopied] = useState(false);

  const exactSkuMatch =
    query &&
    document.item_code &&
    document.item_code.toLowerCase() === query.trim().toLowerCase();

  const rate = Number(document.rate);
  const offer = Number(document.offer_rate);
  const discounted = offer > 0 && rate > 0 && offer < rate;
  const discountPct = discounted
    ? Number(document.discount_percentage) || Math.round(((rate - offer) / rate) * 100)
    : 0;

  const stock = Number(document.stock);
  const inStock = document.in_stock === true || document.in_stock === 1 || stock > 0;
  const inactive = includeInactive && document.is_active === 0;
  const activePrice = discounted ? offer : rate;
  const hasPrice = activePrice > 0;

  const copySku = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard?.writeText(document.item_code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* ignore */ }
  };

  return (
    <article className="group relative flex h-full flex-col border border-[#e5e7eb] bg-white hover:border-[#111] hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition-all duration-150 cursor-pointer">

      {/* IMAGE */}
      <div className="relative overflow-hidden border-b border-[#eef0f3] bg-[#f7f7f7]" style={{ paddingBottom: "74%" }}>
        <button
          type="button"
          onClick={() => onNavigate(document)}
          className="absolute inset-0 flex items-center justify-center"
          aria-label={`Open ${document.item_name || document.item_code}`}
        >
          <ProductImage document={document} />
        </button>

        {/* badges */}
        <div className="pointer-events-none absolute left-[6px] top-[6px] flex flex-col gap-[3px]">
          {exactSkuMatch && <Badge tone="accent">SKU</Badge>}
          {inactive      && <Badge tone="danger">Inactive</Badge>}
          {discounted    && <Badge tone="sale">-{discountPct}%</Badge>}
          {inStock && stock > 0 && stock <= 5 && <Badge tone="warn">Low</Badge>}
          {!inStock      && <Badge tone="oos">OOS</Badge>}
        </div>

        {/* hover actions */}
        <div className="absolute right-[6px] top-[6px] flex flex-col gap-[3px] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
          <IconBtn label={isWishlisted ? "Remove" : "Save"} active={isWishlisted} onClick={(e) => { e.stopPropagation(); onWishlist(document); }}>
            <HeartIcon filled={isWishlisted} />
          </IconBtn>
          <IconBtn label="Quick view" onClick={(e) => { e.stopPropagation(); onQuickView(document); }}>
            <EyeIcon />
          </IconBtn>
          {onSimilar && (
            <IconBtn label="Similar" onClick={(e) => { e.stopPropagation(); onSimilar(document); }}>
              <SparkIcon />
            </IconBtn>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 flex-col gap-[8px] px-[12px] pb-[12px] pt-[12px]">

        {/* Brand · Category */}
        <div className="flex min-h-[16px] items-center gap-[4px] min-w-0">
          {document.brand && (
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]">
              {document.brand}
            </span>
          )}
          {document.brand && (document.category_list || document.item_group) && (
            <span className="shrink-0 text-[10px] text-[#d1d5db]">·</span>
          )}
          {(document.category_list || document.item_group) && (
            <span className="truncate text-[10px] text-[#9ca3af]">
              {document.category_list || document.item_group}
            </span>
          )}
        </div>

        {/* SKU */}
        <button
          type="button"
          onClick={copySku}
          title="Click to copy SKU"
          className="flex min-h-[22px] items-center gap-[4px] min-w-0 text-left"
        >
          <span className="truncate font-mono text-[11px] font-semibold text-[#111]">
            {highlightText(document.item_code || "-", query)}
          </span>
          <span className="shrink-0 rounded-[3px] bg-[#f3f4f6] px-[5px] py-[2px] font-mono text-[9px] text-[#9ca3af]">
            {copied ? "✓" : "copy"}
          </span>
        </button>

        {/* PRICE */}
        <div className="min-h-[42px]">
          {hasPrice ? (
            <div className="flex flex-wrap items-center gap-[6px]">
              <span className="text-[15px] font-bold text-[#111] leading-none">
                {formatPrice(activePrice)}
              </span>
              {discounted && (
                <>
                  <span className="text-[11px] text-[#b0b0b0] line-through leading-none">
                    {formatPrice(rate)}
                  </span>
                  <span className="rounded-[3px] bg-[#dc2626] px-[4px] py-[1px] text-[9px] font-bold uppercase text-white leading-none">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-[#9ca3af]">—</span>
          )}
        </div>

        {/* STOCK */}
        <div className="flex min-h-[20px] items-center gap-[5px]">
          {inStock ? (
            <>
              <CheckIcon />
              <span className="text-[11px] font-medium text-[#16a34a] leading-none">
                {stock > 0
                  ? `${stock}${document.stock_uom ? ` ${document.stock_uom}` : ""}`
                  : "In stock"}
              </span>
            </>
          ) : (
            <>
              <MinusCircleIcon />
              <span className="text-[11px] font-medium text-[#9ca3af] leading-none">Out of stock</span>
            </>
          )}
        </div>

        {/* ADD BUTTON */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onShortlist(document); }}
          className={`mt-auto w-full py-[10px] text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-150 ${
            isShortlisted
              ? "bg-[#1b6dff] text-white"
              : "bg-[#111] text-white hover:bg-[#333]"
          }`}
        >
          {isShortlisted ? "✓ Added" : "Add"}
        </button>
      </div>
    </article>
  );
}

/* ── BADGE ── */
function Badge({ tone, children }) {
  const cls = {
    accent: "bg-[#1b6dff] text-white",
    danger: "bg-[#b42318] text-white",
    warn:   "bg-[#d97706] text-white",
    sale:   "bg-[#dc2626] text-white",
    oos:    "bg-white/90 text-[#6b7280] border border-[#e5e5e5]",
  };
  return (
    <span className={`inline-block px-[5px] py-[1px] text-[8px] font-bold uppercase tracking-[0.08em] ${cls[tone] || cls.oos}`}>
      {children}
    </span>
  );
}

/* ── ICON BUTTON ── */
function IconBtn({ label, active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`pointer-events-auto inline-flex h-[24px] w-[24px] items-center justify-center border transition ${
        active
          ? "border-[#111] bg-[#111] text-white"
          : "border-[#e5e5e5] bg-white/90 text-[#374151] hover:border-[#111]"
      }`}
    >
      {children}
    </button>
  );
}

/* ── STOCK ICONS ── */
function CheckIcon() {
  return (
    <svg className="h-[10px] w-[10px] shrink-0 text-[#16a34a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MinusCircleIcon() {
  return (
    <svg className="h-[10px] w-[10px] shrink-0 text-[#9ca3af]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

/* ── CARD ICONS ── */
function HeartIcon({ filled }) {
  return (
    <svg className="h-[11px] w-[11px]" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg className="h-[11px] w-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg className="h-[11px] w-[11px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.9 5.2L19 9l-5.1 1.8L12 16l-1.9-5.2L5 9l5.1-1.8L12 2z" />
    </svg>
  );
}

/* ── IMAGE ── */
function resolveImageSrc(raw) {
  if (!raw || typeof raw !== "string" || raw.trim() === "") return null;
  const t = raw.trim();
  if (t.startsWith("https://")) return t;
  if (t.startsWith("http://")) return t.replace("http://", "https://");
  return check_Image(t);
}

function ProductImage({ document }) {
  const [errored, setErrored] = useState(false);
  const src = resolveImageSrc(document?.image || null);

  if (!src || errored) return <ProductPlaceholder document={document} />;

  return (
    <img
      src={src}
      alt={document.item_name || document.item_code || "Product"}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className="h-full w-full object-contain p-[10px] transition-transform duration-300 group-hover:scale-[1.05]"
    />
  );
}

function ProductPlaceholder({ document }) {
  const initial = (
    document?.brand?.[0] || document?.item_name?.[0] || document?.item_code?.[0] || "?"
  ).toUpperCase();
  const code = document?.item_code || "";
  const hue = [...code].reduce((n, c) => n + c.charCodeAt(0), 0) % 360;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[6px]">
      <div
        className="flex h-[40px] w-[40px] items-center justify-center rounded-[4px] text-[16px] font-bold text-white"
        style={{ backgroundColor: `hsl(${hue},30%,55%)` }}
      >
        {initial}
      </div>
      {code && (
        <span className="px-[4px] text-center font-mono text-[8px] font-medium uppercase tracking-[0.1em] text-[#c0c0c0] leading-[1.3]">
          {code}
        </span>
      )}
    </div>
  );
}
