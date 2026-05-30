import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import useHomeDashboardData from "./useHomeDashboardData";
import { DonutGauge, CategoryDonut, BarChart, LineChart } from "./charts";
import {
  SearchIcon, ScanIcon, BellIcon, ChevronDownIcon, ArrowRightIcon, ArrowUpRightIcon,
  RefreshIcon, StarIcon, UsersIcon, BookOpenIcon, BotIcon, PackageIcon,
  ClockIcon, WalletIcon, RotateLeftIcon, TrendingUpIcon,
  QuickActionIcon, CategoryIcon, InsightIcon,
} from "./icons";
import styles from "./HomeDashboard.module.scss";

const AED = new Intl.NumberFormat("en-AE", {
  style: "currency", currency: "AED", minimumFractionDigits: 0, maximumFractionDigits: 0,
});
const AED_COMPACT = new Intl.NumberFormat("en-AE", {
  style: "currency", currency: "AED", notation: "compact", maximumFractionDigits: 1,
});

const toNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const formatCurrency = (v) => AED.format(toNumber(v));
const formatCompact = (v) => AED_COMPACT.format(toNumber(v));
const formatInt = (v) => toNumber(v).toLocaleString("en-AE");
const pct = (v) => Math.max(0, Math.min(999, toNumber(v)));

// Optional bundled artwork. Drop files into /public/images/home/ and they appear
// automatically; until then each usage falls back to an icon/gradient (no broken images).
const IMG = {
  hero: ["/Home/hero1.webp", "/Home/hero2.webp", "/Home/hero3.webp"],
  aiAssistant: "/Home/ai-assistant.png",
  productPlaceholder: "/Home/product-placeholder.png",
  emptyState: "/Home/empty-state.png",
};

const HERO_SLIDES = [
  { tag: "New arrival", title: ["Explore New Products", "Built for Performance"], body: "Latest electrical & plumbing solutions, now in stock. Every metric here is live from ERPNext.", cta: "Explore now", route: "/search/New%20Arrivals", image: IMG.hero[0] },
  { tag: "Top sellers", title: ["Stock the Winners", "Your Region Loves"], body: "Restock fast-movers before they run out and keep your monthly target on track.", cta: "View top sellers", route: "/search", image: IMG.hero[1] },
  { tag: "Catalogs", title: ["Share Catalogs &", "Close Deals Faster"], body: "Browse the full range, build a cart, and share product links with customers in seconds.", cta: "Browse catalogs", route: "/brands", image: IMG.hero[2] },
];

const TONE = {
  critical: { card: "border-[#f6cccc] bg-[#fff3f3]", text: "text-[#a32d2d]", icon: "bg-[#fde0e0] text-[#c0392b]" },
  warning: { card: "border-[#f6dcb4] bg-[#fff8ec]", text: "text-[#92580f]", icon: "bg-[#fdedcf] text-[#c47d12]" },
  success: { card: "border-[#c6e9d6] bg-[#effbf4]", text: "text-[#1d7347]", icon: "bg-[#d4f3e1] text-[#178a52]" },
  info: { card: "border-[#cfdcff] bg-[#f3f6ff]", text: "text-[#2b4d99]", icon: "bg-[#dde6ff] text-[#3a5bd9]" },
};
const tone = (s) => TONE[s] || TONE.info;

function initials(name = "") {
  return String(name).trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";
}

/* ───────────────────────── Reusable blocks ───────────────────────── */

function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`${styles.glassCard} rounded-[20px] p-[14px] md:p-[16px] ${className}`}>
      {(title || action) && (
        <div className="mb-[12px] flex items-center justify-between gap-[8px]">
          {title && <h3 className="text-[15px] font-[700] tracking-[-0.01em] text-[#16264c]">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function ZoneHeading({ eyebrow, title, action }) {
  return (
    <div className="flex items-center gap-[12px] pt-[6px]">
      <div>
        {eyebrow && <p className="text-[10px] font-[700] uppercase tracking-[0.14em] text-[#8190b7]">{eyebrow}</p>}
        <h2 className="text-[18px] font-[800] tracking-[-0.02em] text-[#16264c]">{title}</h2>
      </div>
      <span className={styles.zoneRule} />
      {action}
    </div>
  );
}

function SeeAll({ onClick, label = "See all" }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex shrink-0 items-center gap-[3px] text-[11px] font-semibold text-[#3a5bd9] hover:text-[#2741b8]">
      {label} <ArrowRightIcon size={13} />
    </button>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className={`${styles.tabs} max-w-full overflow-x-auto ${styles.scrollRow}`}>
      {tabs.map((t, i) => (
        <button key={t} type="button" onClick={() => onChange(i)} className={`${styles.tab} ${i === active ? styles.tabActive : ""}`}>
          {t}
        </button>
      ))}
    </div>
  );
}

function Skeleton({ rows = 4 }) {
  return (
    <div className="animate-pulse space-y-[9px]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-[14px] rounded-[6px] bg-[#dce5fb]" style={{ width: `${100 - i * 8}%` }} />
      ))}
    </div>
  );
}

function EmptyState({ text = "No data for this period", cta, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center gap-[8px] rounded-[14px] border border-dashed border-[#cdd9f5] bg-white/40 px-[14px] py-[26px] text-center">
      <span className="flex size-[48px] items-center justify-center overflow-hidden rounded-full bg-[#eef2ff] text-[#9aabd6]">
        <Thumb src={IMG.emptyState} fit="contain" fallback={<PackageIcon size={19} />} />
      </span>
      <p className="text-[12px] text-[#6c7ca6]">{text}</p>
      {cta && <button type="button" onClick={onCta} className="mt-[2px] inline-flex items-center gap-[5px] rounded-[10px] bg-[#3a5bd9] px-[12px] py-[6px] text-[11px] font-semibold text-white hover:bg-[#2741b8]">{cta} <ArrowRightIcon size={13} /></button>}
    </div>
  );
}

function StateWrap({ loading, error, isEmpty, onRetry, emptyEl, skeletonRows, children }) {
  if (loading) return <Skeleton rows={skeletonRows} />;
  if (error) return (
    <div className="rounded-[12px] border border-[#f6d3d3] bg-[#fff4f4] p-[11px]">
      <p className="text-[12px] text-[#a53535]">{error}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-[8px] rounded-[8px] border border-[#e9bcbc] bg-white px-[10px] py-[5px] text-[11px] font-semibold text-[#8f2f2f]">Retry</button>}
    </div>
  );
  if (isEmpty) return emptyEl || <EmptyState />;
  return children;
}

/* ───────── Ecommerce product card + tabbed storefront ───────── */

// Tries each source in order (e.g. ERP image → bundled placeholder), then a node fallback.
function Thumb({ src, fallbackSrc, alt = "", fallback, fit = "cover", className = "" }) {
  const sources = [src, fallbackSrc].filter(Boolean);
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [src, fallbackSrc]);
  const current = sources[idx];
  if (!current) return <span className={`flex size-full items-center justify-center text-[#9aabd6] ${className}`}>{fallback}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={current} alt={alt} onError={() => setIdx((n) => n + 1)} loading="lazy" className={className} style={{ objectFit: fit, width: "100%", height: "100%" }} />;
}

function ProductCard({ row, rank, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`${styles.productCard} ${styles.glassCard} group flex flex-col overflow-hidden rounded-[16px] text-left`}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-[#eef2ff] to-[#e3eaff]">
        <Thumb src={row.image} fallbackSrc={IMG.productPlaceholder} alt={row.itemName} fallback={<PackageIcon size={34} />} className={styles.productImg} />
        {rank != null && (
          <span className="absolute left-[8px] top-[8px] flex size-[20px] items-center justify-center rounded-full bg-white/90 text-[10px] font-[800] text-[#3a5bd9] shadow-sm">{rank}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-[10px]">
        <p className="line-clamp-2 text-[12px] font-[600] leading-[1.3] text-[#1d3159]">{row.itemName || row.itemCode}</p>
        <p className="mt-[2px] truncate text-[10px] text-[#8190b7]">{row.itemCode || "—"}</p>
        <div className="mt-auto flex items-end justify-between pt-[8px]">
          <span className="text-[13px] font-[800] text-[#1b2f57]">{toNumber(row.amount) > 0 ? formatCompact(row.amount) : "View"}</span>
          {toNumber(row.qty) > 0 && <span className="rounded-full bg-[#eef2ff] px-[7px] py-[2px] text-[10px] font-semibold text-[#3a5bd9]">Qty {formatInt(row.qty)}</span>}
        </div>
      </div>
    </button>
  );
}

function ProductShowcase({ lists, loading, error, onRetry, onNavigate, productRoute, onSeeAll }) {
  const [active, setActive] = useState(0);
  const tabs = lists.map((l) => l.title);
  const rows = lists[active]?.rows || [];
  return (
    <Panel
      title="Product Showcase"
      action={<div className="flex items-center gap-[10px]"><Tabs tabs={tabs} active={active} onChange={setActive} /><span className="hidden sm:block"><SeeAll onClick={onSeeAll} /></span></div>}
    >
      <StateWrap loading={loading} error={error} isEmpty={rows.length === 0} onRetry={onRetry}
        emptyEl={<EmptyState text="No products in this list for the current period" cta="Browse all products" onCta={onSeeAll} />}>
        <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-5">
          {rows.slice(0, 5).map((row, idx) => (
            <ProductCard key={`${row.itemCode || row.itemName}-${idx}`} row={row} rank={idx + 1} onClick={() => onNavigate(productRoute(row))} />
          ))}
        </div>
      </StateWrap>
    </Panel>
  );
}

/* ───────── Tabbed customer panel ───────── */

function CustomerRows({ rows = [], accent = "#3a5bd9", valueClass = "text-[#183161]", icon }) {
  return (
    <ul className="grid grid-cols-1 gap-[6px] sm:grid-cols-2">
      {rows.slice(0, 6).map((row, idx) => (
        <li key={`${row.customerName}-${idx}`} className={`${styles.tile} flex items-center gap-[9px] rounded-[12px] border border-white/70 bg-white/55 px-[10px] py-[8px]`}>
          <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full text-[11px] font-[700] text-white" style={{ background: accent }}>
            {icon || initials(row.customerName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-[600] text-[#1d335d]">{row.customerName}</span>
            <span className="block truncate text-[10px] text-[#7585ad]">{row.extraLabel || row.dateLabel || "—"}</span>
          </span>
          {toNumber(row.value) > 0 && <span className={`shrink-0 text-[12px] font-[700] ${valueClass}`}>{formatCompact(row.value)}</span>}
        </li>
      ))}
    </ul>
  );
}

function ReturnsRows({ rows = [] }) {
  return (
    <ul className="grid grid-cols-1 gap-[6px] sm:grid-cols-2">
      {rows.slice(0, 6).map((item, idx) => (
        <li key={`${item.itemName}-${idx}`} className={`${styles.tile} flex items-center gap-[9px] rounded-[12px] border border-white/70 bg-white/55 px-[10px] py-[8px]`}>
          <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[9px] bg-[#fde8e4] text-[#d9684f]"><RotateLeftIcon size={15} /></span>
          <span className="min-w-0 flex-1 truncate text-[12px] font-[600] text-[#1d335d]">{item.itemName}</span>
          <span className="shrink-0 text-[11px] font-[700] text-[#b5392b]">{formatInt(item.returns)}</span>
        </li>
      ))}
    </ul>
  );
}

function CustomerPanel({ customers, loading, error, onRetry }) {
  const [active, setActive] = useState(0);
  const cols = [
    { title: "Recently Ordered", rows: customers.recentlyOrderedCustomers, accent: "#3a5bd9", icon: null },
    { title: "Outstanding", rows: customers.customersWithOutstanding, accent: "#e0796b", valueClass: "text-[#b5392b]", icon: <WalletIcon size={15} /> },
    { title: "Inactive 30+ Days", rows: customers.inactive30PlusDays, accent: "#7c8db5", icon: <ClockIcon size={15} /> },
    { title: "Top Buying", rows: customers.topBuyingCustomers, accent: "#178a52", icon: <TrendingUpIcon size={15} /> },
    { title: "Returns", rows: customers.frequentlyReturnedItems, returns: true },
  ];
  const col = cols[active];
  const isEmpty = (col.rows || []).length === 0;
  return (
    <Panel title="Customer Insights" action={<Tabs tabs={cols.map((c) => c.title)} active={active} onChange={setActive} />}>
      <StateWrap loading={loading} error={error} isEmpty={isEmpty} onRetry={onRetry}
        emptyEl={<EmptyState text={`No ${col.title.toLowerCase()} data for this period`} />}>
        {col.returns ? <ReturnsRows rows={col.rows} /> : <CustomerRows rows={col.rows} accent={col.accent} valueClass={col.valueClass} icon={col.icon} />}
      </StateWrap>
    </Panel>
  );
}

/* ───────────────────────── Top bar ───────────────────────── */

function TopBar({ profile, salesPersonLabel, designation, query, setQuery, onSearch, onScan, onRefresh, refreshing }) {
  return (
    <header className={`${styles.glassBar} sticky top-0 z-30`}>
      <div className="mx-auto flex w-full max-w-[1480px] items-center gap-[10px] px-[14px] py-[10px] md:px-[24px]">
        <button type="button" onClick={() => onSearch("")} className="flex shrink-0 items-center gap-[9px]">
          <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-gradient-to-br from-[#4f6dff] to-[#7c3aed] text-white shadow-[0_6px_16px_rgba(79,109,255,0.4)]"><BoxLogo /></span>
          <span className="hidden text-left sm:block">
            <span className="block text-[16px] font-[800] leading-none tracking-[-0.02em] text-[#16264c]">SalesHub</span>
            <span className="block text-[10px] text-[#6c7ca6]">Your Products. Your Growth.</span>
          </span>
        </button>

        <form onSubmit={(e) => { e.preventDefault(); onSearch(query); }} className="relative mx-[2px] hidden flex-1 items-center md:flex">
          <div className="animated-search-glow relative flex w-full rounded-[12px]">
            <SearchIcon size={17} className="pointer-events-none absolute left-[12px] top-1/2 z-[1] -translate-y-1/2 text-[#8190b7]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by product, SKU, category, brand…" aria-label="Search products"
              className="h-[40px] w-full rounded-[12px] border border-transparent bg-transparent pl-[36px] pr-[12px] text-[13px] text-[#1d3159] outline-none placeholder:text-[#52607c]/70" />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-[7px] md:ml-0">
          <button type="button" onClick={onScan} className={`${styles.frostButton} flex h-[38px] items-center gap-[6px] rounded-[11px] px-[11px] text-[12px] font-semibold text-[#1d3360]`}>
            <ScanIcon size={17} /> <span className="hidden lg:inline">Scan</span>
          </button>
          <button type="button" onClick={onRefresh} aria-label="Refresh dashboard" className={`${styles.frostButton} flex size-[38px] items-center justify-center rounded-[11px] text-[#1d3360]`}>
            <RefreshIcon size={17} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button type="button" aria-label="Notifications" className={`${styles.frostButton} relative flex size-[38px] items-center justify-center rounded-[11px] text-[#1d3360]`}>
            <BellIcon size={18} />
            <span className="absolute right-[7px] top-[7px] size-[7px] rounded-full bg-[#ef4444] ring-2 ring-white" />
          </button>
          <button type="button" className={`${styles.frostButton} flex h-[38px] items-center gap-[8px] rounded-[12px] py-[4px] pl-[4px] pr-[9px]`}>
            <span className="flex size-[30px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#4f6dff] to-[#7c3aed] text-[11px] font-[700] text-white">
              <Thumb src={profile.image} alt={salesPersonLabel} fallback={initials(salesPersonLabel)} />
            </span>
            <span className="hidden text-left lg:block">
              <span className="block text-[12px] font-[700] leading-none text-[#16264c]">{salesPersonLabel}</span>
              <span className="block text-[10px] text-[#6c7ca6]">{designation}</span>
            </span>
            <ChevronDownIcon size={15} className="hidden text-[#6c7ca6] lg:block" />
          </button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSearch(query); }} className="relative mx-auto flex w-full max-w-[1480px] items-center px-[14px] pb-[10px] md:hidden">
        <div className="animated-search-glow relative flex w-full rounded-[12px]">
          <SearchIcon size={17} className="pointer-events-none absolute left-[12px] top-1/2 z-[1] -translate-y-1/2 text-[#8190b7]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product, SKU, category…" aria-label="Search products"
            className="h-[40px] w-full rounded-[12px] border border-transparent bg-transparent pl-[36px] pr-[12px] text-[13px] text-[#1d3159] outline-none placeholder:text-[#52607c]/70" />
        </div>
      </form>
    </header>
  );
}

function BoxLogo() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m7.5 4.3 9 0L21 8v8l-9 5-9-5V8Z" /><path d="m3 8 9 5 9-5" /><path d="M12 13v8" />
    </svg>
  );
}

/* ───────────────────────── Hero ───────────────────────── */

function HeroTiles() {
  return (
    <div className="pointer-events-none absolute right-[18px] top-1/2 hidden -translate-y-1/2 grid-cols-2 gap-[10px] lg:grid">
      {[<CategoryIcon key="a" name="lighting" size={24} />, <CategoryIcon key="b" name="electrical" size={24} />, <CategoryIcon key="c" name="plumbing" size={24} />, <CategoryIcon key="d" name="tools" size={24} />].map((ic, i) => (
        <span key={i} className="flex size-[58px] items-center justify-center rounded-[16px] border border-white/40 bg-white/20 text-white backdrop-blur-md" style={{ transform: `translateY(${i % 2 ? 12 : -6}px)` }}>{ic}</span>
      ))}
    </div>
  );
}

// Shows the bundled hero artwork when present; otherwise the decorative icon tiles.
function HeroVisual({ src }) {
  const [error, setError] = useState(false);
  useEffect(() => { setError(false); }, [src]);
  if (!src || error) return <HeroTiles />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" onError={() => setError(true)} className="pointer-events-none absolute bottom-0 right-[-12px] top-0 z-[1] hidden h-full w-[52%] object-contain object-right lg:block" style={{ filter: "drop-shadow(0 18px 30px rgba(20,16,60,0.25))" }} />;
}

function HeroPanel({ onNavigate }) {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;
    const id = window.setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 5500);
    return () => window.clearInterval(id);
  }, []);
  const s = HERO_SLIDES[slide];

  return (
    <div className={`${styles.hero} ${styles.glassCard} relative flex min-h-[238px] flex-col justify-between overflow-hidden rounded-[22px] p-[18px] md:p-[24px]`}>
      <span className={styles.heroBlob} style={{ width: 180, height: 180, right: -30, top: -40, background: "rgba(255,255,255,0.25)" }} />
      <span className={styles.heroBlob} style={{ width: 120, height: 120, left: -20, bottom: -30, background: "rgba(124,58,237,0.45)" }} />
      <HeroVisual src={s.image} />
      <div className="relative z-10 max-w-[520px]">
        <span className="inline-flex rounded-full bg-white/20 px-[10px] py-[4px] text-[10px] font-[700] uppercase tracking-[0.12em] text-white backdrop-blur-sm">{s.tag}</span>
        <h2 className="mt-[12px] text-[27px] font-[800] leading-[1.08] tracking-[-0.03em] text-white md:text-[38px]">{s.title[0]}<br />{s.title[1]}</h2>
        <p className="mt-[8px] max-w-[440px] text-[13px] leading-[1.5] text-white/85">{s.body}</p>
      </div>
      <div className="relative z-10 mt-[16px] flex items-center gap-[14px]">
        <button type="button" onClick={() => onNavigate(s.route)} className="inline-flex items-center gap-[7px] rounded-[12px] bg-white px-[16px] py-[10px] text-[13px] font-[700] text-[#3a2fb8] shadow-[0_10px_24px_rgba(49,28,150,0.3)] transition hover:bg-[#f5f3ff]">
          {s.cta} <ArrowRightIcon size={16} />
        </button>
        <div className="flex gap-[6px]">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} type="button" aria-label={`Go to slide ${i + 1}`} onClick={() => setSlide(i)} className="h-[7px] rounded-full transition-all" style={{ width: i === slide ? 22 : 7, background: i === slide ? "#fff" : "rgba(255,255,255,0.45)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Main ───────────────────────── */

export default function HomeDashboard() {
  const router = useRouter();
  const { payload, loading, error, userProfile, derived, refreshAll } = useHomeDashboardData();
  const [query, setQuery] = useState("");

  const salesPersonLabel = payload.profile.salesPersonName || userProfile.name || "Sales Executive";
  const designation = payload.profile.designation || "Sales Executive";
  const achievement = pct(derived.achievementPercentage || payload.performance.achievementPercentage);

  const go = (route) => { if (route) router.push(route); };
  const onSearch = (q) => { const term = String(q || "").trim(); router.push(term ? `/search/${encodeURIComponent(term)}` : "/search"); };
  const productRoute = (row) => `/search/${encodeURIComponent(row?.itemCode || row?.itemName || "")}`;

  const categories = payload.categories.slice(0, 5);
  const chartMonthly = payload.charts.monthlySalesLast6Months || [];
  const chartSvT = payload.charts.salesVsTargetCurrentMonth || [];
  const chartCategory = payload.charts.categoryPerformance || [];
  const totalCategorySales = chartCategory.reduce((a, c) => a + toNumber(c.value), 0);

  const productLists = [
    { title: "New Arrivals", rows: payload.productLists.newArrivalsTop10 },
    { title: "Back in Stock", rows: payload.productLists.backToStockTop10 },
    { title: "Top · This Month", rows: payload.productLists.topSellingThisMonthTop10 },
    { title: "Top · Last Month", rows: payload.productLists.topSellingLastMonthTop10 },
    { title: "Top · This Week", rows: payload.productLists.topSellingThisWeekTop10 },
  ];

  const now = useMemo(() => new Date().toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" }), []);

  return (
    <div className={styles.dashboardShell}>
      <TopBar profile={payload.profile} salesPersonLabel={salesPersonLabel} designation={designation}
        query={query} setQuery={setQuery} onSearch={onSearch} onScan={() => go("/scanner")} onRefresh={refreshAll} refreshing={loading} />

      <div className={`${styles.reveal} mx-auto w-full max-w-[1480px] space-y-[24px] px-[14px] py-[16px] md:px-[24px] md:py-[22px]`}>
        {error && <div className="rounded-[12px] border border-[#f6d3d3] bg-[#fff4f4] px-[12px] py-[9px] text-[12px] text-[#9e3535]">{error}</div>}

        {/* ── Hero + Rank + Monthly target ── */}
        <section className="grid grid-cols-1 gap-[14px] lg:grid-cols-12">
          <div className="lg:col-span-8"><HeroPanel onNavigate={go} /></div>
          <div className="flex flex-col gap-[14px] lg:col-span-4">
            <div className={`${styles.rankCard} ${styles.glassCard} rounded-[20px] p-[16px]`}>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-white/75">Your Rank</p>
                  {payload.profile.rank > 0 ? (
                    <>
                      <p className="mt-[2px] text-[34px] font-[800] leading-none text-white">#{payload.profile.rank}</p>
                      <p className="mt-[3px] text-[11px] text-white/75">out of {payload.profile.totalSalesReps || 0} sales reps</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-[2px] text-[22px] font-[800] leading-tight text-white">Not ranked yet</p>
                      <p className="mt-[3px] text-[11px] text-white/75">no sales recorded this month</p>
                    </>
                  )}
                </div>
                <span className="flex size-[46px] items-center justify-center rounded-full bg-white/15 text-[#ffd66b] backdrop-blur-sm"><StarIcon size={24} /></span>
              </div>
              <button type="button" onClick={() => go("/profile")} className="relative z-10 mt-[12px] inline-flex items-center gap-[5px] rounded-[9px] bg-white/15 px-[10px] py-[6px] text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-white/25">
                View leaderboard <ArrowRightIcon size={13} />
              </button>
            </div>
            <Panel className="!p-[16px]" title="Monthly Target" action={<span className="text-[11px] text-[#6c7ca6]">This month</span>}>
              <div className="flex items-center gap-[14px]">
                <DonutGauge value={achievement} />
                <div className="min-w-0 flex-1 space-y-[8px]">
                  <Metric label="Achieved" value={formatCurrency(payload.performance.thisMonthSales)} accent="text-[#1d7347]" />
                  <Metric label="Target" value={formatCurrency(payload.performance.thisMonthTarget)} accent="text-[#16264c]" />
                  <Metric label="Remaining" value={formatCurrency(payload.performance.remainingTarget)} accent="text-[#b5392b]" />
                </div>
              </div>
            </Panel>
          </div>
        </section>

        {/* ── Quick actions strip ── */}
        <Panel title="Quick Actions">
          <StateWrap loading={loading} error={error} isEmpty={payload.quickActions.length === 0} onRetry={refreshAll} skeletonRows={2}>
            <div className="grid grid-cols-3 gap-[10px] sm:grid-cols-4 lg:grid-cols-8">
              {payload.quickActions.map((a) => (
                <button key={a.label} type="button" onClick={() => go(a.route)} className={`${styles.tile} flex flex-col items-center gap-[8px] rounded-[14px] border border-white/70 bg-white/55 px-[6px] py-[12px] text-center`}>
                  <span className="flex size-[40px] items-center justify-center rounded-[12px] bg-gradient-to-br from-[#eef2ff] to-[#e3eaff] text-[#3a5bd9]"><QuickActionIcon label={a.label} size={20} /></span>
                  <span className="text-[11px] font-[600] leading-tight text-[#27406f]">{a.label}</span>
                </button>
              ))}
            </div>
          </StateWrap>
        </Panel>

        {/* ══════════ ZONE: SHOP ══════════ */}
        <div className="space-y-[14px]">
          <ZoneHeading eyebrow="Storefront" title="Shop Products" action={<SeeAll onClick={() => go("/search")} label="All products" />} />

          <Panel title="Top Categories" action={<SeeAll onClick={() => go("/search")} />}>
            <StateWrap loading={loading} error={error} isEmpty={categories.length === 0} onRetry={refreshAll} emptyEl={<EmptyState text="Categories will appear once sales data is available" cta="Browse all products" onCta={() => go("/search")} />}>
              <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-5">
                {categories.map((cat) => (
                  <button key={cat.category} type="button" onClick={() => go(`/search/${encodeURIComponent(cat.category)}`)} className={`${styles.tile} flex flex-col items-center gap-[7px] rounded-[14px] border border-white/70 bg-white/55 p-[12px] text-center`}>
                    <span className="flex size-[42px] items-center justify-center rounded-[13px] bg-gradient-to-br from-[#eef2ff] to-[#e3eaff] text-[#3a5bd9]"><CategoryIcon name={cat.category} size={21} /></span>
                    <span className="w-full truncate text-[12px] font-[700] text-[#1a315c]">{cat.category}</span>
                    <span className="text-[10px] text-[#7585ad]">{formatInt(cat.productCount)} products</span>
                  </button>
                ))}
              </div>
            </StateWrap>
          </Panel>

          <ProductShowcase lists={productLists} loading={loading} error={error} onRetry={refreshAll} onNavigate={go} productRoute={productRoute} onSeeAll={() => go("/search")} />
        </div>

        {/* ══════════ ZONE: MY PERFORMANCE ══════════ */}
        <div className="space-y-[14px]">
          <ZoneHeading eyebrow="Workspace" title="My Performance" action={<span className="text-[10px] text-[#6c7ca6]">Updated {now}</span>} />

          <Panel title="Smart Sales Insights">
            <StateWrap loading={loading} error={error} isEmpty={payload.insights.length === 0} onRetry={refreshAll} skeletonRows={2}>
              <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
                {payload.insights.map((ins) => {
                  const t = tone(ins.severity);
                  return (
                    <div key={ins.id} className={`flex gap-[10px] rounded-[14px] border p-[11px] ${t.card}`}>
                      <span className={`flex size-[34px] shrink-0 items-center justify-center rounded-[10px] ${t.icon}`}><InsightIcon id={ins.id} severity={ins.severity} size={18} /></span>
                      <div className="min-w-0">
                        <p className={`text-[12px] font-[700] ${t.text}`}>{ins.title}</p>
                        <p className="mt-[2px] text-[11px] leading-[1.4] text-[#5a6c97]">{ins.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </StateWrap>
          </Panel>

          <div className="grid grid-cols-1 gap-[14px] xl:grid-cols-4">
            <Panel className="xl:col-span-2" title="Sales Trend" action={<span className="text-[10px] text-[#6c7ca6]">Last 6 months</span>}>
              <StateWrap loading={loading} error={error} isEmpty={chartMonthly.length === 0} onRetry={refreshAll} emptyEl={<EmptyState text="No sales recorded in the last 6 months" />}>
                <BarChart data={chartMonthly} height={172} valueFormatter={formatCompact} />
              </StateWrap>
            </Panel>
            <Panel title="Sales vs Target" action={<span className="text-[10px] text-[#6c7ca6]">This month</span>}>
              <StateWrap loading={loading} error={error} isEmpty={chartSvT.length === 0} onRetry={refreshAll} emptyEl={<EmptyState text="No invoices this month yet" />}>
                <LineChart data={chartSvT} showTarget valueFormatter={formatCompact} />
                <div className="mt-[8px] flex items-center gap-[14px] text-[10px] text-[#6c7ca6]">
                  <span className="flex items-center gap-[5px]"><span className="h-[3px] w-[14px] rounded-full bg-[#2f56e6]" /> Sales</span>
                  <span className="flex items-center gap-[5px]"><span className="h-[2px] w-[14px] rounded-full border-t-2 border-dashed border-[#94a3c8]" /> Target</span>
                </div>
              </StateWrap>
            </Panel>
            <Panel title="Category Share" action={<span className="text-[10px] text-[#6c7ca6]">This month</span>}>
              <StateWrap loading={loading} error={error} isEmpty={chartCategory.length === 0} onRetry={refreshAll} emptyEl={<EmptyState text="No category sales this month" />}>
                <CategoryDonut data={chartCategory} total={totalCategorySales} formatTotal={formatCompact} />
              </StateWrap>
            </Panel>
          </div>
        </div>

        {/* ══════════ ZONE: CUSTOMERS ══════════ */}
        <div className="space-y-[14px]">
          <ZoneHeading eyebrow="Workspace" title="Customers" action={<SeeAll onClick={() => go("/profile")} label="All customers" />} />
          <CustomerPanel customers={payload.customers} loading={loading} error={error} onRetry={refreshAll} />
        </div>

        {/* ── Bottom CTAs ── */}
        <section className="grid grid-cols-1 gap-[14px] md:grid-cols-3">
          <CtaCard icon={<UsersIcon size={20} />} title="View Profiles" body="Check team members & customer contacts." onClick={() => go("/profile")} />
          <CtaCard icon={<BookOpenIcon size={20} />} title="View Catalogs" body="Browse and download product catalogs." onClick={() => go("/brands")} />
          <div className={`${styles.aiCard} ${styles.glassCard} relative flex items-center gap-[14px] overflow-hidden rounded-[20px] p-[16px]`}>
            <span className={styles.heroBlob} style={{ width: 120, height: 120, right: -30, top: -30, background: "rgba(255,255,255,0.18)" }} />
            <div className="relative z-10 min-w-0 flex-1">
              <p className="text-[14px] font-[800] text-white">Need help finding something?</p>
              <p className="mt-[3px] text-[11px] text-white/85">Ask our AI assistant for products, stock & pricing.</p>
              <button type="button" onClick={() => go("/search")} className="mt-[10px] inline-flex items-center gap-[6px] rounded-[11px] bg-white px-[13px] py-[7px] text-[12px] font-[700] text-[#3a2fb8] hover:bg-[#f5f3ff]">Ask now <ArrowUpRightIcon size={14} /></button>
            </div>
            <span className="relative z-10 flex size-[56px] shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-white/15 text-white backdrop-blur-sm">
              <Thumb src={IMG.aiAssistant} fit="contain" alt="AI assistant" fallback={<BotIcon size={28} />} />
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }) {
  return (
    <div className="flex items-baseline justify-between gap-[8px] border-b border-dashed border-[#e3e9f7] pb-[6px] last:border-0 last:pb-0">
      <span className="text-[11px] text-[#6c7ca6]">{label}</span>
      <span className={`text-[13px] font-[700] tabular-nums ${accent}`}>{value}</span>
    </div>
  );
}

function CtaCard({ icon, title, body, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`${styles.glassCard} ${styles.tile} flex items-center gap-[13px] rounded-[20px] p-[16px] text-left`}>
      <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#4f6dff] to-[#7c3aed] text-white">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-[700] text-[#16264c]">{title}</span>
        <span className="block truncate text-[11px] text-[#6c7ca6]">{body}</span>
      </span>
      <ArrowRightIcon size={17} className="shrink-0 text-[#9aa7c9]" />
    </button>
  );
}
