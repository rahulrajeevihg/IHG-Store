import { getActiveFilterChips } from "../utils/format";

const CHIP_ACCENT = {
  query:                    "#3b82f6",
  in_stock:                 "#10b981",
  show_promotion:           "#ef4444",
  brand:                    "#8b5cf6",
  item_group:               "#14b8a6",
  category_list:            "#f59e0b",
  series:                   "#0f766e",
  rate_range:               "#059669",
  stock_range:              "#0ea5e9",
  product_type:             "#ec4899",
  power:                    "#f59e0b",
  power_value_range:        "#f59e0b",
  color_temp:               "#a78bfa",
  color_temp_kelvin_range:  "#a78bfa",
  ip_rate:                  "#6366f1",
  ip_rating_numeric_range:  "#6366f1",
  product_star_rating_range:"#f59e0b",
  customer_count_range:     "#0ea5e9",
  is_manufactured_item:     "#4f46e5",
  mounting:                 "#78716c",
  beam_angle:               "#10b981",
  lamp_type:                "#f97316",
  body_finish:              "#d946ef",
  material:                 "#64748b",
  input_voltage:            "#0284c7",
  warranty:                 "#7c3aed",
};

export default function ActiveFiltersSummary({
  filters,
  query,
  chips: providedChips,
  readOnly = false,
  onClearFilter,
  onClearAll,
  debugMode = false,
}) {
  const chips = Array.isArray(providedChips)
    ? providedChips
    : getActiveFilterChips(filters, query, debugMode);

  if (!chips.length) return null;

  return (
    <>
      <style>{`
        @keyframes chipSlideIn {
          from { opacity: 0; transform: translateY(-3px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .filter-chip { animation: chipSlideIn 140ms ease-out both; }
      `}</style>

      <div className="flex flex-wrap items-center gap-[6px] py-[8px]">
        {chips.map((chip) => {
          const accent = CHIP_ACCENT[chip.key] || "#6b7280";
          const chipKey = chip.id || `${chip.key}-${chip.value}`;

          return readOnly ? (
            <span
              key={chipKey}
              className="filter-chip inline-flex h-[32px] items-center overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <span className="h-full w-[3px] shrink-0" style={{ backgroundColor: accent }} />
              <span
                className="pl-2.5 pr-1 text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: accent }}
              >
                {chip.label}
              </span>
              <span className="pr-3 text-[11px] text-[#374151]">{chip.value}</span>
            </span>
          ) : (
            <button
              key={chipKey}
              type="button"
              onClick={() =>
                onClearFilter(
                  chip.key,
                  chip.key === "in_stock" || chip.clearAll ? null : chip.value
                )
              }
              className="filter-chip group inline-flex h-[32px] items-center overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:border-[#111] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
            >
              <span
                className="h-full w-[3px] shrink-0 transition-[width] duration-150 group-hover:w-[4px]"
                style={{ backgroundColor: accent }}
              />
              <span
                className="pl-2.5 pr-1 text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: accent }}
              >
                {chip.label}
              </span>
              <span className="text-[11px] text-[#374151]">{chip.value}</span>
              <span className="px-2.5 text-[15px] leading-none text-[#c8cdd5] transition-colors group-hover:text-[#111]">
                ×
              </span>
            </button>
          );
        })}

        {onClearAll && (readOnly || chips.length > 1) && (
          <button
            type="button"
            onClick={onClearAll}
            className="filter-chip inline-flex h-[32px] items-center gap-1 rounded-lg border border-[#fecaca] bg-[#fff5f5] px-3 text-[11px] font-semibold text-[#dc2626] transition-all duration-150 hover:border-[#dc2626] hover:bg-[#fee2e2]"
          >
            <span className="text-[15px] leading-none">×</span>
            Clear all
          </button>
        )}
      </div>
    </>
  );
}
