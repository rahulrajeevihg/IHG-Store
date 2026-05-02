import { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { VISIBLE_FILTERS } from "../constants";

/* ─── icons (refined) ─────────────────────────────────────────── */
const ICONS = {
  brand:         <TagIcon />,
  category_list: <GridIcon />,
  product_type:  <BoxIcon />,
  power:         <BoltIcon />,
  color_temp:    <SunIcon />,
  ip_rate:       <ShieldIcon />,
  mounting:      <PinIcon />,
  beam_angle:    <AngleIcon />,
  lamp_type:     <BulbIcon />,
  body_finish:   <DropletIcon />,
  material:      <LayersIcon />,
  input_voltage: <PlugIcon />,
  warranty:      <AwardIcon />,
};

/* ─── main component ────────────────────────────────────────────── */
export default function FilterPanel({
  filters,
  visibleFilterOptions,
  updateMultiFilter,
  updateRangeFilter,
  clearFilters,
  setInStock,
}) {
  const open = true;

  const sections = useMemo(
    () =>
      VISIBLE_FILTERS.map((f) => {
        const sel = new Set(filters[f.key] || []);
        const options = (visibleFilterOptions[f.key] || []).filter((opt) => {
          if (sel.has(opt.value)) return true;
          const m = opt.label.match(/\((\d+)\)$/);
          return !m || Number(m[1]) > 0;
        });
        return { ...f, options, selectedCount: sel.size };
      }),
    [filters, visibleFilterOptions]
  );

  const totalActive =
    sections.reduce((s, x) => s + x.selectedCount, 0) +
    (filters.in_stock ? 1 : 0) +
    (filters.rate_range?.min || filters.rate_range?.max ? 1 : 0);

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* ── HEADER ── */}
      <div className="flex h-14 items-center justify-between border-b border-gray-100 px-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-[14px] font-bold text-gray-900 tracking-tight">Filters</span>
          {totalActive > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
              {totalActive}
            </span>
          )}
        </div>
        {totalActive > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[12px] font-medium text-gray-500 hover:text-red-600 transition-colors"
          >
            Reset All
          </button>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200"
        style={{ maxHeight: "calc(100vh - 180px)" }}
      >
        <div className="p-4 space-y-1">
          {/* IN STOCK toggle */}
          <div className="px-1 py-3 mb-2 flex items-center justify-between rounded-xl border border-gray-50 bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${filters.in_stock ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400"}`}>
                <StockIcon />
              </div>
              <span className="text-[13px] font-semibold text-gray-700">In Stock Only</span>
            </div>
            <Toggle
              checked={filters.in_stock}
              onChange={(v) => setInStock(v)}
            />
          </div>

          {/* PRICE range */}
          <FilterSection
            label="Price Range"
            icon={<PriceIcon />}
            active={!!(filters.rate_range?.min || filters.rate_range?.max)}
          >
            <div className="flex items-center gap-2 mt-1">
              <div className="relative flex-1 group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 group-focus-within:text-red-600 transition-colors">AED</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.rate_range?.min || ""}
                  onChange={(e) => updateRangeFilter("rate_range", "min", e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-100 bg-gray-50/50 pl-11 pr-3 text-[12px] text-gray-900 outline-none focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/5 transition-all"
                />
              </div>
              <div className="h-[1px] w-3 bg-gray-200" />
              <div className="relative flex-1 group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 group-focus-within:text-red-600 transition-colors">AED</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.rate_range?.max || ""}
                  onChange={(e) => updateRangeFilter("rate_range", "max", e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-100 bg-gray-50/50 pl-11 pr-3 text-[12px] text-gray-900 outline-none focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/5 transition-all"
                />
              </div>
            </div>
          </FilterSection>

          {/* FACET sections */}
          {sections.map((section, i) => (
            <FacetSection
              key={section.key}
              section={section}
              icon={ICONS[section.key] || <DotIcon />}
              selected={filters[section.key] || []}
              defaultOpen={i < 3}
              onChange={(values) =>
                updateMultiFilter(section.key, values.map((v) => ({ value: v })))
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── FilterSection ─────────────────────────────────────────────── */
function FilterSection({ label, icon, active, children }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-gray-50 last:border-0 pb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 px-1 group"
      >
        <div className="flex items-center gap-3">
          <span className={`transition-colors ${active ? "text-red-600" : "text-gray-400 group-hover:text-gray-900"}`}>
            {icon}
          </span>
          <span className="text-[13px] font-bold text-gray-800 tracking-tight uppercase tracking-widest text-[11px] opacity-70">
            {label}
          </span>
        </div>
        <ChevronIcon rotated={open} />
      </button>
      {open && <div className="px-1">{children}</div>}
    </div>
  );
}

/* ─── FacetSection ──────────────────────────────────────────────── */
function FacetSection({ section, icon, selected, defaultOpen, onChange }) {
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const parsed = useMemo(() => section.options.map((opt) => {
    const m = opt.label.match(/^(.*)\s*\((\d+)\)$/);
    return {
      value: opt.value,
      name: m ? m[1].trim() : opt.label,
      count: m ? Number(m[2]) : null,
    };
  }), [section.options]);

  const filtered = search.trim()
    ? parsed.filter((x) => x.name.toLowerCase().includes(search.toLowerCase()))
    : parsed;

  const visible = showAll || search ? filtered : filtered.slice(0, 6);

  const toggle = (value) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  };

  return (
    <div className="border-b border-gray-50 last:border-0 pb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 px-1 group"
      >
        <div className="flex items-center gap-3">
          <span className={`transition-colors ${section.selectedCount > 0 ? "text-red-600" : "text-gray-400 group-hover:text-gray-900"}`}>
            {icon}
          </span>
          <span className="text-[13px] font-bold text-gray-800 tracking-tight uppercase tracking-[0.05em] text-[11px] opacity-70">
            {section.label}
          </span>
          {section.selectedCount > 0 && (
            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-50 px-1 text-[9px] font-bold text-red-600">
              {section.selectedCount}
            </span>
          )}
        </div>
        <ChevronIcon rotated={open} />
      </button>

      {open && (
        <div className="px-1 pb-3">
          {parsed.length > 6 && (
            <div className="relative mb-3 group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${section.label.toLowerCase()}...`}
                className="h-8 w-full rounded-lg border border-gray-100 bg-gray-50/50 pl-8 pr-8 text-[12px] text-gray-900 outline-none focus:border-red-600 focus:bg-white transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          )}

          <div className="space-y-0.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-100">
            {visible.length === 0 && (
              <p className="py-2 text-[12px] text-gray-400 text-center italic">No results found</p>
            )}
            {visible.map((item) => {
              const checked = selected.includes(item.value);
              return (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-[12px] transition-all hover:bg-gray-50 ${
                    checked ? "font-bold text-red-600 bg-red-50/30" : "text-gray-600"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                      checked ? "bg-red-600 border-red-600" : "bg-white border-gray-200 group-hover:border-gray-300"
                    }`}>
                      {checked && <CheckIcon />}
                    </div>
                    <span className="truncate">{item.name}</span>
                  </span>
                  {item.count !== null && (
                    <span className={`shrink-0 text-[10px] font-medium ${checked ? "text-red-400" : "text-gray-300"}`}>
                      {item.count}
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {!search && filtered.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="mt-2 w-full text-center text-[11px] font-bold text-gray-400 hover:text-red-600 py-1.5 rounded-lg hover:bg-red-50/50 transition-all"
            >
              {showAll ? "SHOW LESS" : `SHOW ALL (${filtered.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Components ─────────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-red-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

function ChevronIcon({ rotated }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${rotated ? "rotate-180" : ""}`}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
      <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── ICONS ─────────────────────────────────────────────────────── */
function TagIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function AngleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 20h18M3 20V4M3 20l14-14" />
    </svg>
  );
}
function BulbIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.6-1.4 4.9-3.5 6.2V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.8A7 7 0 0 1 5 9a7 7 0 0 1 7-7z" />
    </svg>
  );
}
function DropletIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}
function PlugIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3" />
    </svg>
  );
}
function AwardIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}
function StockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
function PriceIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function DotIcon() {
  return (
    <svg className="h-1.5 w-1.5" viewBox="0 0 6 6" fill="currentColor">
      <circle cx="3" cy="3" r="3" />
    </svg>
  );
}

/* ─── MOBILE DIALOG ─────────────────────────────────────────────── */
export function MobileFilterDialog(props) {
  return (
    <Transition.Root show={props.open} as={Fragment}>
      <Dialog as="div" className="relative z-[9999] lg:hidden" onClose={props.onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="flex min-h-full justify-end">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="translate-x-full" enterTo="translate-x-0"
              leave="ease-in duration-250" leaveFrom="translate-x-0" leaveTo="translate-x-full"
            >
              <Dialog.Panel className="flex h-screen w-full max-w-[340px] flex-col bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                  <Dialog.Title className="text-[14px] font-bold text-gray-900 tracking-tight">
                    Filters
                  </Dialog.Title>
                  <button type="button" onClick={props.onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all">
                    <CloseIcon />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <FilterPanel {...props} />
                </div>
                <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                  <button
                    type="button"
                    onClick={props.onClose}
                    className="h-12 w-full bg-red-600 text-[13px] font-bold text-white rounded-xl shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all"
                  >
                    View Results
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
