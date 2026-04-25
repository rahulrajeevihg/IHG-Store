import { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { VISIBLE_FILTERS } from "../constants";

/* ─── icon map ─────────────────────────────────────────────────── */
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
    <div className="w-full overflow-hidden border border-[#e8e8e8] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      <div
        className="w-full"
        style={{ minWidth: 0 }}
      >
        {/* ── HEADER ── */}
        <div className="flex h-[52px] items-center border-b border-[#f0f0f0] bg-[#fafafa] px-[14px]">
          {/* icon zone */}
          <div className="relative flex h-full w-[24px] shrink-0 items-center justify-center text-[#6b7280]">
            <FilterLinesIcon />
            {totalActive > 0 && (
              <span className="absolute right-[-8px] top-[8px] flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#1b6dff] px-[4px] text-[9px] font-bold text-white">
                {totalActive}
              </span>
            )}
          </div>
          <div className="ml-[10px] flex flex-1 items-center justify-between gap-[10px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#111]">
              Filters
              {totalActive > 0 && (
                <span className="ml-[6px] inline-flex h-[16px] min-w-[16px] items-center justify-center bg-[#111] px-[4px] text-[9px] font-bold text-white">
                  {totalActive}
                </span>
              )}
            </span>
            {totalActive > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[10px] font-medium text-[#6b7280] hover:text-[#dc2626]"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div
          className="overflow-y-auto overflow-x-hidden divide-y divide-[#f3f3f3]"
          style={{ maxHeight: "calc(100vh - 180px)" }}
        >

          {/* IN STOCK toggle */}
          <FilterRow
            icon={<StockIcon />}
            label="In Stock"
            open={open}
            active={filters.in_stock}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#374151]">Show in-stock only</span>
              <Toggle
                checked={filters.in_stock}
                onChange={(v) => setInStock(v)}
              />
            </div>
          </FilterRow>

          {/* PRICE range */}
          <FilterRow
            icon={<PriceIcon />}
            label="Price (AED)"
            open={open}
            active={!!(filters.rate_range?.min || filters.rate_range?.max)}
          >
            <div className="flex items-center gap-[6px]">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-[7px] top-1/2 -translate-y-1/2 text-[9px] text-[#9ca3af]">
                  AED
                </span>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.rate_range?.min || ""}
                  onChange={(e) => updateRangeFilter("rate_range", "min", e.target.value)}
                  className="h-[30px] w-full border border-[#e5e5e5] pl-[28px] pr-[6px] text-[10px] text-[#111] outline-none focus:border-[#111]"
                />
              </div>
              <span className="text-[10px] text-[#9ca3af]">–</span>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-[7px] top-1/2 -translate-y-1/2 text-[9px] text-[#9ca3af]">
                  AED
                </span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.rate_range?.max || ""}
                  onChange={(e) => updateRangeFilter("rate_range", "max", e.target.value)}
                  className="h-[30px] w-full border border-[#e5e5e5] pl-[28px] pr-[6px] text-[10px] text-[#111] outline-none focus:border-[#111]"
                />
              </div>
            </div>
          </FilterRow>

          {/* FACET sections */}
          {sections.map((section, i) => (
            <FacetRow
              key={section.key}
              section={section}
              icon={ICONS[section.key] || <DotIcon />}
              selected={filters[section.key] || []}
              open={open}
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

/* ─── FilterRow wrapper ─────────────────────────────────────────── */
function FilterRow({ icon, label, open, active, children }) {
  const [sectionOpen, setSectionOpen] = useState(true);

  return (
    <div>
      {/* row header */}
      <button
        type="button"
        onClick={() => setSectionOpen((v) => !v)}
        className="flex h-[44px] w-full items-center text-left hover:bg-[#fafafa]"
      >
        {/* icon zone */}
        <div className="relative flex h-full w-[46px] shrink-0 items-center justify-center">
          <span className={`transition-colors ${active ? "text-[#1b6dff]" : "text-[#6b7280]"}`}>
            {icon}
          </span>
        </div>
        <div className="flex flex-1 items-center justify-between pr-[12px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#374151]">
            {label}
          </span>
          <ChevronIcon rotated={sectionOpen} />
        </div>
      </button>

      {/* expandable content */}
      {sectionOpen && (
        <div className="px-[12px] pb-[12px] pt-[4px]">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── FacetRow (checkbox list) ──────────────────────────────────── */
function FacetRow({ section, icon, selected, open, defaultOpen, onChange }) {
  const [sectionOpen, setSectionOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const parsed = section.options.map((opt) => {
    const m = opt.label.match(/^(.*)\s*\((\d+)\)$/);
    return {
      value: opt.value,
      name: m ? m[1].trim() : opt.label,
      count: m ? Number(m[2]) : null,
    };
  });

  const filtered = search.trim()
    ? parsed.filter((x) => x.name.toLowerCase().includes(search.toLowerCase()))
    : parsed;

  const visible = showAll || search ? filtered : filtered.slice(0, 6);

  const toggle = (value) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  };

  return (
    <div>
      {/* section header */}
      <button
        type="button"
        onClick={() => setSectionOpen((v) => !v)}
        className="flex h-[44px] w-full items-center text-left hover:bg-[#fafafa]"
      >
        {/* icon zone */}
        <div className="relative flex h-full w-[46px] shrink-0 items-center justify-center">
          <span className={`transition-colors ${section.selectedCount > 0 ? "text-[#1b6dff]" : "text-[#6b7280]"}`}>
            {icon}
          </span>
        </div>
        <div className="flex flex-1 items-center justify-between pr-[12px]">
          <span className="flex items-center gap-[6px] text-[11px] font-semibold uppercase tracking-[0.1em] text-[#374151]">
            {section.label}
            {section.selectedCount > 0 && (
              <span className="inline-flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#1b6dff] px-[4px] text-[8px] font-bold text-white">
                {section.selectedCount}
              </span>
            )}
          </span>
          <ChevronIcon rotated={sectionOpen} />
        </div>
      </button>

      {/* options */}
      {sectionOpen && (
        <div className="px-[12px] pb-[12px] pt-[2px]">
          {/* inline search */}
          {parsed.length > 6 && (
            <div className="relative mb-[6px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search…`}
                className="h-[28px] w-full border border-[#e8e8e8] bg-[#fafafa] px-[8px] pr-[24px] text-[10px] text-[#111] outline-none focus:border-[#111] focus:bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-[7px] top-1/2 -translate-y-1/2 text-[12px] text-[#9ca3af] hover:text-[#111]"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* selected chips */}
          {selected.length > 0 && !search && (
            <div className="mb-[6px] flex flex-wrap gap-[4px]">
              {selected.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggle(v)}
                  className="inline-flex items-center gap-[3px] rounded-[3px] bg-[#1b6dff] px-[6px] py-[2px] text-[9px] font-semibold text-white"
                >
                  {v}
                  <span className="text-[10px] opacity-80">×</span>
                </button>
              ))}
            </div>
          )}

          {/* checkbox list */}
          <div className="space-y-[1px]">
            {visible.length === 0 && (
              <p className="py-[6px] text-[10px] text-[#9ca3af]">No matches</p>
            )}
            {visible.map((item) => {
              const checked = selected.includes(item.value);
              return (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-center justify-between gap-[6px] rounded-[3px] px-[4px] py-[4px] text-[11px] transition-colors hover:bg-[#f5f5f5] ${
                    checked ? "font-semibold text-[#111]" : "text-[#374151]"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-[7px]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(item.value)}
                      className="h-[13px] w-[13px] shrink-0 accent-[#1b6dff]"
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  {item.count !== null && (
                    <span className="shrink-0 text-[9px] text-[#b0b0b0]">{item.count}</span>
                  )}
                </label>
              );
            })}
          </div>

          {!search && filtered.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-[5px] text-[10px] font-medium text-[#6b7280] hover:text-[#1b6dff]"
            >
              {showAll ? "Show less ↑" : `+ ${filtered.length - 6} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Toggle switch ─────────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-[#111]" : "bg-[#d1d5db]"
      }`}
    >
      <span
        className={`h-[14px] w-[14px] rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-[16px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

/* ─── Chevron ───────────────────────────────────────────────────── */
function ChevronIcon({ rotated }) {
  return (
    <svg
      className={`h-[11px] w-[11px] shrink-0 text-[#9ca3af] transition-transform duration-150 ${rotated ? "rotate-180" : ""}`}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── ICONS ─────────────────────────────────────────────────────── */
function FilterLinesIcon() {
  return (
    <svg className="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="22" strokeLinecap="round" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeLinecap="round" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeLinecap="round" />
      <line x1="2" y1="12" x2="4" y2="12" strokeLinecap="round" />
      <line x1="20" y1="12" x2="22" y2="12" strokeLinecap="round" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeLinecap="round" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeLinecap="round" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function AngleIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 20h18M3 20V4M3 20l14-14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BulbIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.6-1.4 4.9-3.5 6.2V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.8A7 7 0 0 1 5 9a7 7 0 0 1 7-7z" />
    </svg>
  );
}
function DropletIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
function PlugIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" strokeLinecap="round" />
      <line x1="10" y1="1" x2="10" y2="4" strokeLinecap="round" />
    </svg>
  );
}
function AwardIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}
function StockIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
function PriceIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
    </svg>
  );
}
function DotIcon() {
  return (
    <svg className="h-[6px] w-[6px]" viewBox="0 0 6 6" fill="currentColor">
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
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="flex min-h-full justify-end">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-250" enterFrom="translate-x-full" enterTo="translate-x-0"
              leave="ease-in duration-200" leaveFrom="translate-x-0" leaveTo="translate-x-full"
            >
              <Dialog.Panel className="flex h-screen w-full max-w-[380px] flex-col bg-white">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] px-[16px] py-[13px]">
                  <Dialog.Title className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#111]">
                    Filters
                  </Dialog.Title>
                  <button type="button" onClick={props.onClose} className="text-[20px] leading-none text-[#6b7280] hover:text-[#111]">×</button>
                </div>
                <div className="flex-1 overflow-auto">
                  <MobileFilterBody {...props} />
                </div>
                <div className="border-t border-[#e5e5e5] p-[12px]">
                  <button
                    type="button"
                    onClick={props.onClose}
                    className="h-[42px] w-full bg-[#111] text-[11px] font-bold uppercase tracking-[0.14em] text-white"
                  >
                    Show results
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

function MobileFilterBody({ filters, visibleFilterOptions, updateMultiFilter, updateRangeFilter, clearFilters, setInStock }) {
  const sections = useMemo(
    () => VISIBLE_FILTERS.map((f) => {
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

  return (
    <div className="divide-y divide-[#f0f0f0]">
      {/* In Stock */}
      <div className="flex items-center justify-between px-[16px] py-[13px]">
        <span className="text-[12px] font-semibold text-[#111]">In Stock Only</span>
        <Toggle checked={filters.in_stock} onChange={(v) => setInStock(v)} />
      </div>
      {/* Price */}
      <div className="px-[16px] py-[13px]">
        <p className="mb-[8px] text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6b7280]">Price (AED)</p>
        <div className="flex items-center gap-[8px]">
          <input type="number" placeholder="Min" value={filters.rate_range?.min || ""} onChange={(e) => updateRangeFilter("rate_range", "min", e.target.value)} className="h-[34px] flex-1 border border-[#e5e5e5] px-[10px] text-[12px] text-[#111] outline-none focus:border-[#111]" />
          <span className="text-[11px] text-[#9ca3af]">–</span>
          <input type="number" placeholder="Max" value={filters.rate_range?.max || ""} onChange={(e) => updateRangeFilter("rate_range", "max", e.target.value)} className="h-[34px] flex-1 border border-[#e5e5e5] px-[10px] text-[12px] text-[#111] outline-none focus:border-[#111]" />
        </div>
      </div>
      {/* Facets */}
      {sections.map((section, i) => (
        <FacetRow
          key={section.key}
          section={section}
          icon={ICONS[section.key] || <DotIcon />}
          selected={filters[section.key] || []}
          open={true}
          defaultOpen={i < 3}
          onChange={(values) => updateMultiFilter(section.key, values.map((v) => ({ value: v })))}
        />
      ))}
    </div>
  );
}
