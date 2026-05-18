import { DEFAULT_V2_STATE, mapAppliedFiltersToV2Filters } from "@/libs/ighSearchV2";

export const GUIDED_ARRAY_FILTER_KEYS = [
  "brand",
  "category_list",
  "product_type",
  "item_group",
  "ip_rate",
  "lumen_output",
  "power",
  "color_temp",
  "body_finish",
  "input_voltage",
  "mounting",
  "output_current",
  "output_voltage",
  "lamp_type",
  "beam_angle",
  "material",
  "warranty",
  "variant_of",
];

export const GUIDED_BOOLEAN_FILTER_KEYS = [
  "in_stock",
  "show_promotion",
  "hot_product",
  "has_variants",
  "custom_in_bundle_item",
];

export const GUIDED_RANGE_FILTER_KEYS = [
  "rate_range",
  "stock_range",
];

export const GUIDED_QUESTION_META = {
  category_list: {
    title: "What category are you looking for?",
    helper: "Use the lighting family or application area that fits best.",
    placeholder: "Example: downlights, outdoor lighting, LED drivers",
    optionSource: "category_list",
  },
  product_type: {
    title: "Any specific product type?",
    helper: "Choose the exact lighting or electrical item if you know it.",
    placeholder: "Example: spotlight, track light, LED strip, dimmer",
    optionSource: "product_type",
  },
  power: {
    title: "What power or wattage do you need?",
    helper: "You can answer with a value like 10W or a range like 8 to 12W.",
    placeholder: "Example: 10W, 12W, 8 to 10W",
    optionSource: "power",
  },
  color_temp: {
    title: "What color temperature do you prefer?",
    helper: "Warm, neutral, or cool white all work here for lighting selections.",
    placeholder: "Example: 3000K, 4000K, warm white",
    optionSource: "color_temp",
  },
  ip_rate: {
    title: "Do you need a specific IP rating?",
    helper: "Useful for outdoor, wet, façade, landscape, or dusty environments.",
    placeholder: "Example: IP20, IP44, IP65",
    optionSource: "ip_rate",
  },
  lumen_output: {
    title: "Do you need a specific lumen output?",
    helper: "Useful when matching brightness requirements for a space.",
    placeholder: "Example: 800lm, 1200lm, 2000lm",
    optionSource: "lumen_output",
  },
  in_stock: {
    title: "Should I keep this to in-stock products only?",
    helper: "This is usually the best choice for fast procurement.",
    placeholder: "Yes or no",
    optionSource: "boolean",
  },
  rate_range: {
    title: "Do you have a budget range?",
    helper: "Answer with a max or a range if budget matters.",
    placeholder: "Example: under 500, 200 to 800",
    optionSource: "range",
  },
  mounting: {
    title: "Any mounting preference?",
    helper: "Only answer if installation style matters for the project.",
    placeholder: "Example: recessed, surface mounted, suspended",
    optionSource: "mounting",
  },
  beam_angle: {
    title: "Do you need a particular beam angle?",
    helper: "Useful for spot, accent, retail display, and wall washing requirements.",
    placeholder: "Example: 24°, 36°, wide beam",
    optionSource: "beam_angle",
  },
  input_voltage: {
    title: "Do you need a specific input voltage?",
    helper: "Especially helpful for strips, drivers, controls, and electrical accessories.",
    placeholder: "Example: 220V, 24V, 48V",
    optionSource: "input_voltage",
  },
  output_current: {
    title: "What output current do you need?",
    helper: "This is especially useful for LED drivers and control gear.",
    placeholder: "Example: 350mA, 700mA, 1050mA",
    optionSource: "output_current",
  },
  output_voltage: {
    title: "What output voltage should I target?",
    helper: "Helpful when narrowing drivers, strips, and control gear.",
    placeholder: "Example: 12V, 24V, 36V",
    optionSource: "output_voltage",
  },
};

const LEGACY_RESULT_FIELD_MAP = {
  category_list: ["category_list", "item_group"],
  product_type: ["product_type"],
  power: ["power"],
  color_temp: ["color_temp_", "color_temp"],
  ip_rate: ["ip_rate"],
  lumen_output: ["lumen_output"],
  mounting: ["mounting"],
  beam_angle: ["beam_angle"],
  input_voltage: ["input", "input_voltage"],
  output_current: ["output_current"],
  output_voltage: ["output_voltage"],
  lamp_type: ["lamp_type"],
  material: ["material"],
  body_finish: ["body_finish"],
  warranty_: ["warranty_"],
  brand: ["brand"],
};

export function normalizeGuidedAiResponse(payload) {
  if (!payload) return null;

  const message = payload?.message || payload;

  return {
    session_id: message?.session_id || "",
    assistant_message: message?.assistant_message || "",
    applied_query: message?.applied_query || "",
    applied_filters: message?.applied_filters || {},
    applied_sort: message?.applied_sort || "",
    display_filters: Array.isArray(message?.display_filters) ? message.display_filters : [],
    missing_fields: Array.isArray(message?.missing_fields) ? message.missing_fields : [],
    next_question: message?.next_question || "",
    question_type: message?.question_type || "text",
    question_key: message?.question_key || "",
    suggested_answers: Array.isArray(message?.suggested_answers) ? message.suggested_answers : [],
    result_count:
      Number.isFinite(Number(message?.result_count)) ? Number(message.result_count) : null,
    done: Boolean(message?.done),
    resolved_intent: message?.resolved_intent || null,
    explanation: message?.explanation || "",
  };
}

export function buildGuidedSessionFromResponse(response, previousSession, userMessage) {
  const priorMessages = Array.isArray(previousSession?.messages)
    ? previousSession.messages
    : [];

  const nextMessages = [...priorMessages];

  if (userMessage && String(userMessage).trim()) {
    nextMessages.push({
      id: `${Date.now()}-user`,
      role: "user",
      content: String(userMessage).trim(),
    });
  }

  if (response?.assistant_message) {
    nextMessages.push({
      id: `${Date.now()}-assistant`,
      role: "assistant",
      content: response.assistant_message,
    });
  }

  return {
    session_id: response?.session_id || previousSession?.session_id || "",
    started_at: previousSession?.started_at || Date.now(),
    messages: nextMessages,
    current_intent: response?.applied_filters || {},
    current_query: response?.applied_query || "",
    applied_sort: response?.applied_sort || "",
    display_filters: response?.display_filters || [],
    missing_fields: response?.missing_fields || [],
    next_question: response?.next_question || "",
    question_type: response?.question_type || "text",
    question_key: response?.question_key || "",
    suggested_answers: response?.suggested_answers || [],
    result_count: response?.result_count,
    done: Boolean(response?.done),
    status: response?.done ? "complete" : "asking",
    explanation: response?.explanation || "",
    resolved_intent: response?.resolved_intent || null,
  };
}

export function buildV2StateFromGuidedResponse(response, currentState) {
  return {
    ...DEFAULT_V2_STATE,
    search_v2: currentState?.search_v2 ?? false,
    page: 1,
    page_length: currentState?.page_length ?? DEFAULT_V2_STATE.page_length,
    include_inactive:
      currentState?.include_inactive ?? DEFAULT_V2_STATE.include_inactive,
    q: response?.applied_query || "",
    sort_by: response?.applied_sort || "",
    filters: mapAppliedFiltersToV2Filters(response?.applied_filters || {}),
  };
}

export function buildLegacyFiltersFromGuidedResponse(response, baseState) {
  const safeBase = baseState || {};
  const appliedFilters =
    response?.applied_filters && typeof response.applied_filters === "object"
      ? response.applied_filters
      : {};

  const nextFilters = {
    ...safeBase,
    q: response?.applied_query?.trim() ? response.applied_query.trim() : "*",
    page_no: 1,
    item_code: "",
    item_description: "",
    sort_by: response?.applied_sort || safeBase.sort_by || "stock:desc",
    search_type: "",
  };

  const legacyArrayMap = {
    brand: "brand",
    category_list: "category_list",
    product_type: "product_type",
    item_group: "item_group",
    ip_rate: "ip_rate",
    power: "power",
    color_temp: "color_temp_",
    body_finish: "body_finish",
    input_voltage: "input",
    mounting: "mounting",
    output_current: "output_current",
    output_voltage: "output_voltage",
    lamp_type: "lamp_type",
    beam_angle: "beam_angle",
    material: "material",
    warranty: "warranty_",
  };

  Object.entries(legacyArrayMap).forEach(([responseKey, legacyKey]) => {
    nextFilters[legacyKey] = Array.isArray(appliedFilters[responseKey])
      ? appliedFilters[responseKey]
          .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
          .map(String)
      : [];
  });

  GUIDED_BOOLEAN_FILTER_KEYS.forEach((key) => {
    nextFilters[key] =
      typeof appliedFilters[key] === "boolean" ? appliedFilters[key] : Boolean(safeBase[key]);
  });

  const legacyRangeMap = {
    rate_range: "price_range",
    stock_range: "stock_range",
  };

  Object.entries(legacyRangeMap).forEach(([responseKey, legacyKey]) => {
    const range = appliedFilters[responseKey];
    const currentRange = safeBase[legacyKey] || { min: 0, max: 100000 };
    nextFilters[legacyKey] = {
      min:
        Number.isFinite(Number(range?.min)) ? Number(range.min) : currentRange.min,
      max:
        Number.isFinite(Number(range?.max)) ? Number(range.max) : currentRange.max,
    };
  });

  return nextFilters;
}

export function getGuidedQuestionMeta(questionKey) {
  return (
    GUIDED_QUESTION_META[questionKey] || {
      title: "Tell me a bit more about what you need",
      helper: "Any extra detail helps narrow the catalog.",
      placeholder: "Type your answer",
      optionSource: "text",
    }
  );
}

export function deriveV2SuggestedAnswers(questionKey, visibleFilterOptions = {}, fallback = []) {
  if (questionKey === "in_stock") {
    return [
      { label: "In stock only", value: "yes" },
      { label: "Show all stock states", value: "no" },
    ];
  }

  const optionKey = mapQuestionKeyToV2OptionKey(questionKey);
  if (!optionKey) {
    return normalizeSuggestedAnswers(fallback);
  }

  const options = Array.isArray(visibleFilterOptions?.[optionKey])
    ? visibleFilterOptions[optionKey]
    : [];

  const normalized = options
    .map((option) => ({
      label: stripFacetCount(option?.label || option?.value || ""),
      value: option?.value || stripFacetCount(option?.label || ""),
      count: Number.isFinite(Number(option?.count)) ? Number(option.count) : undefined,
    }))
    .filter((option) => option.value)
    .slice(0, 8);

  return normalized.length > 0 ? normalized : normalizeSuggestedAnswers(fallback);
}

export function deriveLegacySuggestedAnswers(questionKey, results = [], mastersData = {}, fallback = []) {
  if (questionKey === "in_stock") {
    return [
      { label: "In stock only", value: "yes" },
      { label: "Show all stock states", value: "no" },
    ];
  }

  const values = new Map();
  const fields = LEGACY_RESULT_FIELD_MAP[questionKey] || [];

  results.forEach((hit) => {
    const doc = hit?.document || hit || {};
    fields.forEach((field) => {
      const rawValue = doc?.[field];
      if (Array.isArray(rawValue)) {
        rawValue.forEach((entry) => addLegacyOption(values, entry));
        return;
      }
      addLegacyOption(values, rawValue);
    });
  });

  if (values.size === 0) {
    const masterKey = mapQuestionKeyToLegacyMasterKey(questionKey);
    const masterValues = Array.isArray(mastersData?.[masterKey]) ? mastersData[masterKey] : [];
    masterValues.slice(0, 8).forEach((entry) => addLegacyOption(values, entry));
  }

  const normalized = Array.from(values.values()).slice(0, 8);
  return normalized.length > 0 ? normalized : normalizeSuggestedAnswers(fallback);
}

export function mergeGuidedSuggestedAnswers(primary = [], fallback = []) {
  const normalizedPrimary = normalizeSuggestedAnswers(primary);
  if (normalizedPrimary.length > 0) {
    return normalizedPrimary.slice(0, 8);
  }

  const seen = new Set();
  const normalized = [...normalizedPrimary, ...normalizeSuggestedAnswers(fallback)]
    .filter((entry) => {
      const key = String(entry.value || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);

  return normalized;
}

export function getGuidedUserMessages(session) {
  return (Array.isArray(session?.messages) ? session.messages : [])
    .filter((entry) => entry?.role === "user")
    .map((entry) => String(entry?.content || "").trim())
    .filter(Boolean);
}

const GUIDED_SKIP_ANSWER_PATTERN =
  /^(any|anything|any one|no preference|doesn'?t matter|dont care|do not care|skip|all|either|whatever)$/i;

export function isGuidedSkipAnswer(value) {
  return GUIDED_SKIP_ANSWER_PATTERN.test(String(value || "").trim());
}

export function shouldAutoApplySingleSuggestion(session) {
  return (
    Boolean(session?.question_key) &&
    !session?.done &&
    Array.isArray(session?.suggested_answers) &&
    session.suggested_answers.length === 1
  );
}

function normalizeSuggestedAnswers(answers) {
  return (Array.isArray(answers) ? answers : [])
    .map((entry) =>
      typeof entry === "string"
        ? { label: entry, value: entry }
        : {
            label: entry?.label || entry?.value || "",
            value: entry?.value || entry?.label || "",
            count: Number.isFinite(Number(entry?.count)) ? Number(entry.count) : undefined,
          }
    )
    .filter((entry) => entry.value);
}

function mapQuestionKeyToV2OptionKey(questionKey) {
  return questionKey;
}

function mapQuestionKeyToLegacyMasterKey(questionKey) {
  if (questionKey === "color_temp") return "color_temp_";
  if (questionKey === "input_voltage") return "input";
  if (questionKey === "warranty") return "warranty_";
  return questionKey;
}

function stripFacetCount(label) {
  return String(label || "").replace(/\s*\(\d+\)\s*$/, "").trim();
}

function addLegacyOption(map, rawValue) {
  const value =
    typeof rawValue === "string"
      ? rawValue.trim()
      : rawValue !== undefined && rawValue !== null
        ? String(rawValue).trim()
        : "";

  if (!value) return;
  const key = value.toLowerCase();
  if (!map.has(key)) {
    map.set(key, { label: value, value });
  }
}
