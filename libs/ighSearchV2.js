import { domain } from "./config/siteConfig";
import { handleUnauthorizedResponse, logoutAndRedirect } from "./auth";
import {
  SearchV2DisabledError,
  buildSearchV2DisabledError,
  isSearchV2DisabledError,
  isSearchV2DisabledResponse,
  SEARCH_V2_DISABLED_DISPLAY_MESSAGE,
  AuthRequiredError,
  buildAuthRequiredError,
  isAuthRequiredError,
  isAuthRequiredResponse,
  AUTH_REQUIRED_DISPLAY_MESSAGE,
} from "./ighSearchV2Errors.mjs";
import { logV2Event } from "./ighSearchV2Metrics";

export {
  SearchV2DisabledError,
  isSearchV2DisabledError,
  SEARCH_V2_DISABLED_DISPLAY_MESSAGE,
  AuthRequiredError,
  isAuthRequiredError,
  AUTH_REQUIRED_DISPLAY_MESSAGE,
};

// Route all igh_search API calls through the ERP cookie-forwarding proxy
// so the Frappe `sid` HttpOnly cookie is forwarded verbatim to the backend.
// The proxy handler is at pages/api/erp/[...path].js → mounted at /api/erp/.
const apiBase = `/api/erp/api/method/igh_search.igh_search.api.`;

const SEARCH_V2_DISABLED_REPORT_KEY = "igh_search_v2_disabled_reported";

export const reportSearchV2DisabledOnce = (context = {}) => {
  if (typeof window === "undefined") return false;

  let alreadyReported = false;
  try {
    if (window.sessionStorage?.getItem(SEARCH_V2_DISABLED_REPORT_KEY) === "1") {
      alreadyReported = true;
    } else {
      window.sessionStorage?.setItem(SEARCH_V2_DISABLED_REPORT_KEY, "1");
    }
  } catch {
    // sessionStorage unavailable (private mode etc.) — fall back to in-memory.
    if (window.__IGH_SEARCH_V2_DISABLED_REPORTED__) {
      alreadyReported = true;
    } else {
      window.__IGH_SEARCH_V2_DISABLED_REPORTED__ = true;
    }
  }

  if (alreadyReported) return false;

  logV2Event("search_v2_disabled", { ...context });

  if (typeof window.__errorReporter?.captureException === "function") {
    try {
      window.__errorReporter.captureException(new SearchV2DisabledError(), {
        tags: { feature: "igh_search_v2", reason: "feature_flag_off" },
        extra: context,
      });
    } catch {
      // never break the search flow on a reporter failure
    }
  } else if (typeof window.console !== "undefined") {
    window.console.error(
      "[igh-search] V2 search disabled by site_config flag",
      context
    );
  }

  return true;
};

export const V2_SORT_OPTIONS = [
  { label: "Relevance", value: "" },
  { label: "Created date", value: "creation:desc" },
  { label: "Created date (oldest first)", value: "creation:asc" },
  { label: "Price low to high", value: "rate:asc" },
  { label: "Price high to low", value: "rate:desc" },
  { label: "Offer price low to high", value: "offer_rate:asc" },
  { label: "Offer price high to low", value: "offer_rate:desc" },
  { label: "Stock low to high", value: "stock:asc" },
  { label: "Stock high to low", value: "stock:desc" },
  { label: "Stock value low to high", value: "inventory_value:asc" },
  { label: "Stock value high to low", value: "inventory_value:desc" },
  { label: "Mostly sold", value: "sold_last_30_days:desc" },
  { label: "Least sold", value: "sold_last_30_days:asc" },
  { label: "Discount low to high", value: "discount_percentage:asc" },
  { label: "Discount high to low", value: "discount_percentage:desc" },
  { label: "Priority low to high", value: "priority_score:asc" },
  { label: "Priority high to low", value: "priority_score:desc" },
  { label: "Popularity low to high", value: "popularity_score:asc" },
  { label: "Popularity high to low", value: "popularity_score:desc" },
  { label: "Business score low to high", value: "business_score:asc" },
  { label: "Business score high to low", value: "business_score:desc" },
  { label: "Modified oldest first", value: "modified_ts:asc" },
  { label: "Modified newest first", value: "modified_ts:desc" },
];

export const V2_FILTER_KEYS = [
  "brand",
  "item_group",
  "category_list",
  "series",
  "product_type",
  "power",
  "color_temp",
  "ip_rate",
  "lumen_output",
  "beam_angle",
  "mounting",
  "body_finish",
  "input_voltage",
  "output_voltage",
  "output_current",
  "lamp_type",
  "material",
  "warranty",
  "variant_of",
  "is_manufactured_item",
];

export const V2_RANGE_KEYS = [
  "rate_range",
  "offer_rate_range",
  "discount_percentage_range",
  "stock_range",
  "sold_last_30_days_range",
  "inventory_value_range",
  "priority_score_range",
  "popularity_score_range",
  "business_score_range",
  "power_value_range",
  "color_temp_kelvin_range",
  "ip_rating_numeric_range",
  "product_star_rating_range",
  "customer_count_range",
];

export const DEFAULT_V2_STATE = {
  q: "",
  sort_by: "",
  page: 1,
  page_length: 20,
  search_v2: false,
  include_inactive: false,
  filters: {
    brand: [],
    item_group: [],
    category_list: [],
    series: [],
    product_type: [],
    power: [],
    color_temp: [],
    ip_rate: [],
    lumen_output: [],
    beam_angle: [],
    mounting: [],
    body_finish: [],
    input_voltage: [],
    output_voltage: [],
    output_current: [],
    lamp_type: [],
    material: [],
    warranty: [],
    variant_of: [],
    is_manufactured_item: [],
    in_stock: true,
    show_promotion: false,
    rate_range: { min: "", max: "" },
    offer_rate_range: { min: "", max: "" },
    discount_percentage_range: { min: "", max: "" },
    stock_range: { min: "", max: "" },
    sold_last_30_days_range: { min: "", max: "" },
    inventory_value_range: { min: "", max: "" },
    priority_score_range: { min: "", max: "" },
    popularity_score_range: { min: "", max: "" },
    business_score_range: { min: "", max: "" },
    power_value_range: { min: "", max: "" },
    color_temp_kelvin_range: { min: "", max: "" },
    ip_rating_numeric_range: { min: "", max: "" },
    product_star_rating_range: { min: "", max: "" },
    customer_count_range: { min: "", max: "" },
  },
};

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
});

const SEARCH_TIMEOUT_CODE = "timeout";
const SEARCH_NETWORK_CODE = "network";
const SEARCH_SERVER_CODE = "server";

const toRequestError = (message, metadata = {}) => {
  const error = new Error(message);
  error.code = metadata.code || "request_error";
  error.attempt = metadata.attempt || 1;
  error.duration_ms = metadata.duration_ms || 0;
  error.status = metadata.status;
  error.retrying = Boolean(metadata.retrying);
  return error;
};

const createRequestController = (externalSignal, timeoutMs) => {
  const controller = new AbortController();
  let timeoutId = null;

  const handleExternalAbort = () => {
    controller.abort(
      externalSignal?.reason || new DOMException("Request aborted", "AbortError")
    );
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      handleExternalAbort();
    } else {
      externalSignal.addEventListener("abort", handleExternalAbort, { once: true });
    }
  }

  if (Number(timeoutMs) > 0) {
    timeoutId = setTimeout(() => {
      controller.abort(new DOMException("Request timed out", "TimeoutError"));
    }, Number(timeoutMs));
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (externalSignal) {
        externalSignal.removeEventListener("abort", handleExternalAbort);
      }
    },
  };
};

const parseJsonResponse = async (response) => {
  if (handleUnauthorizedResponse(response)) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // The backend signals "Authentication required" via a ValidationError
    // (HTTP 417), not a 401, so handle it explicitly here: route the user to
    // the login page instead of surfacing a generic "unable to load" error.
    if (isAuthRequiredResponse(response.status, data)) {
      // Clear any stale localStorage session first, otherwise /login bounces
      // straight back to "/" (it treats a leftover `full_name` as logged-in).
      logoutAndRedirect("required");
      throw buildAuthRequiredError(data);
    }
    if (isSearchV2DisabledResponse(response.status, data)) {
      throw buildSearchV2DisabledError(data);
    }
    const errorMessage =
      data?.message?.message ||
      data?.message ||
      data?.exc ||
      `Request failed with status ${response.status}`;
    throw toRequestError(errorMessage, {
      code: SEARCH_SERVER_CODE,
      status: response.status,
    });
  }

  return data?.message ?? data;
};

const postApi = async (method, payload, options = {}) => {
  const { signal, cleanup } = createRequestController(
    options.signal,
    options.timeoutMs
  );

  try {
    const response = await fetch(`${apiBase}${method}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload || {}),
      signal,
      credentials: 'include',
      redirect: "error",
    });

    return parseJsonResponse(response);
  } catch (error) {
    if (signal.aborted && signal.reason?.name === "TimeoutError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    cleanup();
  }
};

const getApi = async (method, options = {}) => {
  const { signal, cleanup } = createRequestController(
    options.signal,
    options.timeoutMs
  );

  try {
    const response = await fetch(`${apiBase}${method}`, {
      method: "GET",
      headers: getAuthHeaders(),
      signal,
      credentials: 'include',
    });

    return parseJsonResponse(response);
  } catch (error) {
    if (signal.aborted && signal.reason?.name === "TimeoutError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    cleanup();
  }
};

export const getIsSystemManager = () => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");
    return Array.isArray(roles) && roles.includes("System Manager");
  } catch (error) {
    return false;
  }
};

export const buildFeatureFlagOverride = (searchV2Requested) =>
  searchV2Requested ? 1 : 0;

export const probeSearchV2Availability = async (
  featureFlagOverride = 0,
  options = {}
) =>
  searchProductsV2(
    {
      query: "*",
      page: 1,
      page_length: 1,
      feature_flag_override: featureFlagOverride,
    },
    options
  );

export const searchProductsV2 = async (payload, options = {}) => {
  const sortByValue = payload?.sort_by ?? "";
  const normalizedPayload = {
    query: payload?.query ?? payload?.q ?? "",
    filters: payload?.filters ?? {},
    sort_by: sortByValue,
    // Enforce field-first sort when user explicitly picks a sort option.
    // Without this, backend may keep _text_match as the primary sort key.
    strict_sort: sortByValue ? 1 : 0,
    page: payload?.page ?? 1,
    page_length: payload?.page_length ?? 20,
    include_inactive: payload?.include_inactive ? 1 : 0,
    item_code_hint: payload?.item_code_hint ?? "",
    feature_flag_override: payload?.feature_flag_override ? 1 : 0,
  };

  if (normalizedPayload.filters && typeof normalizedPayload.filters !== "string") {
    normalizedPayload.filters = JSON.stringify(normalizedPayload.filters);
  }

  const runAttempt = async (attempt, timeoutMs) => {
    const startedAt = Date.now();
    try {
      return await postApi("search_products_v2", normalizedPayload, {
        ...options,
        timeoutMs,
      });
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const timedOut = error?.message?.toLowerCase?.().includes("timed out");
      const isAbort = error?.name === "AbortError";
      if (isAbort) throw error;
      // Auth errors are terminal — don't retry or wrap (the user is being
      // redirected to /login); preserve the typed error for callers.
      if (isAuthRequiredError(error)) throw error;
      const isNetwork = !error?.status && !timedOut && !isAbort;
      const canRetry = attempt === 1 && (timedOut || isNetwork);
      if (canRetry) {
        if (typeof options?.onRetry === "function") {
          try {
            options.onRetry({
              code: timedOut ? SEARCH_TIMEOUT_CODE : SEARCH_NETWORK_CODE,
              attempt,
              duration_ms: durationMs,
            });
          } catch {
            // Ignore callback errors; request flow must continue.
          }
        }
        throw toRequestError("Search is taking longer than expected. Retrying…", {
          code: timedOut ? SEARCH_TIMEOUT_CODE : SEARCH_NETWORK_CODE,
          attempt,
          duration_ms: durationMs,
          retrying: true,
        });
      }
      if (timedOut) {
        throw toRequestError("Search timed out. Please narrow filters and try again.", {
          code: SEARCH_TIMEOUT_CODE,
          attempt,
          duration_ms: durationMs,
          status: error?.status,
        });
      }
      if (isNetwork) {
        throw toRequestError("Unable to reach search service. Please try again.", {
          code: SEARCH_NETWORK_CODE,
          attempt,
          duration_ms: durationMs,
        });
      }
      throw toRequestError(error?.message || "Unable to load search results.", {
        code: error?.code || SEARCH_SERVER_CODE,
        attempt,
        duration_ms: durationMs,
        status: error?.status,
      });
    }
  };

  try {
    return await runAttempt(1, 25000);
  } catch (firstError) {
    if (!firstError?.retrying) {
      throw firstError;
    }
  }
  return runAttempt(2, 35000);
};

export const suggestProductsV2 = async (payload, options = {}) =>
  postApi(
    "suggest_products_v2",
    {
      query: payload?.query ?? "",
      limit: payload?.limit ?? 8,
      feature_flag_override: payload?.feature_flag_override ? 1 : 0,
    },
    {
      timeoutMs: 8000,
      ...options,
    }
  );

export const getSimilarProductsV2 = async (payload, options = {}) =>
  postApi(
    "get_similar_products_v2",
    {
      item_code: payload?.item_code,
      limit: payload?.limit ?? 8,
      include_manual: payload?.include_manual ?? 1,
      feature_flag_override: payload?.feature_flag_override ? 1 : 0,
    },
    {
      timeoutMs: 12000,
      ...options,
    }
  );

export const aiProductSearchV2 = async (payload, options = {}) =>
  postApi("ai_product_search", payload, {
    timeoutMs: 15000,
    ...options,
  });

export const aiSearchProductsV2 = async (payload, options = {}) =>
  postApi(
    "ai_search_products_v2",
    {
      message: payload?.message ?? "",
      page_context: payload?.page_context ?? {},
      page: payload?.page ?? 1,
      page_length: payload?.page_length ?? 20,
      include_inactive: payload?.include_inactive ? 1 : 0,
      feature_flag_override: payload?.feature_flag_override ? 1 : 0,
    },
    {
      timeoutMs: 25000,
      ...options,
    }
  );

export const trackAiSearchClick = async (payload, options = {}) =>
  postApi(
    "track_ai_search_click",
    {
      search_event_id: payload?.search_event_id ?? "",
      item_code: payload?.item_code ?? "",
    },
    {
      timeoutMs: 8000,
      ...options,
    }
  );

export const trackAiSearchShortlist = async (payload, options = {}) =>
  postApi(
    "track_ai_search_shortlist",
    {
      search_event_id: payload?.search_event_id ?? "",
      item_code: payload?.item_code ?? "",
    },
    {
      timeoutMs: 8000,
      ...options,
    }
  );

export const trackAiSearchQuotation = async (payload, options = {}) =>
  postApi(
    "track_ai_search_quotation",
    {
      search_event_id: payload?.search_event_id ?? "",
      item_code: payload?.item_code ?? "",
      quotation: payload?.quotation ?? "",
    },
    {
      timeoutMs: 8000,
      ...options,
    }
  );

export const trackAiSearchReformulation = async (payload, options = {}) =>
  postApi(
    "track_ai_search_reformulation",
    {
      search_event_id: payload?.search_event_id ?? "",
      reformulated_message: payload?.reformulated_message ?? "",
    },
    {
      timeoutMs: 8000,
      ...options,
    }
  );

export const getTypesenseSyncHealth = async (options = {}) =>
  getApi("get_typesense_sync_health", {
    timeoutMs: 10000,
    ...options,
  });

export const normalizeSearchHit = (hit) => hit?.document || hit || {};

export const adaptFacetCounts = (facetCounts = []) => {
  if (!Array.isArray(facetCounts)) {
    return {};
  }

  return facetCounts.reduce((accumulator, facet) => {
    if (!facet?.field_name) {
      return accumulator;
    }

    accumulator[facet.field_name] = Array.isArray(facet.counts)
      ? facet.counts.reduce((map, value) => {
          if (value?.value !== undefined) {
            map[String(value.value)] = value.count || 0;
          }
          return map;
        }, {})
      : {};

    return accumulator;
  }, {});
};

const normalizeRange = (rangeValue) => ({
  min:
    rangeValue && rangeValue.min !== undefined && rangeValue.min !== null
      ? String(rangeValue.min)
      : "",
  max:
    rangeValue && rangeValue.max !== undefined && rangeValue.max !== null
      ? String(rangeValue.max)
      : "",
});

const NUMBER_PATTERN = "(\\d+(?:\\.\\d+)?)";
const POWER_UNIT_PATTERN = "(?:w|watt|watts)";

const formatDerivedNumber = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  return String(Number(numeric.toFixed(6)));
};

const getExclusiveUpperBound = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  const decimalPlaces = String(value).split(".")[1]?.length || 0;
  const step = 1 / 10 ** Math.min(decimalPlaces + 3, 6);
  return formatDerivedNumber(Math.max(0, numeric - step));
};

const getExclusiveLowerBound = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  const decimalPlaces = String(value).split(".")[1]?.length || 0;
  const step = 1 / 10 ** Math.min(decimalPlaces + 3, 6);
  return formatDerivedNumber(numeric + step);
};

const POWER_RANGE_PATTERNS = [
  {
    type: "between",
    regex: new RegExp(
      `\\bbetween\\s+${NUMBER_PATTERN}\\s*${POWER_UNIT_PATTERN}?\\s*(?:and|-|to)\\s*${NUMBER_PATTERN}\\s*${POWER_UNIT_PATTERN}\\b`,
      "i"
    ),
  },
  {
    type: "max_exclusive",
    regex: new RegExp(
      `\\b(?:below|under|less than)\\s+${NUMBER_PATTERN}\\s*${POWER_UNIT_PATTERN}\\b`,
      "i"
    ),
  },
  {
    type: "max_inclusive",
    regex: new RegExp(
      `\\b(?:upto|up to|maximum of|max(?:imum)?(?: power)?(?: below)?|not more than|no more than|at most)\\s+${NUMBER_PATTERN}\\s*${POWER_UNIT_PATTERN}\\b`,
      "i"
    ),
  },
  {
    type: "min_exclusive",
    regex: new RegExp(
      `\\b(?:above|over|more than|greater than)\\s+${NUMBER_PATTERN}\\s*${POWER_UNIT_PATTERN}\\b`,
      "i"
    ),
  },
  {
    type: "min_inclusive",
    regex: new RegExp(
      `\\b(?:at least|minimum of|min(?:imum)?(?: power)?(?: above)?)\\s+${NUMBER_PATTERN}\\s*${POWER_UNIT_PATTERN}\\b`,
      "i"
    ),
  },
];

const IN_STOCK_PHRASE_REGEX =
  /\b(?:in\s*stock|on\s*stock|instock|stock\s*available|available\s*stock|available\s*now)\b/i;

const normalizeDerivedQuery = (query) =>
  String(query || "")
    .replace(/\s+/g, " ")
    .trim();

export const getPromptDerivedPowerConstraint = (prompt) => {
  if (!prompt || typeof prompt !== "string") {
    return null;
  }

  const normalizedPrompt = normalizeDerivedQuery(prompt);
  if (!normalizedPrompt) {
    return null;
  }

  for (const pattern of POWER_RANGE_PATTERNS) {
    const match = normalizedPrompt.match(pattern.regex);
    if (!match) {
      continue;
    }

    if (pattern.type === "between") {
      const first = Number(match[1]);
      const second = Number(match[2]);
      if (!Number.isFinite(first) || !Number.isFinite(second)) {
        return null;
      }

      return {
        range: {
          min: formatDerivedNumber(Math.min(first, second)),
          max: formatDerivedNumber(Math.max(first, second)),
        },
        matchText: match[0],
        operator: "between",
        displayValue: `${formatDerivedNumber(Math.min(first, second))}W-${formatDerivedNumber(Math.max(first, second))}W`,
      };
    }

    const numericValue = Number(match[1]);
    if (!Number.isFinite(numericValue)) {
      return null;
    }

    const formattedValue = formatDerivedNumber(numericValue);
    if (pattern.type === "max_exclusive") {
      return {
        range: { min: "", max: getExclusiveUpperBound(match[1]) },
        matchText: match[0],
        operator: "max_exclusive",
        displayValue: `Below ${formattedValue}W`,
      };
    }

    if (pattern.type === "max_inclusive") {
      return {
        range: { min: "", max: formattedValue },
        matchText: match[0],
        operator: "max_inclusive",
        displayValue: `Up to ${formattedValue}W`,
      };
    }

    if (pattern.type === "min_exclusive") {
      return {
        range: { min: getExclusiveLowerBound(match[1]), max: "" },
        matchText: match[0],
        operator: "min_exclusive",
        displayValue: `Above ${formattedValue}W`,
      };
    }

    if (pattern.type === "min_inclusive") {
      return {
        range: { min: formattedValue, max: "" },
        matchText: match[0],
        operator: "min_inclusive",
        displayValue: `At least ${formattedValue}W`,
      };
    }
  }

  return null;
};

export const buildPromptDerivedPowerRange = (prompt) =>
  getPromptDerivedPowerConstraint(prompt)?.range || null;

export const removePromptDerivedPowerConstraint = (prompt) => {
  const constraint = getPromptDerivedPowerConstraint(prompt);
  if (!constraint?.matchText) {
    return normalizeDerivedQuery(prompt);
  }

  return normalizeDerivedQuery(
    normalizeDerivedQuery(prompt).replace(constraint.matchText, " ")
  );
};

export const getPromptDerivedColorTemperature = (prompt) => {
  if (!prompt || typeof prompt !== "string") {
    return null;
  }

  const normalizedPrompt = normalizeDerivedQuery(prompt);
  if (!normalizedPrompt) {
    return null;
  }

  const match = normalizedPrompt.match(/\b(\d{3,5})\s*k\b/i);
  if (!match) {
    return null;
  }

  const kelvin = Number(match[1]);
  if (!Number.isFinite(kelvin) || kelvin < 1000 || kelvin > 10000) {
    return null;
  }

  const value = `${formatDerivedNumber(kelvin)}K`;
  return {
    value,
    matchText: match[0],
    displayValue: value,
  };
};

export const removePromptDerivedColorTemperature = (prompt) => {
  const colorTemperature = getPromptDerivedColorTemperature(prompt);
  if (!colorTemperature?.matchText) {
    return normalizeDerivedQuery(prompt);
  }

  return normalizeDerivedQuery(
    normalizeDerivedQuery(prompt).replace(colorTemperature.matchText, " ")
  );
};

export const applyPromptDerivedSpecFilters = (state, prompt) => {
  const safeState = state || DEFAULT_V2_STATE;
  const powerConstraint = getPromptDerivedPowerConstraint(prompt);
  const colorTemperature = getPromptDerivedColorTemperature(prompt);
  const normalizedPrompt = normalizeDerivedQuery(
    typeof prompt === "string" ? prompt : safeState.q || ""
  );
  const inStockMatch = normalizedPrompt.match(IN_STOCK_PHRASE_REGEX);

  if (!powerConstraint && !colorTemperature && !inStockMatch) {
    return {
      state: safeState,
      displayFilters: [],
    };
  }

  let nextQuery = typeof prompt === "string" ? prompt : safeState.q || "";
  if (powerConstraint?.matchText) {
    nextQuery = removePromptDerivedPowerConstraint(nextQuery);
  }
  if (colorTemperature?.matchText) {
    nextQuery = removePromptDerivedColorTemperature(nextQuery);
  }
  if (inStockMatch?.[0]) {
    nextQuery = normalizeDerivedQuery(nextQuery.replace(inStockMatch[0], " "));
  }

  const nextFilters = {
    ...safeState.filters,
  };
  const displayFilters = [];

  if (powerConstraint) {
    nextFilters.power = [];
    nextFilters.power_value_range = powerConstraint.range;
    displayFilters.push({
      key: "power_value_range",
      label: "Power",
      value: powerConstraint.displayValue,
    });
  }

  if (colorTemperature) {
    nextFilters.color_temp = [colorTemperature.value];
    nextFilters.color_temp_kelvin_range = { min: "", max: "" };
    displayFilters.push({
      key: "color_temp",
      label: "Color Temperature",
      value: colorTemperature.displayValue,
    });
  }

  if (inStockMatch) {
    nextFilters.in_stock = true;
    displayFilters.push({
      key: "in_stock",
      label: "In Stock",
      value: "Yes",
    });
  }

  return {
    state: {
      ...safeState,
      q: nextQuery,
      filters: nextFilters,
    },
    displayFilters,
  };
};

export const sanitizeV2FiltersForRequest = (filters) => {
  const safeFilters =
    filters && typeof filters === "object" ? filters : DEFAULT_V2_STATE.filters;

  const sanitized = Object.entries(safeFilters).reduce((accumulator, [key, value]) => {
    if (Array.isArray(value)) {
      accumulator[key] = value;
      return accumulator;
    }

    if (value && typeof value === "object" && ("min" in value || "max" in value)) {
      accumulator[key] = {
        min: value.min ?? "",
        max: value.max ?? "",
      };
      return accumulator;
    }

    accumulator[key] = value;
    return accumulator;
  }, {});

  // Backend promo filtering is offer-price based.
  // Keep `show_promotion` for UI/state, and enforce an equivalent
  // request-side numeric guard so promo toggle always has effect.
  if (sanitized.show_promotion) {
    const offerRateRange = sanitized.offer_rate_range || { min: "", max: "" };
    const currentMin =
      offerRateRange?.min !== undefined && offerRateRange?.min !== null
        ? String(offerRateRange.min).trim()
        : "";

    if (currentMin === "" || Number(currentMin) <= 0) {
      sanitized.offer_rate_range = {
        ...offerRateRange,
        min: "0.01",
      };
    }
  }

  // Compatibility bridge for mixed index schemas:
  // some environments still index legacy field keys (e.g. `input`)
  // while V2 UI uses canonical keys (e.g. `input_voltage`).
  // Send both keys when values exist so filtering works across both.
  if (Array.isArray(sanitized.input_voltage) && sanitized.input_voltage.length > 0) {
    sanitized.input = [...sanitized.input_voltage];
  }
  if (Array.isArray(sanitized.color_temp) && sanitized.color_temp.length > 0) {
    sanitized.color_temp_ = [...sanitized.color_temp];
  }
  if (Array.isArray(sanitized.warranty) && sanitized.warranty.length > 0) {
    sanitized.warranty_ = [...sanitized.warranty];
  }
  if (
    Array.isArray(sanitized.is_manufactured_item) &&
    sanitized.is_manufactured_item.length > 0
  ) {
    sanitized.manufactured_item = [...sanitized.is_manufactured_item];
  }

  // Numeric range compatibility bridge:
  // different deployments may still use legacy field keys in Typesense filters.
  const cloneRange = (rangeValue) => ({
    min: rangeValue?.min ?? "",
    max: rangeValue?.max ?? "",
  });

  if (sanitized.product_star_rating_range) {
    const ratingRange = cloneRange(sanitized.product_star_rating_range);
    sanitized.star_rating_range = ratingRange;
    sanitized.rating_range = ratingRange;
  }
  if (sanitized.customer_count_range) {
    const customerRange = cloneRange(sanitized.customer_count_range);
    sanitized.happy_customers_range = customerRange;
    sanitized.invoice_count_range = customerRange;
    sanitized.customer_invoice_count_range = customerRange;
  }
  if (sanitized.lumen_output && Array.isArray(sanitized.lumen_output)) {
    sanitized.lumen = [...sanitized.lumen_output];
  }
  if (sanitized.output_current && Array.isArray(sanitized.output_current)) {
    sanitized.current_output = [...sanitized.output_current];
  }
  if (sanitized.output_voltage && Array.isArray(sanitized.output_voltage)) {
    sanitized.voltage_output = [...sanitized.output_voltage];
  }

  return sanitized;
};

export const mapAiIntentToV2State = (intent, sourcePrompt = "") => {
  const safeIntent = intent || {};
  const safeFilters = safeIntent.filters || {};

  const nextState = {
    ...DEFAULT_V2_STATE,
    q: typeof safeIntent.query === "string" ? safeIntent.query : "",
    sort_by:
      typeof safeIntent.sort_by === "string" ? safeIntent.sort_by : "",
    filters: {
      ...DEFAULT_V2_STATE.filters,
    },
  };

  V2_FILTER_KEYS.forEach((key) => {
    const legacyKey =
      key === "color_temp"
        ? "color_temp_"
        : key === "input_voltage"
          ? "input"
          : key === "warranty"
            ? "warranty_"
            : key;

    nextState.filters[key] = Array.isArray(safeFilters[legacyKey])
      ? safeFilters[legacyKey].filter(
          (value) => typeof value === "string" && value.trim() !== ""
        )
      : [];
  });

  nextState.filters.in_stock = Boolean(safeFilters.in_stock);
  nextState.filters.show_promotion = Boolean(safeFilters.show_promotion);
  nextState.filters.rate_range = normalizeRange(safeFilters.price_range);
  nextState.filters.stock_range = normalizeRange(safeFilters.stock_range);
  nextState.filters.offer_rate_range = normalizeRange(safeFilters.offer_rate_range);
  nextState.filters.discount_percentage_range = normalizeRange(
    safeFilters.discount_percentage_range
  );
  nextState.filters.sold_last_30_days_range = normalizeRange(
    safeFilters.sold_last_30_days_range
  );
  nextState.filters.inventory_value_range = normalizeRange(
    safeFilters.inventory_value_range
  );
  nextState.filters.priority_score_range = normalizeRange(
    safeFilters.priority_score_range
  );
  nextState.filters.popularity_score_range = normalizeRange(
    safeFilters.popularity_score_range
  );
  nextState.filters.business_score_range = normalizeRange(
    safeFilters.business_score_range
  );
  nextState.filters.power_value_range = normalizeRange(safeFilters.power_value_range);
  nextState.filters.color_temp_kelvin_range = normalizeRange(
    safeFilters.color_temp_kelvin_range
  );
  nextState.filters.ip_rating_numeric_range = normalizeRange(
    safeFilters.ip_rating_numeric_range
  );
  nextState.filters.product_star_rating_range = normalizeRange(
    safeFilters.product_star_rating_range
  );
  nextState.filters.customer_count_range = normalizeRange(
    safeFilters.customer_count_range
  );

  const promptDerivedPowerRange = buildPromptDerivedPowerRange(sourcePrompt);
  const hasBackendPowerRange =
    nextState.filters.power_value_range.min !== "" ||
    nextState.filters.power_value_range.max !== "";

  if (!hasBackendPowerRange && promptDerivedPowerRange) {
    nextState.filters.power_value_range = promptDerivedPowerRange;
    nextState.filters.power = [];
  }

  return nextState;
};

export const mapAppliedFiltersToV2Filters = (appliedFilters) => {
  const safeFilters =
    appliedFilters && typeof appliedFilters === "object" ? appliedFilters : {};

  const nextFilters = {
    ...DEFAULT_V2_STATE.filters,
  };

  V2_FILTER_KEYS.forEach((key) => {
    nextFilters[key] = Array.isArray(safeFilters[key])
      ? safeFilters[key]
          .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
          .map(String)
      : [];
  });

  nextFilters.in_stock = Boolean(safeFilters.in_stock);
  nextFilters.show_promotion = Boolean(safeFilters.show_promotion);

  V2_RANGE_KEYS.forEach((key) => {
    nextFilters[key] = normalizeRange(safeFilters[key]);
  });

  return nextFilters;
};

const parseBooleanFlag = (value) => value === "1" || value === 1 || value === true;

const parseArrayValue = (value) => {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value)
    ? value.filter(Boolean).map(String)
    : [String(value)];
};

export const stateFromQuery = (query, isSystemManager = false) => {
  const nextState = {
    ...DEFAULT_V2_STATE,
    filters: { ...DEFAULT_V2_STATE.filters },
  };

  nextState.q = typeof query.q === "string" ? query.q : "";
  nextState.sort_by = typeof query.sort_by === "string" ? query.sort_by : "";
  nextState.page = Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1;
  nextState.page_length =
    Number.parseInt(query.page_length, 10) > 0
      ? Number.parseInt(query.page_length, 10)
      : 20;
  nextState.search_v2 = parseBooleanFlag(query.search_v2);
  nextState.include_inactive =
    isSystemManager && parseBooleanFlag(query.include_inactive);

  V2_FILTER_KEYS.forEach((key) => {
    nextState.filters[key] = parseArrayValue(query[key]);
  });

  if (query.in_stock !== undefined) {
    nextState.filters.in_stock = parseBooleanFlag(query.in_stock);
  }
  if (query.show_promotion !== undefined) {
    nextState.filters.show_promotion = parseBooleanFlag(query.show_promotion);
  }

  const rangeMap = {
    rate_range: "rate",
    offer_rate_range: "offer_rate",
    discount_percentage_range: "discount_percentage",
    stock_range: "stock",
    sold_last_30_days_range: "sold_last_30_days",
    inventory_value_range: "inventory_value",
    priority_score_range: "priority_score",
    popularity_score_range: "popularity_score",
    business_score_range: "business_score",
    power_value_range: "power_value",
    color_temp_kelvin_range: "color_temp_kelvin",
    ip_rating_numeric_range: "ip_rating_numeric",
    product_star_rating_range: "product_star_rating",
    customer_count_range: "customer_count",
  };

  Object.entries(rangeMap).forEach(([stateKey, queryKey]) => {
    nextState.filters[stateKey] = {
      min: query[`${queryKey}_min`] ? String(query[`${queryKey}_min`]) : "",
      max: query[`${queryKey}_max`] ? String(query[`${queryKey}_max`]) : "",
    };
  });

  return nextState;
};

export const queryFromState = (state, isSystemManager = false) => {
  const params = new URLSearchParams();
  const safeState = state || DEFAULT_V2_STATE;

  if (safeState.q) {
    params.set("q", safeState.q);
  }

  if (safeState.sort_by) {
    params.set("sort_by", safeState.sort_by);
  }

  if (safeState.page && safeState.page !== 1) {
    params.set("page", String(safeState.page));
  }

  if (safeState.page_length && safeState.page_length !== 20) {
    params.set("page_length", String(safeState.page_length));
  }

  if (safeState.search_v2) {
    params.set("search_v2", "1");
  }

  if (isSystemManager && safeState.include_inactive) {
    params.set("include_inactive", "1");
  }

  V2_FILTER_KEYS.forEach((key) => {
    (safeState.filters?.[key] || []).forEach((value) => {
      if (value !== "") {
        params.append(key, value);
      }
    });
  });

  if (safeState.filters?.in_stock) {
    params.set("in_stock", "1");
  }
  if (safeState.filters?.show_promotion) {
    params.set("show_promotion", "1");
  }

  const rangeMap = {
    rate_range: "rate",
    offer_rate_range: "offer_rate",
    discount_percentage_range: "discount_percentage",
    stock_range: "stock",
    sold_last_30_days_range: "sold_last_30_days",
    inventory_value_range: "inventory_value",
    priority_score_range: "priority_score",
    popularity_score_range: "popularity_score",
    business_score_range: "business_score",
    power_value_range: "power_value",
    color_temp_kelvin_range: "color_temp_kelvin",
    ip_rating_numeric_range: "ip_rating_numeric",
    product_star_rating_range: "product_star_rating",
    customer_count_range: "customer_count",
  };

  Object.entries(rangeMap).forEach(([stateKey, queryKey]) => {
    const rangeValue = safeState.filters?.[stateKey];
    if (rangeValue?.min !== "") {
      params.set(`${queryKey}_min`, String(rangeValue.min));
    }
    if (rangeValue?.max !== "") {
      params.set(`${queryKey}_max`, String(rangeValue.max));
    }
  });

  return params.toString();
};

export const getMasterOptionValue = (option) => {
  if (typeof option === "string" || typeof option === "number") {
    return String(option);
  }

  if (option && typeof option === "object") {
    return (
      option.value ||
      option.name ||
      option.label ||
      option.item_group_name ||
      option.brand_name ||
      ""
    );
  }

  return "";
};

export const buildMasterOptions = (options = [], facetMap = {}) => {
  const rawOptions = Array.isArray(options) ? options : [];
  const fallbackFacetOptions =
    rawOptions.length > 0
      ? []
      : Object.keys(facetMap || {}).sort(
          (left, right) => Number(facetMap?.[right] || 0) - Number(facetMap?.[left] || 0)
        );
  const resolvedOptions = rawOptions.length > 0 ? rawOptions : fallbackFacetOptions;

  // Masters can contain repeated values (for example attribute-backed categories).
  // Deduplicate early so facets remain searchable and selection state is stable.
  const seen = new Map();
  resolvedOptions.forEach((option) => {
    const value = getMasterOptionValue(option);
    const normalizedKey = String(value || "").trim().toLowerCase();
    if (!normalizedKey) return;
    if (!seen.has(normalizedKey)) {
      seen.set(normalizedKey, String(value).trim());
    }
  });

  const normalizedFacetCounts = Object.entries(facetMap || {}).reduce(
    (accumulator, [facetValue, count]) => {
      const key = String(facetValue || "").trim().toLowerCase();
      if (!key) {
        return accumulator;
      }
      accumulator[key] = (accumulator[key] || 0) + Number(count || 0);
      return accumulator;
    },
    {}
  );

  return Array.from(seen.values())
    .map((value) => {
      const direct = Number(facetMap?.[value] || 0);
      const fallback = Number(normalizedFacetCounts[value.toLowerCase()] || 0);
      const count = direct > 0 ? direct : fallback;
      return {
        value,
        label: count > 0 ? `${value} (${count})` : value,
      };
    })
    .filter(Boolean);
};
