import { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { VISIBLE_FILTERS } from "../constants";
import FilterOptionsModal from "./FilterOptionsModal";
import { formatRangeValue, isMeaningfulRange } from "../utils/format";

/* ─── icons (refined) ─────────────────────────────────────────── */
const ICONS = {
  brand:         <TagIcon />,
  item_group:    <GridIcon />,
  category_list: <GridIcon />,
  product_type:  <BoxIcon />,
  power:         <BoltIcon />,
  color_temp:    <SunIcon />,
  ip_rate:       <ShieldIcon />,
  lumen_output:  <LumenIcon />,
  mounting:      <PinIcon />,
  beam_angle:    <AngleIcon />,
  lamp_type:     <BulbIcon />,
  body_finish:   <DropletIcon />,
  material:      <LayersIcon />,
  input_voltage: <PlugIcon />,
  output_current:<PlugIcon />,
  output_voltage:<PlugIcon />,
  warranty:      <AwardIcon />,
  is_manufactured_item: <FactoryIcon />,
};

const COMPACT_RANGE_LIKE_FACET_KEYS = new Set([
  "lumen_output",
  "input_voltage",
  "output_current",
  "output_voltage",
]);

/* ─── main component ────────────────────────────────────────────── */
export default function FilterPanel({
  filters,
  visibleFilterOptions,
  updateMultiFilter,
  updateRangeFilter,
  clearFilters,
  setInStock,
  setShowPromotion,
  setManufacturedOnly,
}) {
  const open = true;

  const sections = useMemo(
    () =>
      VISIBLE_FILTERS
        .filter(
          (filter) =>
            ![
              "power",
              "color_temp",
              "lumen_output",
              "input_voltage",
              "output_current",
              "output_voltage",
              "is_manufactured_item",
            ].includes(filter.key)
        )
        .map((f) => {
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

  const totalActive = useMemo(
    () =>
      Object.entries(filters || {}).reduce((count, [key, value]) => {
        if (Array.isArray(value)) {
          if (!value.length) {
            return count;
          }
          return count + (COMPACT_RANGE_LIKE_FACET_KEYS.has(key) ? 1 : value.length);
        }
        if (typeof value === "boolean") {
          return count + (value ? 1 : 0);
        }
        if (key.endsWith("_range") && isMeaningfulRange(value)) {
          return count + 1;
        }
        return count;
      }, 0),
    [filters]
  );

  const powerSliderBounds = useMemo(
    () => buildPowerSliderBounds(visibleFilterOptions.power || []),
    [visibleFilterOptions.power]
  );

  const colorTemperatureSliderBounds = useMemo(
    () => buildKelvinSliderBounds(visibleFilterOptions.color_temp || []),
    [visibleFilterOptions.color_temp]
  );

  const lumenOutputSliderBounds = useMemo(
    () => buildGenericNumericBounds(visibleFilterOptions.lumen_output || [], { min: 100, max: 10000, step: 50 }, "lumen_output"),
    [visibleFilterOptions.lumen_output]
  );

  const inputVoltageSliderBounds = useMemo(
    () => buildGenericNumericBounds(visibleFilterOptions.input_voltage || [], { min: 1, max: 480, step: 1 }, "input_voltage"),
    [visibleFilterOptions.input_voltage]
  );

  const outputCurrentSliderBounds = useMemo(
    () => buildGenericNumericBounds(visibleFilterOptions.output_current || [], { min: 10, max: 5000, step: 10 }, "output_current"),
    [visibleFilterOptions.output_current]
  );

  const outputVoltageSliderBounds = useMemo(
    () => buildGenericNumericBounds(visibleFilterOptions.output_voltage || [], { min: 1, max: 480, step: 1 }, "output_voltage"),
    [visibleFilterOptions.output_voltage]
  );

  const groupedSections = useMemo(() => {
    const preliminaryOrder = [
      "brand",
      "category_list",
      "series",
      "item_group",
      "product_type",
    ];
    const specificationPreferredOrder = [
      "ip_rate",
      "mounting",
      "beam_angle",
      "lamp_type",
      "body_finish",
      "material",
      "warranty",
    ];

    const sectionMap = new Map(sections.map((section) => [section.key, section]));
    const preliminary = preliminaryOrder
      .map((key) => sectionMap.get(key))
      .filter(Boolean);

    const usedKeys = new Set(preliminary.map((section) => section.key));
    const specificationOrdered = specificationPreferredOrder
      .map((key) => sectionMap.get(key))
      .filter(Boolean);
    specificationOrdered.forEach((section) => usedKeys.add(section.key));

    const specificationRemaining = sections.filter((section) => !usedKeys.has(section.key));

    return {
      preliminary,
      specification: [...specificationOrdered, ...specificationRemaining],
    };
  }, [sections]);

  return (
    <div data-tour="filter-panel" className="w-full h-full flex flex-col bg-[#fcfdff] overflow-hidden">
      {/* ── HEADER ── */}
      <div data-tour="filter-panel-header" className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-[#eef0f3] bg-[#fcfdff] px-4 shrink-0">
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
            data-tour="filter-panel-clear-all"
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
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-thumb-[#d7dde7]"
        style={{ maxHeight: "calc(100vh - 180px)" }}
      >
        <div className="p-[14px_16px] space-y-3">
          {/* IN STOCK toggle */}
          <div data-tour="filter-instock-toggle" className="px-2 py-3 flex items-center justify-between rounded-xl border border-[#edf1f5] bg-white">
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

          {/* PROMO toggle */}
          <div data-tour="filter-promo-toggle" className="px-2 py-3 flex items-center justify-between rounded-xl border border-[#edf1f5] bg-white">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${filters.show_promotion ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400"}`}>
                <PercentIcon />
              </div>
              <span className="text-[13px] font-semibold text-gray-700">Promo Only</span>
            </div>
            <Toggle
              checked={Boolean(filters.show_promotion)}
              onChange={(v) => setShowPromotion(v)}
            />
          </div>

          {/* MANUFACTURED toggle */}
          <div data-tour="filter-manufactured-toggle" className="px-2 py-3 flex items-center justify-between rounded-xl border border-[#edf1f5] bg-white">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${(filters.is_manufactured_item || []).includes("1") ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400"}`}>
                <FactoryIcon />
              </div>
              <span className="text-[13px] font-semibold text-gray-700">Manufactured</span>
            </div>
            <Toggle
              checked={(filters.is_manufactured_item || []).includes("1")}
              onChange={(v) => setManufacturedOnly(v)}
            />
          </div>

          {/* PRICE range */}
          <FilterSection
            dataTour="filter-price-range"
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

          {/* STOCK range */}
          <FilterSection
            dataTour="filter-stock-range"
            label="Stock Range"
            icon={<StockIcon />}
            active={!!(filters.stock_range?.min || filters.stock_range?.max)}
          >
            <div className="flex items-center gap-2 mt-1">
              <div className="relative flex-1 group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 group-focus-within:text-red-600 transition-colors">QTY</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.stock_range?.min || ""}
                  onChange={(e) => updateRangeFilter("stock_range", "min", e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-100 bg-gray-50/50 pl-11 pr-3 text-[12px] text-gray-900 outline-none focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/5 transition-all"
                />
              </div>
              <div className="h-[1px] w-3 bg-gray-200" />
              <div className="relative flex-1 group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 group-focus-within:text-red-600 transition-colors">QTY</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.stock_range?.max || ""}
                  onChange={(e) => updateRangeFilter("stock_range", "max", e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-100 bg-gray-50/50 pl-11 pr-3 text-[12px] text-gray-900 outline-none focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/5 transition-all"
                />
              </div>
            </div>
          </FilterSection>

          <FilterGroup title="Preliminary Filters" sections={groupedSections.preliminary} filters={filters} updateMultiFilter={updateMultiFilter} />

          <PowerRangeSection
            dataTour="filter-power-slider"
            bounds={powerSliderBounds}
            value={filters.power_value_range}
            active={isMeaningfulRange(filters.power_value_range) || (filters.power || []).length > 0}
            rawValueCount={(filters.power || []).length}
            onChange={(nextRange) => {
              if ((filters.power || []).length > 0) {
                updateMultiFilter("power", []);
              }
              updateRangeFilter("power_value_range", "min", nextRange.min);
              updateRangeFilter("power_value_range", "max", nextRange.max);
            }}
            onClear={() => {
              if ((filters.power || []).length > 0) {
                updateMultiFilter("power", []);
              }
              updateRangeFilter("power_value_range", "min", "");
              updateRangeFilter("power_value_range", "max", "");
            }}
          />

          <ColorTemperatureRangeSection
            dataTour="filter-color-temp-slider"
            bounds={colorTemperatureSliderBounds}
            value={filters.color_temp_kelvin_range}
            active={isMeaningfulRange(filters.color_temp_kelvin_range) || (filters.color_temp || []).length > 0}
            rawValueCount={(filters.color_temp || []).length}
            onChange={(nextRange) => {
              if ((filters.color_temp || []).length > 0) {
                updateMultiFilter("color_temp", []);
              }
              updateRangeFilter("color_temp_kelvin_range", "min", nextRange.min);
              updateRangeFilter("color_temp_kelvin_range", "max", nextRange.max);
            }}
            onClear={() => {
              if ((filters.color_temp || []).length > 0) {
                updateMultiFilter("color_temp", []);
              }
              updateRangeFilter("color_temp_kelvin_range", "min", "");
              updateRangeFilter("color_temp_kelvin_range", "max", "");
            }}
          />

          <NumericFacetRangeSection
            title="Lumen Output"
            unit="lm"
            facetKey="lumen_output"
            icon={ICONS.lumen_output}
            bounds={lumenOutputSliderBounds}
            options={visibleFilterOptions.lumen_output || []}
            selectedValues={filters.lumen_output || []}
            onChange={(values) =>
              updateMultiFilter("lumen_output", values.map((value) => ({ value })))
            }
          />

          <NumericFacetRangeSection
            title="Input"
            unit="V"
            facetKey="input_voltage"
            icon={ICONS.input_voltage}
            bounds={inputVoltageSliderBounds}
            options={visibleFilterOptions.input_voltage || []}
            selectedValues={filters.input_voltage || []}
            onChange={(values) =>
              updateMultiFilter("input_voltage", values.map((value) => ({ value })))
            }
          />

          <NumericFacetRangeSection
            title="Output Current"
            unit="mA"
            facetKey="output_current"
            icon={ICONS.output_current}
            bounds={outputCurrentSliderBounds}
            options={visibleFilterOptions.output_current || []}
            selectedValues={filters.output_current || []}
            onChange={(values) =>
              updateMultiFilter("output_current", values.map((value) => ({ value })))
            }
          />

          <NumericFacetRangeSection
            title="Output Voltage"
            unit="V"
            facetKey="output_voltage"
            icon={ICONS.output_voltage}
            bounds={outputVoltageSliderBounds}
            options={visibleFilterOptions.output_voltage || []}
            selectedValues={filters.output_voltage || []}
            onChange={(values) =>
              updateMultiFilter("output_voltage", values.map((value) => ({ value })))
            }
          />

          {/* FACET sections grouped */}
          <FilterGroup title="Specification Filters" sections={groupedSections.specification} filters={filters} updateMultiFilter={updateMultiFilter} />

          <FilterSection
            dataTour="filter-happy-customers"
            label="Happy Customers"
            icon={<UsersIcon />}
            active={!!(filters.customer_count_range?.min || filters.customer_count_range?.max)}
          >
            <div className="mt-1 flex flex-wrap gap-2">
              {[
                { key: "below_50", label: "Below 50", min: "", max: "49" },
                { key: "50_100", label: "50 to 100", min: "50", max: "100" },
                { key: "100_250", label: "100 to 250", min: "100", max: "250" },
                { key: "250_500", label: "250 to 500", min: "250", max: "500" },
                { key: "above_500", label: "Above 500", min: "500", max: "" },
              ].map((bucket) => {
                const activeBucket =
                  String(filters.customer_count_range?.min || "") === bucket.min &&
                  String(filters.customer_count_range?.max || "") === bucket.max;

                return (
                  <button
                    key={bucket.key}
                    type="button"
                    onClick={() => {
                      if (activeBucket) {
                        updateRangeFilter("customer_count_range", "min", "");
                        updateRangeFilter("customer_count_range", "max", "");
                        return;
                      }
                      updateRangeFilter("customer_count_range", "min", bucket.min);
                      updateRangeFilter("customer_count_range", "max", bucket.max);
                    }}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                      activeBucket
                        ? "border-red-600 bg-red-50 text-red-600"
                        : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#111]"
                    }`}
                  >
                    {bucket.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          <FilterSection
            dataTour="filter-star-rating"
            label="Star Rating"
            icon={<StarIcon />}
            active={!!(filters.product_star_rating_range?.min || filters.product_star_rating_range?.max)}
          >
            <div className="mt-1 flex flex-wrap gap-2">
              {["3.5", "4.0", "4.5", "5.0"].map((rating) => {
                const activeRating =
                  String(filters.product_star_rating_range?.min || "") === rating &&
                  String(filters.product_star_rating_range?.max || "") === "";

                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => {
                      if (activeRating) {
                        updateRangeFilter("product_star_rating_range", "min", "");
                        updateRangeFilter("product_star_rating_range", "max", "");
                        return;
                      }
                      updateRangeFilter("product_star_rating_range", "min", rating);
                      updateRangeFilter("product_star_rating_range", "max", "");
                    }}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                      activeRating
                        ? "border-red-600 bg-red-50 text-red-600"
                        : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#111]"
                    }`}
                  >
                    {rating}+ ★
                  </button>
                );
              })}
            </div>
          </FilterSection>
        </div>
      </div>
    </div>
  );
}

function PowerRangeSection({ bounds, value, active, rawValueCount, onChange, onClear, dataTour }) {
  const [open, setOpen] = useState(false);
  const effectiveMin = bounds.min;
  const effectiveMax = bounds.max;
  const step = bounds.step;
  const minValue = clampRangeValue(value?.min, effectiveMin, effectiveMax, effectiveMin);
  const maxValue = clampRangeValue(value?.max, effectiveMin, effectiveMax, effectiveMax);
  const displayMin = value?.min === "" || value?.min === undefined ? effectiveMin : minValue;
  const displayMax = value?.max === "" || value?.max === undefined ? effectiveMax : maxValue;

  const setRange = (nextMin, nextMax) => {
    onChange({
      min:
        Number(nextMin) <= effectiveMin && Number(nextMax) >= effectiveMax
          ? ""
          : formatSliderNumber(nextMin),
      max:
        Number(nextMin) <= effectiveMin && Number(nextMax) >= effectiveMax
          ? ""
          : formatSliderNumber(nextMax),
    });
  };

  return (
    <div data-tour={dataTour} className="rounded-lg border border-transparent bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-[46px] w-full items-center justify-between px-2 group rounded-lg transition-colors ${open ? "bg-[#f6f8fb]" : "hover:bg-[#f8fafc]"}`}
      >
        <div className="flex items-center gap-3">
          <span className={`transition-colors ${active ? "text-red-600" : "text-gray-400 group-hover:text-gray-900"}`}>
            {ICONS.power}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#1f2937]">Power</span>
            {active && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                {formatRangeValue(
                  {
                    min: value?.min === "" ? effectiveMin : displayMin,
                    max: value?.max === "" ? effectiveMax : displayMax,
                  },
                  "power_value_range"
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(active || rawValueCount > 0) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-500 hover:bg-red-50"
            >
              Clear
            </button>
          )}
          <ChevronIcon rotated={open} />
        </div>
      </button>
      <div className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden px-2 pb-3">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <NumericInput
              label="Min"
              value={displayMin}
              min={effectiveMin}
              max={displayMax}
              step={step}
              unit="W"
              onChange={(nextValue) => setRange(nextValue, displayMax)}
            />
            <NumericInput
              label="Max"
              value={displayMax}
              min={displayMin}
              max={effectiveMax}
              step={step}
              unit="W"
              onChange={(nextValue) => setRange(displayMin, nextValue)}
            />
          </div>

          <div className="relative px-1 py-3">
            <div
              className="absolute left-1 right-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#e5e7eb]"
            />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#111]"
              style={{
                left: `${toPercent(displayMin, effectiveMin, effectiveMax)}%`,
                right: `${100 - toPercent(displayMax, effectiveMin, effectiveMax)}%`,
              }}
            />
            <input
              type="range"
              min={effectiveMin}
              max={effectiveMax}
              step={step}
              value={displayMin}
              onChange={(event) =>
                setRange(
                  Math.min(Number(event.target.value), displayMax),
                  displayMax
                )
              }
              className="absolute left-0 top-1/2 h-0 w-full -translate-y-1/2 bg-transparent z-[1]"
            />
            <input
              type="range"
              min={effectiveMin}
              max={effectiveMax}
              step={step}
              value={displayMax}
              onChange={(event) =>
                setRange(
                  displayMin,
                  Math.max(Number(event.target.value), displayMin)
                )
              }
              className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-transparent"
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-[#6b7280]">
            <span>{formatSliderNumber(effectiveMin)}W</span>
            <span>{formatSliderNumber(effectiveMax)}W</span>
          </div>

          {rawValueCount > 0 && (
            <p className="mt-3 text-[11px] leading-5 text-[#9ca3af]">
              This range overrides {rawValueCount} selected raw power value{rawValueCount > 1 ? "s" : ""}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NumericInput({ label, value, min, max, step, unit = "W", onChange }) {
  const [draft, setDraft] = useState(String(value ?? ""));

  useEffect(() => {
    setDraft(String(value ?? ""));
  }, [value]);

  const commitDraft = () => {
    const trimmed = String(draft).trim();
    if (!trimmed) {
      onChange(min);
      return;
    }

    const nextValue = Number(trimmed);
    if (!Number.isFinite(nextValue)) {
      setDraft(String(value ?? ""));
      return;
    }

    const clampedValue = Math.min(max, Math.max(min, nextValue));
    onChange(clampedValue);
  };

  return (
    <label className="group">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
        {label}
      </span>
      <div className="relative">
        <input
          type="number"
          value={draft}
          min={min}
          max={max}
          step={step}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitDraft();
              event.currentTarget.blur();
            }
          }}
          className="h-10 w-full rounded-lg border border-gray-100 bg-gray-50/50 pl-3 pr-10 text-[12px] text-gray-900 outline-none focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/5 transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#9ca3af]">
          {unit}
        </span>
      </div>
    </label>
  );
}

function NumericFacetRangeSection({ title, unit, facetKey, icon, bounds, options, selectedValues, onChange }) {
  const [open, setOpen] = useState(false);
  const parsedOptions = useMemo(
    () => parseNumericFacetOptions(options, facetKey),
    [options, facetKey]
  );
  const effectiveMin = bounds.min;
  const effectiveMax = bounds.max;
  const step = bounds.step;
  const [draftRange, setDraftRange] = useState({ min: effectiveMin, max: effectiveMax });

  useEffect(() => {
    setDraftRange((current) => {
      const nextMin = clampRangeValue(current.min, effectiveMin, effectiveMax, effectiveMin);
      const nextMax = clampRangeValue(current.max, effectiveMin, effectiveMax, effectiveMax);
      return { min: Math.min(nextMin, nextMax), max: Math.max(nextMin, nextMax) };
    });
  }, [effectiveMin, effectiveMax]);

  useEffect(() => {
    if ((selectedValues || []).length === 0) {
      setDraftRange({ min: effectiveMin, max: effectiveMax });
    }
  }, [selectedValues, effectiveMin, effectiveMax]);

  const displayMin = clampRangeValue(draftRange.min, effectiveMin, effectiveMax, effectiveMin);
  const displayMax = clampRangeValue(draftRange.max, effectiveMin, effectiveMax, effectiveMax);
  const active = (selectedValues || []).length > 0;

  const setRange = (nextMin, nextMax) => {
    const minValue = Math.min(Number(nextMin), Number(nextMax));
    const maxValue = Math.max(Number(nextMin), Number(nextMax));
    setDraftRange({ min: minValue, max: maxValue });
    const matchingValues = parsedOptions
      .filter((entry) => entry.min >= minValue && entry.max <= maxValue)
      .map((entry) => entry.value);
    onChange(matchingValues);
  };

  return (
    <div className="rounded-lg border border-transparent bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-[46px] w-full items-center justify-between px-2 group rounded-lg transition-colors ${open ? "bg-[#f6f8fb]" : "hover:bg-[#f8fafc]"}`}
      >
        <div className="flex items-center gap-3">
          <span className={`transition-colors ${active ? "text-red-600" : "text-gray-400 group-hover:text-gray-900"}`}>
            {icon}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#1f2937]">{title}</span>
            {active && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                {formatSliderNumber(displayMin)}-{formatSliderNumber(displayMax)}{unit}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {active && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setDraftRange({ min: effectiveMin, max: effectiveMax });
                onChange([]);
              }}
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-500 hover:bg-red-50"
            >
              Clear
            </button>
          )}
          <ChevronIcon rotated={open} />
        </div>
      </button>
      <div className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden px-2 pb-3">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <NumericInput
              label="Min"
              value={displayMin}
              min={effectiveMin}
              max={displayMax}
              step={step}
              unit={unit}
              onChange={(nextValue) => setRange(nextValue, displayMax)}
            />
            <NumericInput
              label="Max"
              value={displayMax}
              min={displayMin}
              max={effectiveMax}
              step={step}
              unit={unit}
              onChange={(nextValue) => setRange(displayMin, nextValue)}
            />
          </div>
          <div className="relative px-1 py-3">
            <div className="absolute left-1 right-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#e5e7eb]" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#111]"
              style={{
                left: `${toPercent(displayMin, effectiveMin, effectiveMax)}%`,
                right: `${100 - toPercent(displayMax, effectiveMin, effectiveMax)}%`,
              }}
            />
            <input
              type="range"
              min={effectiveMin}
              max={effectiveMax}
              step={step}
              value={displayMin}
              onChange={(event) => setRange(Math.min(Number(event.target.value), displayMax), displayMax)}
              className="absolute left-0 top-1/2 h-0 w-full -translate-y-1/2 bg-transparent z-[1]"
            />
            <input
              type="range"
              min={effectiveMin}
              max={effectiveMax}
              step={step}
              value={displayMax}
              onChange={(event) => setRange(displayMin, Math.max(Number(event.target.value), displayMin))}
              className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-transparent"
            />
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-[#6b7280]">
            <span>{formatSliderNumber(effectiveMin)}{unit}</span>
            <span>{formatSliderNumber(effectiveMax)}{unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorTemperatureRangeSection({ bounds, value, active, rawValueCount, onChange, onClear, dataTour }) {
  const [open, setOpen] = useState(false);
  const effectiveMin = bounds.min;
  const effectiveMax = bounds.max;
  const step = bounds.step;
  const minValue = clampRangeValue(value?.min, effectiveMin, effectiveMax, effectiveMin);
  const maxValue = clampRangeValue(value?.max, effectiveMin, effectiveMax, effectiveMax);
  const displayMin = value?.min === "" || value?.min === undefined ? effectiveMin : minValue;
  const displayMax = value?.max === "" || value?.max === undefined ? effectiveMax : maxValue;

  const setRange = (nextMin, nextMax) => {
    onChange({
      min:
        Number(nextMin) <= effectiveMin && Number(nextMax) >= effectiveMax
          ? ""
          : formatSliderNumber(nextMin),
      max:
        Number(nextMin) <= effectiveMin && Number(nextMax) >= effectiveMax
          ? ""
          : formatSliderNumber(nextMax),
    });
  };

  return (
    <div data-tour={dataTour} className="rounded-lg border border-transparent bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-[46px] w-full items-center justify-between px-2 group rounded-lg transition-colors ${open ? "bg-[#f6f8fb]" : "hover:bg-[#f8fafc]"}`}
      >
        <div className="flex items-center gap-3">
          <span className={`transition-colors ${active ? "text-red-600" : "text-gray-400 group-hover:text-gray-900"}`}>
            {ICONS.color_temp}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#1f2937]">Color Temperature</span>
            {active && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                {formatRangeValue(
                  {
                    min: value?.min === "" ? effectiveMin : displayMin,
                    max: value?.max === "" ? effectiveMax : displayMax,
                  },
                  "color_temp_kelvin_range"
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(active || rawValueCount > 0) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-500 hover:bg-red-50"
            >
              Clear
            </button>
          )}
          <ChevronIcon rotated={open} />
        </div>
      </button>
      <div className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden px-2 pb-3">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <NumericInput
              label="Min"
              value={displayMin}
              min={effectiveMin}
              max={displayMax}
              step={step}
              unit="K"
              onChange={(nextValue) => setRange(nextValue, displayMax)}
            />
            <NumericInput
              label="Max"
              value={displayMax}
              min={displayMin}
              max={effectiveMax}
              step={step}
              unit="K"
              onChange={(nextValue) => setRange(displayMin, nextValue)}
            />
          </div>

          <div className="relative px-1 py-3">
            <div className="absolute left-1 right-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#e5e7eb]" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#111]"
              style={{
                left: `${toPercent(displayMin, effectiveMin, effectiveMax)}%`,
                right: `${100 - toPercent(displayMax, effectiveMin, effectiveMax)}%`,
              }}
            />
            <input
              type="range"
              min={effectiveMin}
              max={effectiveMax}
              step={step}
              value={displayMin}
              onChange={(event) =>
                setRange(
                  Math.min(Number(event.target.value), displayMax),
                  displayMax
                )
              }
              className="absolute left-0 top-1/2 h-0 w-full -translate-y-1/2 bg-transparent z-[1]"
            />
            <input
              type="range"
              min={effectiveMin}
              max={effectiveMax}
              step={step}
              value={displayMax}
              onChange={(event) =>
                setRange(
                  displayMin,
                  Math.max(Number(event.target.value), displayMin)
                )
              }
              className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-transparent"
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-[#6b7280]">
            <span>{formatSliderNumber(effectiveMin)}K</span>
            <span>{formatSliderNumber(effectiveMax)}K</span>
          </div>

          {rawValueCount > 0 && (
            <p className="mt-3 text-[11px] leading-5 text-[#9ca3af]">
              This range overrides {rawValueCount} selected raw temperature value{rawValueCount > 1 ? "s" : ""}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function buildPowerSliderBounds(options = []) {
  const values = [];
  let hasDecimals = false;

  for (const option of options) {
    const rawValue = String(option?.value || option?.label || "").trim().toUpperCase();
    if (!rawValue || rawValue.includes("/M") || rawValue.includes("METER")) {
      continue;
    }

    const numbers = rawValue.match(/\d+(?:\.\d+)?/g) || [];
    if (!numbers.length || !rawValue.includes("W")) {
      continue;
    }

    numbers.forEach((entry) => {
      const numericValue = Number(entry);
      if (!Number.isFinite(numericValue)) {
        return;
      }
      if (!Number.isInteger(numericValue)) {
        hasDecimals = true;
      }
      values.push(numericValue);
    });
  }

  if (!values.length) {
    return { min: 0, max: 100, step: 1 };
  }

  const min = Math.floor(Math.min(...values));
  const max = Math.ceil(Math.max(...values));
  return {
    min,
    max: Math.max(max, min + 1),
    step: hasDecimals ? 0.1 : 1,
  };
}

function buildKelvinSliderBounds(options = []) {
  const values = [];

  for (const option of options) {
    const rawValue = String(option?.value || option?.label || "").trim().toUpperCase();
    const match = rawValue.match(/(\d{3,5})\s*K\b/);
    if (!match) {
      continue;
    }

    const numericValue = Number(match[1]);
    if (Number.isFinite(numericValue)) {
      values.push(numericValue);
    }
  }

  if (!values.length) {
    return { min: 2000, max: 6500, step: 100 };
  }

  const min = Math.floor(Math.min(...values) / 100) * 100;
  const max = Math.ceil(Math.max(...values) / 100) * 100;
  return {
    min,
    max: Math.max(max, min + 100),
    step: 100,
  };
}

function buildGenericNumericBounds(options = [], fallback = { min: 0, max: 100, step: 1 }, facetKey = "") {
  const values = parseNumericFacetOptions(options, facetKey).flatMap((entry) => [entry.min, entry.max]);

  if (!values.length) {
    return fallback;
  }

  const min = Math.floor(Math.min(...values));
  const max = Math.ceil(Math.max(...values));
  const hasDecimals = values.some((value) => !Number.isInteger(value));

  return {
    min,
    max: Math.max(max, min + 1),
    step: hasDecimals ? 0.1 : fallback.step || 1,
  };
}

function extractFacetRange(rawValue = "", facetKey = "") {
  const raw = String(rawValue || "").toUpperCase().replace(/,/g, "");
  const hasCompositeSeparator = /[\/,]/.test(raw);
  const readMatches = (regex, mapper = (value) => value) => {
    const values = [];
    let match = regex.exec(raw);
    while (match) {
      const numericValue = mapper(Number(match[1]), match[2]);
      if (Number.isFinite(numericValue)) {
        values.push(numericValue);
      }
      match = regex.exec(raw);
    }
    return values;
  };

  if (facetKey === "lumen_output") {
    // Ignore mixed units like lm/W, lm/m, comma-separated RGB parts, etc.
    if (hasCompositeSeparator || /\bLM\s*\//.test(raw) || /\bX\s*\d+\s*LM/.test(raw)) {
      return null;
    }
    const values = readMatches(/(\d+(?:\.\d+)?)\s*LM(?!\s*\/)/g);
    if (values.length > 0) {
      return { min: Math.min(...values), max: Math.max(...values), numbers: values };
    }
  }

  if (facetKey === "input_voltage" || facetKey === "output_voltage") {
    // Keep voltage-only forms; skip combined descriptors like mA/VDC.
    if (hasCompositeSeparator || /MA\b/.test(raw)) {
      return null;
    }
    const values = readMatches(/(\d+(?:\.\d+)?)\s*V\b/g);
    if (values.length > 0) {
      return { min: Math.min(...values), max: Math.max(...values), numbers: values };
    }
  }

  if (facetKey === "output_current") {
    // Keep current-only forms; skip combined descriptors like mA/VDC.
    if (hasCompositeSeparator || /V(?:AC|DC)?\b/.test(raw)) {
      return null;
    }
    const values = readMatches(/(\d+(?:\.\d+)?)\s*(MA|A)\b/g, (value, unit) =>
      unit === "A" ? value * 1000 : value
    );
    if (values.length > 0) {
      return { min: Math.min(...values), max: Math.max(...values), numbers: values };
    }
  }

  const fallbackValues = (raw.match(/\d+(?:\.\d+)?/g) || [])
    .map(Number)
    .filter((entry) => Number.isFinite(entry));
  if (!fallbackValues.length) {
    return null;
  }
  return {
    min: Math.min(...fallbackValues),
    max: Math.max(...fallbackValues),
    numbers: fallbackValues,
  };
}

function parseNumericFacetOptions(options = [], facetKey = "") {
  return (Array.isArray(options) ? options : [])
    .map((option) => {
      const value = String(option?.value || "").trim();
      const label = String(option?.label || value).trim();
      const cleanedLabel = label.replace(/\(\d+\)\s*$/, "").trim();
      const extracted = extractFacetRange(value || cleanedLabel, facetKey);
      if (!extracted) {
        return null;
      }

      return {
        value,
        label,
        numbers: extracted.numbers,
        min: extracted.min,
        max: extracted.max,
      };
    })
    .filter((entry) => entry && entry.value && entry.numbers.length > 0);
}

function clampRangeValue(value, min, max, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, numericValue));
}

function formatSliderNumber(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return "";
  }
  return String(Number(numericValue.toFixed(2)));
}

function toPercent(value, min, max) {
  if (max <= min) {
    return 0;
  }
  return ((value - min) / (max - min)) * 100;
}

function FilterGroup({ title, sections, filters, updateMultiFilter }) {
  if (!sections?.length) return null;
  return (
    <div className="rounded-xl border border-[#edf1f5] bg-white p-2">
      <div className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
        {title}
      </div>
      {sections.map((section, i) => (
        <FacetSection
          key={section.key}
          section={section}
          icon={ICONS[section.key] || <DotIcon />}
          selected={filters[section.key] || []}
          defaultOpen={false}
          onChange={(values) =>
            updateMultiFilter(section.key, values.map((v) => ({ value: v })))
          }
        />
      ))}
    </div>
  );
}

/* ─── FilterSection ─────────────────────────────────────────────── */
function FilterSection({ label, icon, active, children, dataTour }) {
  const [open, setOpen] = useState(false);

  return (
    <div data-tour={dataTour} className="rounded-lg border border-transparent bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-[46px] w-full items-center justify-between px-2 group rounded-lg transition-colors ${open ? "bg-[#f6f8fb]" : "hover:bg-[#f8fafc]"}`}
      >
        <div className="flex items-center gap-3">
          <span className={`transition-colors ${active ? "text-red-600" : "text-gray-400 group-hover:text-gray-900"}`}>
            {icon}
          </span>
          <span className="text-[13px] font-semibold text-[#1f2937]">
            {label}
          </span>
        </div>
        <ChevronIcon rotated={open} />
      </button>
      <div className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden px-2">{children}</div>
      </div>
    </div>
  );
}

/* ─── FacetSection ──────────────────────────────────────────────── */
function FacetSection({ section, icon, selected, defaultOpen, onChange }) {
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);

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

  const isBrandSection = section.key === "brand";
  const isCategorySection = section.key === "category_list";
  const isItemGroupSection = section.key === "item_group";
  const usesLargeOptionsModal = isBrandSection || isCategorySection || isItemGroupSection;
  const dataTour = isBrandSection
    ? "filter-brand-facet"
    : isItemGroupSection
      ? "filter-item-group-facet"
      : isCategorySection
        ? "filter-category-facet"
        : undefined;

  return (
    <div data-tour={dataTour} className="pb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-[46px] w-full items-center justify-between px-2 group rounded-lg transition-colors ${open ? "bg-[#f6f8fb]" : "hover:bg-[#f8fafc]"}`}
      >
        <div className="flex items-center gap-3">
          <span className={`transition-colors ${section.selectedCount > 0 ? "text-red-600" : "text-gray-400 group-hover:text-gray-900"}`}>
            {icon}
          </span>
          <span className="text-[13px] font-semibold text-[#1f2937]">
            {section.label}
          </span>
          {section.selectedCount > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-50 px-1.5 text-[10px] font-bold text-red-600">
              {section.selectedCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {section.selectedCount > 0 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange([]);
              }}
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-500 hover:bg-red-50"
            >
              Clear
            </button>
          )}
          <ChevronIcon rotated={open} />
        </div>
      </button>

      <div className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden px-2 pb-3">
          {(usesLargeOptionsModal || parsed.length > 6) && (
            <div className="relative mb-3 group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${section.label.toLowerCase()}...`}
                className="h-7 w-full rounded-lg border border-[#e6eaf0] bg-[#f9fafb] pl-8 pr-8 text-[12px] text-gray-900 placeholder:text-[#9ca3af] outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10 transition-all"
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

          <div className="space-y-1 max-h-60 overflow-y-auto pr-1 scroll-smooth scrollbar-thin scrollbar-thumb-[#dbe2ea]">
            {visible.length === 0 && (
              <p className="py-2 text-[12px] text-gray-400 text-center italic">No results found</p>
            )}
            {visible.map((item) => {
              const checked = selected.includes(item.value);
              return (
                <button
                  key={item.value}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggle(item.value)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 text-left text-[12px] transition-all hover:bg-gray-50 ${
                    checked ? "font-semibold text-[#b42318] bg-red-50/50" : "text-gray-600"
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
                </button>
              );
            })}
          </div>

          {!search && (usesLargeOptionsModal ? filtered.length > 0 : filtered.length > 6) && (
            usesLargeOptionsModal ? (
              <button
                data-tour="filter-show-all-button"
                type="button"
                onClick={() => setOptionsModalOpen(true)}
                className="mt-2 w-full text-center text-[11px] font-bold text-gray-400 hover:text-red-600 py-1.5 rounded-lg hover:bg-red-50/50 transition-all"
              >
                SHOW ALL ({filtered.length})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="mt-2 w-full text-center text-[11px] font-bold text-gray-400 hover:text-red-600 py-1.5 rounded-lg hover:bg-red-50/50 transition-all"
              >
                {showAll ? "SHOW LESS" : `SHOW ALL (${filtered.length})`}
              </button>
            )
          )}
        </div>
      </div>

      {usesLargeOptionsModal && (
        <FilterOptionsModal
          open={optionsModalOpen}
          title={isBrandSection ? "Select Brands" : "Select Categories"}
          subtitle={
            isBrandSection
              ? "Choose one or more brands to filter products"
              : "Choose one or more categories to filter products"
          }
          options={parsed.map((item) => ({
            label: item.name,
            value: item.value,
            count: item.count,
          }))}
          selectedValues={selected}
          onApply={(values) => onChange(values)}
          onClose={() => setOptionsModalOpen(false)}
        />
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
function LumenIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
      <circle cx="12" cy="12" r="4" />
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
function FactoryIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 20h20" />
      <path d="M4 20V9l5 3V9l5 3V7l5 3v10" />
      <path d="M8 20v-4h3v4" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.1 8.3 22 9.2 17 14.1 18.2 21 12 17.7 5.8 21 7 14.1 2 9.2 8.9 8.3 12 2" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
function PercentIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="7" cy="7" r="2" />
      <circle cx="17" cy="17" r="2" />
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
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="flex min-h-full justify-end">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="translate-x-full" enterTo="translate-x-0"
              leave="ease-in duration-250" leaveFrom="translate-x-0" leaveTo="translate-x-full"
            >
              <Dialog.Panel className="flex h-screen w-full max-w-[360px] flex-col bg-white shadow-2xl">
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
                <div className="sticky bottom-0 border-t border-gray-100 bg-white p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={props.clearFilters}
                      className="h-11 w-full rounded-lg border border-[#e5e7eb] bg-white text-[12px] font-semibold text-[#475467]"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={props.onClose}
                      className="h-11 w-full bg-red-600 text-[12px] font-bold text-white rounded-lg shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
