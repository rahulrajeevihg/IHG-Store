import Select from "react-select";
import { V2_SORT_OPTIONS } from "@/libs/ighSearchV2";
import { PAGE_SIZE_OPTIONS } from "../constants";

const DAWN_SELECT_STYLES = {
  control: (base, state) => ({
    ...base,
    minHeight: 32,
    height: 32,
    borderRadius: 8,
    borderColor: state.isFocused ? "#111" : "#e5e7eb",
    boxShadow: "none",
    backgroundColor: "white",
    fontSize: 12,
    cursor: "pointer",
    "&:hover": { borderColor: "#111" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 10px", height: 32 }),
  indicatorsContainer: (base) => ({ ...base, height: 32 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, color: "#6b7280", padding: "0 6px" }),
  menu: (base) => ({
    ...base,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    marginTop: 4,
    overflow: "hidden",
  }),
  option: (base, state) => ({
    ...base,
    fontSize: 12,
    color: state.isSelected ? "#fff" : "#111",
    backgroundColor: state.isSelected ? "#111" : state.isFocused ? "#f9fafb" : "white",
    cursor: "pointer",
    ":active": { backgroundColor: "#f3f4f6" },
  }),
  singleValue: (base) => ({ ...base, color: "#111" }),
};

export default function ResultsToolbar({
  loading,
  found,
  sortValue,
  onSortChange,
  pageLength,
  onPageLengthChange,
  density,
  onDensityChange,
  includeInactive,
  onIncludeInactiveChange,
  isSystemManager,
  diagnosticsEnabled,
  onOpenDiagnostics,
  onOpenMobileFilters,
}) {
  const sortOption =
    V2_SORT_OPTIONS.find((option) => option.value === sortValue) || V2_SORT_OPTIONS[0];

  return (
    <div className="mt-[10px] rounded-[16px] border border-[#e7edf3] bg-white px-[14px] py-[12px] shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-[10px] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-[10px]">
          <div className="flex items-center gap-[10px] rounded-[12px] border border-[#eef2f6] bg-[#f8fafc] px-[12px] py-[8px]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a94a3]">
              Results
            </span>
            <div className="flex items-baseline gap-1.5">
              {loading ? (
                <span className="inline-block h-4 w-20 animate-pulse rounded-md bg-gray-100" />
              ) : (
                <>
                  <span className="text-[16px] font-bold tracking-[-0.03em] text-[#111827]">
                    {found.toLocaleString()}
                  </span>
                  <span className="text-[12px] font-medium text-[#94a3b8]">products</span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#dbe3ec] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#374151] transition hover:border-[#111827] lg:hidden"
          >
            <FilterIcon /> Filters
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-[10px]">
          {isSystemManager && (
            <label className="inline-flex h-[36px] cursor-pointer items-center gap-2 rounded-[12px] border border-[#e5e7eb] px-3 text-[11px] font-semibold text-[#5f6b7a]">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(event) => onIncludeInactiveChange(event.target.checked)}
                className="h-3.5 w-3.5 accent-[#111]"
              />
              Inactive
            </label>
          )}

          {diagnosticsEnabled && (
            <button
              type="button"
              onClick={onOpenDiagnostics}
              className="h-[36px] rounded-[12px] border border-[#e5e7eb] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b7280] transition hover:border-[#111] hover:text-[#111]"
            >
              Diagnostics
            </button>
          )}

          <DensityToggle value={density} onChange={onDensityChange} />

          <div className="hidden h-7 w-px bg-[#e5e7eb] md:block" />

          <ControlCard label="Per page">
            <select
              value={pageLength}
              onChange={(event) => onPageLengthChange(Number(event.target.value))}
              className="h-[34px] appearance-none bg-transparent pl-1 pr-5 text-[12px] font-semibold text-[#111] outline-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 4px center",
                backgroundSize: "13px",
              }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </ControlCard>

          <div className="min-w-[190px]">
            <ControlCard label="Sort by">
              <Select
                classNamePrefix="v2-sort"
                instanceId="v2-sort-select"
                inputId="v2-sort-select-input"
                options={V2_SORT_OPTIONS}
                value={sortOption}
                onChange={(option) => onSortChange(option?.value || "")}
                styles={DAWN_SELECT_STYLES}
                isSearchable={false}
              />
            </ControlCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function DensityToggle({ value, onChange }) {
  return (
    <div className="hidden items-center rounded-lg border border-[#e5e7eb] md:inline-flex" role="group" aria-label="Grid density">
      <button
        type="button"
        onClick={() => onChange("comfortable")}
        aria-pressed={value === "comfortable"}
        title="Comfortable grid"
        className={`flex h-[32px] w-[32px] items-center justify-center rounded-l-[7px] transition ${
          value === "comfortable" ? "bg-[#111] text-white" : "text-[#9ca3af] hover:text-[#374151]"
        }`}
      >
        <GridComfortIcon />
      </button>
      <button
        type="button"
        onClick={() => onChange("compact")}
        aria-pressed={value === "compact"}
        title="Compact grid"
        className={`flex h-[32px] w-[32px] items-center justify-center rounded-r-[7px] transition ${
          value === "compact" ? "bg-[#111] text-white" : "text-[#9ca3af] hover:text-[#374151]"
        }`}
      >
        <GridCompactIcon />
      </button>
    </div>
  );
}

function GridComfortIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function GridCompactIcon() {
  return (
    <svg className="h-[13px] w-[13px]" viewBox="0 0 18 18" fill="currentColor">
      <rect x="1" y="1" width="4" height="4" rx="0.75" />
      <rect x="7" y="1" width="4" height="4" rx="0.75" />
      <rect x="13" y="1" width="4" height="4" rx="0.75" />
      <rect x="1" y="7" width="4" height="4" rx="0.75" />
      <rect x="7" y="7" width="4" height="4" rx="0.75" />
      <rect x="13" y="7" width="4" height="4" rx="0.75" />
      <rect x="1" y="13" width="4" height="4" rx="0.75" />
      <rect x="7" y="13" width="4" height="4" rx="0.75" />
      <rect x="13" y="13" width="4" height="4" rx="0.75" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

function ControlCard({ label, children }) {
  return (
    <div className="flex items-center gap-1 rounded-[12px] border border-[#e5e7eb] bg-white pl-2.5 pr-1 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#97a3b6]">
        {label}
      </span>
      {children}
    </div>
  );
}

export { DAWN_SELECT_STYLES };
