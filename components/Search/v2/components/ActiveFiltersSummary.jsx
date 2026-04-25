import { getActiveFilterChips } from "../utils/format";

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

  if (!chips.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-[6px] py-[12px]">
      {chips.map((chip) => (
        readOnly ? (
          <span
            key={chip.id || `${chip.key}-${chip.value}`}
            className="inline-flex items-center gap-[6px] border border-[#e5e5e5] bg-white px-[10px] py-[5px] text-[11px] font-medium text-[#111]"
          >
            <span className="text-[#6b7280]">{chip.label}:</span>
            <span>{chip.value}</span>
          </span>
        ) : (
          <button
            key={chip.id || `${chip.key}-${chip.value}`}
            type="button"
            onClick={() => onClearFilter(chip.key, chip.key === "in_stock" ? null : chip.value)}
            className="group inline-flex items-center gap-[6px] border border-[#e5e5e5] bg-white px-[10px] py-[5px] text-[11px] font-medium text-[#111] transition hover:border-[#111]"
          >
            <span className="text-[#6b7280] group-hover:text-[#111]">{chip.label}:</span>
            <span>{chip.value}</span>
            <span className="text-[13px] leading-none text-[#9ca3af] group-hover:text-[#111]">×</span>
          </button>
        )
      ))}
      {onClearAll && (readOnly || chips.length > 1) && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b7280] underline-offset-4 hover:text-[#111] hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
