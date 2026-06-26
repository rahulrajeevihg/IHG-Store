import { Fragment } from "react";
import Dirham from "@/components/Common/Dirham";
import { FILTER_LABEL_MAP } from "../constants";
import { DEFAULT_V2_STATE, V2_FILTER_KEYS } from "@/libs/ighSearchV2";

export const V2_DEFAULT_RANGE = {
  min: 0,
  max: 1000000000,
};

const COMPACT_NUMERIC_FACET_UNITS = {
  lumen_output: "lm",
  input_voltage: "V",
  output_current: "mA",
  output_voltage: "V",
};

function extractChipNumericValue(rawValue, key) {
  const raw = String(rawValue || "").toUpperCase().replace(/,/g, "");

  if (key === "lumen_output") {
    const match = raw.match(/(\d+(?:\.\d+)?)\s*LM(?!\s*\/)/);
    return match ? Number(match[1]) : NaN;
  }

  if (key === "input_voltage" || key === "output_voltage") {
    const match = raw.match(/(\d+(?:\.\d+)?)\s*V\b/);
    return match ? Number(match[1]) : NaN;
  }

  if (key === "output_current") {
    const match = raw.match(/(\d+(?:\.\d+)?)\s*(MA|A)\b/);
    if (!match) return NaN;
    const value = Number(match[1]);
    return match[2] === "A" ? value * 1000 : value;
  }

  const fallback = raw.match(/\d+(?:\.\d+)?/);
  return fallback ? Number(fallback[0]) : NaN;
}

export function looksLikeSku(value) {
  if (!value || typeof value !== "string") {
    return false;
  }

  const trimmedValue = value.trim();
  const compactCodePattern = /^[A-Za-z0-9._/-]+$/;
  const uppercaseAlphaCodePattern = /^[A-Z._/-]*[A-Z][A-Z._/-]*$/;

  if (!compactCodePattern.test(trimmedValue)) {
    return false;
  }

  return (
    /\d/.test(trimmedValue) ||
    (trimmedValue.length >= 3 && uppercaseAlphaCodePattern.test(trimmedValue))
  );
}

export function formatPrice(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  return (
    <Fragment>
      <Dirham /> {numeric.toFixed(2)}
    </Fragment>
  );
}

export function prettifyLabel(value) {
  return value
    .replace(/_range$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function isDefaultRange(value) {
  if (!value || typeof value !== "object") {
    return true;
  }

  const min = Number(value.min ?? V2_DEFAULT_RANGE.min);
  const max = Number(value.max ?? V2_DEFAULT_RANGE.max);

  return min === V2_DEFAULT_RANGE.min && max === V2_DEFAULT_RANGE.max;
}

export function isMeaningfulRange(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const hasBound = value.min !== "" || value.max !== "";
  if (!hasBound) {
    return false;
  }

  return !isDefaultRange(value);
}

function shouldHideDerivedChip(key, filters, debugMode = false) {
  if (debugMode) {
    return false;
  }

  if (key === "color_temp_kelvin_range" && (filters?.color_temp?.length || 0) > 0) {
    return true;
  }

  if (key === "ip_rating_numeric_range" && (filters?.ip_rate?.length || 0) > 0) {
    return true;
  }

  return false;
}

function formatNumericLabel(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return String(value);
  }

  return String(Number(numeric.toFixed(6)));
}

function formatPowerRangeValue(value) {
  const min = value?.min;
  const max = value?.max;
  const hasMin = min !== "" && min !== undefined;
  const hasMax = max !== "" && max !== undefined;

  if (!hasMin && !hasMax) {
    return "";
  }

  if (!hasMin && hasMax) {
    const maxNumber = Number(max);
    const nextInteger = Math.ceil(maxNumber);

    if (
      Number.isFinite(maxNumber) &&
      Number.isInteger(nextInteger) &&
      nextInteger > maxNumber &&
      nextInteger - maxNumber <= 0.01
    ) {
      return `Below ${nextInteger}W`;
    }

    return `Up to ${formatNumericLabel(max)}W`;
  }

  if (hasMin && !hasMax) {
    const minNumber = Number(min);
    const previousInteger = Math.floor(minNumber);

    if (
      Number.isFinite(minNumber) &&
      Number.isInteger(previousInteger) &&
      minNumber > previousInteger &&
      minNumber - previousInteger <= 0.01
    ) {
      return `Above ${previousInteger}W`;
    }

    return `At least ${formatNumericLabel(min)}W`;
  }

  return `${formatNumericLabel(min)}W-${formatNumericLabel(max)}W`;
}

function formatColorTemperatureRangeValue(value) {
  const min = value?.min;
  const max = value?.max;
  const hasMin = min !== "" && min !== undefined;
  const hasMax = max !== "" && max !== undefined;

  if (!hasMin && !hasMax) {
    return "";
  }

  if (!hasMin && hasMax) {
    return `Up to ${formatNumericLabel(max)}K`;
  }

  if (hasMin && !hasMax) {
    return `At least ${formatNumericLabel(min)}K`;
  }

  return `${formatNumericLabel(min)}K-${formatNumericLabel(max)}K`;
}

export function formatRangeValue(value, key = "") {
  if (key === "power_value_range") {
    return formatPowerRangeValue(value);
  }

  if (key === "color_temp_kelvin_range") {
    return formatColorTemperatureRangeValue(value);
  }

  const min = value?.min;
  const max = value?.max;
  return `${min !== "" && min !== undefined ? min : "0"}–${
    max !== "" && max !== undefined ? max : "max"
  }`;
}

export function getActiveFilterChips(filters, query, debugMode = false) {
  const chips = [];

  if (query && query.trim()) {
    chips.push({
      key: "query",
      value: query.trim(),
      label: "Search",
    });
  }

  Object.entries(filters || {}).forEach(([key, value]) => {
    if (shouldHideDerivedChip(key, filters, debugMode)) {
      return;
    }

    if (Array.isArray(value)) {
      if (!value.length) {
        return;
      }

      if (COMPACT_NUMERIC_FACET_UNITS[key]) {
        const numericValues = value
          .map((entry) => extractChipNumericValue(entry, key))
          .filter((entry) => Number.isFinite(entry));

        if (numericValues.length > 0) {
          const min = Math.min(...numericValues);
          const max = Math.max(...numericValues);
          const unit = COMPACT_NUMERIC_FACET_UNITS[key];
          chips.push({
            id: `${key}-range`,
            key,
            value: `${formatNumericLabel(min)}-${formatNumericLabel(max)}${unit}`,
            label: FILTER_LABEL_MAP[key] || prettifyLabel(key),
            clearAll: true,
          });
          return;
        }
      }

      value.forEach((entry) => {
        if (entry !== null && entry !== undefined && String(entry).trim() !== "") {
          chips.push({
            key,
            value: String(entry),
            label: FILTER_LABEL_MAP[key] || prettifyLabel(key),
          });
        }
      });
      return;
    }

    if (typeof value === "boolean") {
      if (value === true) {
        chips.push({
          key,
          value: "1",
          label: FILTER_LABEL_MAP[key] || prettifyLabel(key),
        });
      }
      return;
    }

    if (value && typeof value === "object" && ("min" in value || "max" in value)) {
      if (isMeaningfulRange(value)) {
        chips.push({
          key,
          value: formatRangeValue(value, key),
          label: FILTER_LABEL_MAP[key] || prettifyLabel(key),
        });
      }
    }
  });

  return chips;
}

// V2 lean hits only carry `image`. Pass includeV1Fallbacks=true for full detail objects.
export function getDocumentImage(document, includeV1Fallbacks = false) {
  return includeV1Fallbacks
    ? document?.image || document?.website_image_url || document?.product_image || null
    : document?.image || null;
}

export function hasActiveFilters(filters) {
  return getActiveFilterChips(filters).length > 0;
}

export function summarizeFiltersForMetrics(filters) {
  if (!filters) {
    return {};
  }

  return Object.entries(filters).reduce((accumulator, [key, value]) => {
    if (Array.isArray(value) && value.length) {
      accumulator[key] = value.slice(0, 5);
    } else if (key.endsWith("_range") && isMeaningfulRange(value)) {
      accumulator[key] = value;
    } else if ((key === "in_stock" || key === "show_promotion") && value) {
      accumulator[key] = true;
    }
    return accumulator;
  }, {});
}

export function highlightText(value, query) {
  if (!value || !query) {
    return value;
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return value;
  }

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  const matchRegex = new RegExp(`^${escaped}$`, "i");
  const parts = String(value).split(regex);

  return parts.map((part, index) =>
    matchRegex.test(part) ? (
      <mark key={`${part}-${index}`} className="bg-[#fff2a8] text-inherit">
        {part}
      </mark>
    ) : (
      <Fragment key={`${part}-${index}`}>{part}</Fragment>
    )
  );
}

export function mapIntentResponseToState(response, isSystemManager) {
  const payload = response?.data || response?.message?.data || response?.message || response;
  const intent = payload || {};
  const nextState = {
    ...DEFAULT_V2_STATE,
    filters: { ...DEFAULT_V2_STATE.filters },
  };

  nextState.q = typeof intent.query === "string" ? intent.query : "";
  nextState.sort_by = typeof intent.sort_by === "string" ? intent.sort_by : "";
  nextState.include_inactive = false && isSystemManager;

  V2_FILTER_KEYS.forEach((key) => {
    nextState.filters[key] = Array.isArray(intent?.filters?.[key])
      ? intent.filters[key]
      : [];
  });

  nextState.filters.in_stock =
    intent?.filters?.in_stock == null ? null : Boolean(intent.filters.in_stock);
  nextState.filters.show_promotion = Boolean(intent?.filters?.show_promotion);
  nextState.filters.rate_range = {
    min:
      intent?.filters?.price_range?.min !== undefined
        ? String(intent.filters.price_range.min)
        : "",
    max:
      intent?.filters?.price_range?.max !== undefined
        ? String(intent.filters.price_range.max)
        : "",
  };
  nextState.filters.stock_range = {
    min:
      intent?.filters?.stock_range?.min !== undefined
        ? String(intent.filters.stock_range.min)
        : "",
    max:
      intent?.filters?.stock_range?.max !== undefined
        ? String(intent.filters.stock_range.max)
        : "",
  };
  nextState.filters.product_star_rating_range = {
    min:
      intent?.filters?.product_star_rating_range?.min !== undefined
        ? String(intent.filters.product_star_rating_range.min)
        : "",
    max:
      intent?.filters?.product_star_rating_range?.max !== undefined
        ? String(intent.filters.product_star_rating_range.max)
        : "",
  };
  nextState.filters.customer_count_range = {
    min:
      intent?.filters?.customer_count_range?.min !== undefined
        ? String(intent.filters.customer_count_range.min)
        : "",
    max:
      intent?.filters?.customer_count_range?.max !== undefined
        ? String(intent.filters.customer_count_range.max)
        : "",
  };

  return nextState;
}
