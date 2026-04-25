import Select from "react-select";
import { V2_SORT_OPTIONS } from "@/libs/ighSearchV2";
import { PAGE_SIZE_OPTIONS } from "../constants";

const DAWN_SELECT_STYLES = {
  control: (base, state) => ({
    ...base,
    minHeight: 36,
    borderRadius: 0,
    borderColor: state.isFocused ? "#111" : "#e5e5e5",
    boxShadow: "none",
    backgroundColor: "white",
    fontSize: 12,
    "&:hover": { borderColor: "#111" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, color: "#111", padding: 6 }),
  menu: (base) => ({
    ...base,
    borderRadius: 0,
    border: "1px solid #111",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    marginTop: 2,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: 12,
    color: "#111",
    backgroundColor: state.isSelected ? "#111" : state.isFocused ? "#fafafa" : "white",
    ":active": { backgroundColor: "#fafafa" },
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
    <div className="flex flex-wrap items-center justify-between gap-[12px] border-b border-[#e5e5e5] bg-white py-[14px]">
      <div className="flex items-center gap-[14px]">
        <p className="text-[14px] font-semibold text-[#111]">
          {loading ? "Loading…" : `${found.toLocaleString()} products`}
        </p>
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className="inline-flex items-center gap-[6px] border border-[#111] bg-white px-[12px] py-[7px] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#111] lg:hidden"
        >
          <FilterIcon /> Filters
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-[10px]">
        {isSystemManager && (
          <label className="inline-flex items-center gap-[6px] text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(event) => onIncludeInactiveChange(event.target.checked)}
              className="h-[14px] w-[14px] accent-[#111]"
            />
            Include inactive
          </label>
        )}

        {diagnosticsEnabled && (
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className="border border-[#e5e5e5] bg-white px-[10px] py-[7px] text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b7280] hover:border-[#111] hover:text-[#111]"
          >
            Diagnostics
          </button>
        )}

        <DensityToggle value={density} onChange={onDensityChange} />

        <div className="flex items-center gap-[6px]">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
            Show
          </span>
          <select
            value={pageLength}
            onChange={(event) => onPageLengthChange(Number(event.target.value))}
            className="h-[36px] border border-[#e5e5e5] bg-white px-[8px] text-[12px] text-[#111] outline-none focus:border-[#111]"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-[6px]">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
            Sort
          </span>
          <div className="min-w-[200px]">
            <Select
              classNamePrefix="v2-sort"
              options={V2_SORT_OPTIONS}
              value={sortOption}
              onChange={(option) => onSortChange(option?.value || "")}
              styles={DAWN_SELECT_STYLES}
              isSearchable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DensityToggle({ value, onChange }) {
  const options = [
    { key: "comfortable", label: "5", cols: "5 col" },
    { key: "compact", label: "6", cols: "6 col" },
  ];
  return (
    <div className="hidden items-center border border-[#e5e5e5] md:inline-flex" role="group" aria-label="Grid density">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          aria-pressed={value === option.key}
          title={option.cols}
          className={`h-[36px] w-[36px] text-[12px] font-semibold transition ${
            value === option.key ? "bg-[#111] text-white" : "bg-white text-[#6b7280] hover:text-[#111]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

export { DAWN_SELECT_STYLES };
