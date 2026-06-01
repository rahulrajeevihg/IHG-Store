import { useState } from "react";
import { check_Image } from "@/libs/api";
import { highlightText, formatPrice } from "../utils/format";
import { formatPlusCount, getBusinessSignals } from "@/libs/businessSignals";
import { formatStockQty, resolveInStock, resolveStockQty } from "../utils/stock";

export default function ProductCard({
  document,
  query,
  onNavigate,
  onQuickView,
  onShortlist,
  onWishlist,
  onReportIssue,
  onSimilar,
  isWishlisted,
  isShortlisted,
  includeInactive,
  dense = false,
  salesMode = false,
  cartQty = 0,
  onAddToCart,
  isTourAnchor = false,
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
  const discountAmount = discounted ? rate - offer : 0;
  const {
    starRating,
    customerCount,
    soldQty,
    hasStarRating,
    hasCustomerCount,
    hasSoldQty,
  } = getBusinessSignals(document);

  const stock = resolveStockQty(document);
  const inStock = resolveInStock(document);
  const stockSeverity =
    stock <= 0
      ? "none"
      : stock === 1
      ? "critical"
      : stock <= 5
      ? "low"
      : "healthy";
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
    <article
      data-tour={isTourAnchor ? "product-card" : undefined}
      onClick={() => onNavigate(document)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d0d5dd] hover:shadow-[0_8px_24px_rgba(16,24,40,0.1)] cursor-pointer"
    >
      {/* Top-right badges */}
      {(discounted || hasStarRating) && (
        <div className="absolute right-0 top-0 z-20 flex flex-col items-end gap-1.5 p-1.5">
          {discounted && (
            <div data-tour={isTourAnchor ? "product-card-promo-badge" : undefined} className="overflow-hidden rounded-tr-xl">
              <div className="bg-[#dc2626] px-2.5 py-[4px] text-[9px] font-bold uppercase tracking-[0.1em] text-white rounded-bl-lg">
                Promo
              </div>
            </div>
          )}
          {hasStarRating && (
            <div data-tour={isTourAnchor ? "product-card-star-rating" : undefined} className="rounded-full border border-[#fcd34d] bg-[#fffbeb] px-2 py-[3px] text-[9px] font-bold text-[#b45309] shadow-sm">
              ★ {starRating.toFixed(1)}
            </div>
          )}
        </div>
      )}

      {/* Status badges — top-left */}
      {(exactSkuMatch || inactive || !inStock) && (
        <div className="absolute left-2 top-2 z-20 flex flex-col gap-1 pointer-events-none">
          {exactSkuMatch && <Badge tone="accent">SKU</Badge>}
          {inactive      && <Badge tone="danger">Inactive</Badge>}
          {!inStock      && <Badge tone="oos">OOS</Badge>}
        </div>
      )}

      {/* IMAGE */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f7f8fa] flex items-center justify-center">
        <ProductImage document={document} />

        {/* hover actions */}
        <div className="tour-hover-actions absolute right-2 top-2 hidden lg:flex flex-col gap-1.5 translate-y-1 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <IconBtn data-tour={isTourAnchor ? "product-card-hover-save" : undefined} label={isWishlisted ? "Remove from saved" : "Save"} active={isWishlisted} onClick={(e) => { e.stopPropagation(); onWishlist(document); }}>
            <HeartIcon filled={isWishlisted} />
          </IconBtn>
          <IconBtn data-tour={isTourAnchor ? "product-card-hover-quickview" : undefined} label="Quick view" onClick={(e) => { e.stopPropagation(); onQuickView(document); }}>
            <EyeIcon />
          </IconBtn>
          <IconBtn data-tour={isTourAnchor ? "product-card-hover-report" : undefined} label="Report issue" onClick={(e) => { e.stopPropagation(); onReportIssue && onReportIssue(document); }}>
            <FlagIcon />
          </IconBtn>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 flex-col gap-1 p-2.5">

        {/* Brand · Category */}
        {(document.brand || document.category_list || document.item_group) && (
          <div data-tour={isTourAnchor ? "product-card-brand-category" : undefined} className="flex items-center gap-1 min-w-0">
            {document.brand && (
              <span className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#a8b3bf]">
                {document.brand}
              </span>
            )}
            {document.brand && (document.category_list || document.item_group) && (
              <span className="shrink-0 text-[9px] text-[#d1d5db]">·</span>
            )}
            {(document.category_list || document.item_group) && (
              <span className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#a8b3bf]">
                {document.category_list || document.item_group}
              </span>
            )}
          </div>
        )}

        {/* Item code — primary identifier */}
        <button
          data-tour={isTourAnchor ? "product-card-item-code" : undefined}
          type="button"
          onClick={copySku}
          title="Click to copy item code"
          className="flex items-center gap-1.5 min-w-0 text-left hover:opacity-80 transition-opacity"
        >
          <span className="truncate font-mono text-[13px] font-bold text-[#111827]">
            {highlightText(document.item_code || "-", query)}
          </span>
          <span className="shrink-0 rounded bg-[#f3f4f6] px-[5px] py-[1px] font-mono text-[7px] text-[#b0b7c3]">
            {copied ? "✓" : "copy"}
          </span>
        </button>

        {/* Item name — fixed 2-line height so all cards align */}
        <p
          data-tour={isTourAnchor ? "product-card-item-name" : undefined}
          className="line-clamp-2 h-[28px] overflow-hidden text-[10px] font-normal leading-[1.4] text-[#6b7280]"
          title={document.item_name || document.item_code}
        >
          {highlightText(document.item_name || document.item_code || "-", query)}
        </p>

        {/* Price */}
        <div data-tour={isTourAnchor ? "product-card-price" : undefined} className="mt-0.5 min-h-[38px]">
          {hasPrice ? (
            <>
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="text-[14px] font-bold leading-none text-[#111827]">
                  {formatPrice(activePrice)}
                </span>
                {discounted && (
                  <span className="text-[10px] leading-none text-[#b0b7c3] line-through">
                    AED {Number(rate).toFixed(2)}
                  </span>
                )}
              </div>
              {discounted && (
                <div data-tour={isTourAnchor ? "product-card-discount" : undefined} className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="rounded-md bg-[#fef2f2] px-1.5 py-[2px] text-[9px] font-bold text-[#dc2626]">
                    {discountPct}%
                  </span>
                  <span className="text-[9px] text-[#9ca3af]">
                    Save AED {Math.round(discountAmount).toFixed(2)}
                  </span>
                </div>
              )}
            </>
          ) : (
            <span className="inline-flex min-h-[22px] items-end text-[10px] text-[#9ca3af]">Price on request</span>
          )}
        </div>

        {(hasCustomerCount || hasSoldQty) && (
          <div data-tour={isTourAnchor ? "product-card-customer-signals" : undefined} className="mt-1 flex flex-wrap items-center gap-1.5">
            {hasCustomerCount && (
              <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2 py-[3px] text-[9px] font-semibold text-[#1d4ed8]">
                {formatPlusCount(customerCount)} customers
              </span>
            )}
            {hasSoldQty && (
              <span className="rounded-full border border-[#d9f99d] bg-[#f7fee7] px-2 py-[3px] text-[9px] font-semibold text-[#3f6212]">
                {formatPlusCount(soldQty)} qty sold
              </span>
            )}
          </div>
        )}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          {/* Stock — highlighted */}
          <div className="min-h-[30px]">
            {inStock ? (
              <span
                data-tour={isTourAnchor ? "product-card-stock" : undefined}
                className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-lg px-2.5 py-[5px] ${
                  stockSeverity === "critical"
                    ? "border border-[#fecaca] bg-[#fef2f2]"
                    : stockSeverity === "low"
                    ? "border border-[#fed7aa] bg-[#fff7ed]"
                    : "border border-[#bbf7d0] bg-[#f0fdf4]"
                }`}
              >
                <svg
                  className={`h-[13px] w-[13px] shrink-0 ${
                    stockSeverity === "critical"
                      ? "text-[#dc2626]"
                      : stockSeverity === "low"
                      ? "text-[#ea580c]"
                      : "text-[#16a34a]"
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" strokeLinejoin="round" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeLinejoin="round" />
                  <line x1="12" y1="12" x2="12" y2="12" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span
                  className={`text-[11px] font-bold ${
                    stockSeverity === "critical"
                      ? "text-[#dc2626]"
                      : stockSeverity === "low"
                      ? "text-[#ea580c]"
                      : "text-[#16a34a]"
                  }`}
                >
                  {stock > 0
                    ? `${formatStockQty(stock)}${document.stock_uom ? ` ${document.stock_uom}` : ""}`
                    : "In stock"}
                </span>
              </span>
            ) : (
              <span data-tour={isTourAnchor ? "product-card-stock" : undefined} className="inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-2.5 py-[5px]">
                <svg className="h-[13px] w-[13px] shrink-0 text-[#9ca3af]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12h8" strokeLinecap="round" />
                </svg>
                <span className="text-[11px] font-semibold text-[#9ca3af]">Out of stock</span>
              </span>
            )}
          </div>

          {/* Add button */}
          <div>
          {salesMode ? (
            <div className="relative h-[33px]">
              <div
                data-tour={isTourAnchor ? "product-card-qty-stepper" : undefined}
                className={`absolute inset-0 flex items-center overflow-hidden rounded-lg border border-[#e6ebf1] bg-white transition-all duration-200 ${
                  cartQty > 0 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(document, cartQty - 1); }}
                  className="flex h-full w-9 shrink-0 items-center justify-center text-lg font-light text-[#374151] hover:bg-[#f9fafb] active:bg-[#f3f4f6]"
                >
                  −
                </button>
                <span className="flex-1 text-center text-[13px] font-bold tabular-nums text-[#111]">
                  {cartQty}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(document, cartQty + 1); }}
                  className="flex h-full w-9 shrink-0 items-center justify-center text-lg font-light text-[#374151] hover:bg-[#f9fafb] active:bg-[#f3f4f6]"
                >
                  +
                </button>
              </div>
              <button
                data-tour={isTourAnchor ? "product-card-add-to-cart" : undefined}
                type="button"
                onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(document, 1); }}
                className={`absolute inset-0 rounded-lg bg-black px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition-all duration-200 hover:bg-[#1f1f1f] active:scale-[0.99] ${
                  cartQty === 0 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                Add to Cart
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onShortlist(document); }}
              className={`h-[33px] w-full rounded-lg px-3 text-[10px] font-bold uppercase tracking-[0.1em] active:scale-[0.99] transition-all duration-[180ms] ${
                isShortlisted
                  ? "bg-[#1b6dff] text-white"
                  : "bg-black text-white hover:bg-[#1f1f1f]"
              }`}
            >
              {isShortlisted ? "✓ Added" : "Add"}
            </button>
          )}
          </div>
        </div>

      </div>
    </article>
  );
}

/* ── BADGE ── */
function Badge({ tone, children }) {
  const cls = {
    accent: "bg-[#1b6dff] text-white",
    danger: "bg-[#b42318] text-white",
    oos:    "bg-white/90 text-[#6b7280] border border-[#e5e5e5]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-[6px] py-[2px] text-[8px] font-bold uppercase tracking-[0.06em] shadow-sm ${cls[tone] || cls.oos}`}>
      {children}
    </span>
  );
}

/* ── ICON BUTTON ── */
function IconBtn({ label, active, onClick, children, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      {...props}
      className={`pointer-events-auto inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg border shadow-sm transition-all duration-[180ms] ${
        active
          ? "border-[#111] bg-[#111] text-white"
          : "border-[#e5e5e5] bg-white/95 text-[#374151] hover:border-[#111] hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

/* ── CARD ICONS ── */
function HeartIcon({ filled }) {
  return (
    <svg className="h-[10px] w-[10px]" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg className="h-[10px] w-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg className="h-[10px] w-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 3v18" strokeLinecap="round" />
      <path d="M5 4h10l-1.8 4L15 12H5" strokeLinejoin="round" />
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
      className="h-full w-full object-contain p-3 transition-transform duration-200 group-hover:scale-[1.04]"
    />
  );
}

const CATEGORY_STYLES = [
  { keys: ["LIGHT", "SPOT", "LAMP", "LED"],       bg: "#fffbeb", accent: "#d97706", letter: "#92400e" },
  { keys: ["AUDIO", "SPEAKER", "SOUND"],           bg: "#eef2ff", accent: "#6366f1", letter: "#3730a3" },
  { keys: ["ELECTRIC"],                             bg: "#eff6ff", accent: "#3b82f6", letter: "#1d4ed8" },
  { keys: ["DECOR"],                                bg: "#fdf4ff", accent: "#c026d3", letter: "#86198f" },
  { keys: ["SMART", "AUTO", "HOME"],               bg: "#ecfdf5", accent: "#10b981", letter: "#065f46" },
  { keys: ["IT ", "ASSET", "COMPUTER"],            bg: "#f0f9ff", accent: "#0ea5e9", letter: "#075985" },
  { keys: ["VIPRA"],                                bg: "#f5f3ff", accent: "#8b5cf6", letter: "#5b21b6" },
  { keys: ["RAW"],                                  bg: "#fefce8", accent: "#ca8a04", letter: "#713f12" },
  { keys: ["HARDWARE", "TOOL"],                    bg: "#f5f5f4", accent: "#78716c", letter: "#44403c" },
  { keys: ["STATION"],                              bg: "#f0fdf4", accent: "#22c55e", letter: "#14532d" },
];

function getCategoryStyle(document) {
  const group = String(document?.item_group || document?.category_list || "").toUpperCase();
  for (const s of CATEGORY_STYLES) {
    if (s.keys.some((k) => group.includes(k))) return s;
  }
  return { bg: "#f4f6f8", accent: "#64748b", letter: "#334155" };
}

function ProductPlaceholder({ document }) {
  const { bg, accent, letter } = getCategoryStyle(document);
  const group = document?.item_group || document?.category_list || "";
  const abbr = group ? group.replace(/[^A-Z]/gi, "").slice(0, 2).toUpperCase() || group.slice(0, 2).toUpperCase() : "IH";

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(150deg, ${bg} 0%, #ffffff 70%)` }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 30% 30%, ${accent}18 0%, transparent 65%)` }}
      />
      <div
        className="absolute select-none font-black leading-none pointer-events-none"
        style={{ fontSize: "80px", color: accent, opacity: 0.05, letterSpacing: "-3px" }}
        aria-hidden="true"
      >
        {abbr}
      </div>
      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <div
          className="flex h-[34px] w-[34px] items-center justify-center rounded-xl text-[12px] font-black tracking-tight"
          style={{
            backgroundColor: `${accent}18`,
            color: letter,
            border: `1.5px solid ${accent}30`,
          }}
        >
          {abbr}
        </div>
        <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-gray-400">
          No image yet
        </p>
      </div>
    </div>
  );
}
