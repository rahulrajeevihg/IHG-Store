export const PRINT_PRODUCT_LIMIT = 500;

export const PRINT_FILTER_KEYS = [
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

export const PRINT_RANGE_QUERY_MAP = {
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

export const DEFAULT_PRINT_STATE = {
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

const parseBooleanFlag = (value) => value === "1" || value === 1 || value === true;

const parseArrayValue = (value) => {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value)
    ? value
        .filter((entry) => entry !== undefined && entry !== null && String(entry).trim() !== "")
        .map(String)
    : String(value).trim() === ""
    ? []
    : [String(value)];
};

const cloneDefaultFilters = () => JSON.parse(JSON.stringify(DEFAULT_PRINT_STATE.filters));

export function looksLikePrintableSku(value) {
  if (!value || typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  return /^[A-Za-z0-9._/-]+$/.test(trimmed) && /\d/.test(trimmed);
}

export function stateFromPrintableQuery(query = {}, isSystemManager = false) {
  const nextState = {
    ...DEFAULT_PRINT_STATE,
    filters: cloneDefaultFilters(),
  };

  nextState.q = typeof query.q === "string" ? query.q : "";
  nextState.sort_by = typeof query.sort_by === "string" ? query.sort_by : "";
  nextState.page = Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1;
  nextState.page_length =
    Number.parseInt(query.page_length, 10) > 0
      ? Number.parseInt(query.page_length, 10)
      : DEFAULT_PRINT_STATE.page_length;
  nextState.search_v2 = parseBooleanFlag(query.search_v2);
  nextState.include_inactive =
    Boolean(isSystemManager) && parseBooleanFlag(query.include_inactive);

  PRINT_FILTER_KEYS.forEach((key) => {
    nextState.filters[key] = parseArrayValue(query[key]);
  });

  if (query.in_stock !== undefined) {
    nextState.filters.in_stock = parseBooleanFlag(query.in_stock);
  }

  if (query.show_promotion !== undefined) {
    nextState.filters.show_promotion = parseBooleanFlag(query.show_promotion);
  }

  Object.entries(PRINT_RANGE_QUERY_MAP).forEach(([stateKey, queryKey]) => {
    nextState.filters[stateKey] = {
      min: query[`${queryKey}_min`] ? String(query[`${queryKey}_min`]) : "",
      max: query[`${queryKey}_max`] ? String(query[`${queryKey}_max`]) : "",
    };
  });

  return nextState;
}

export function buildPrintableSearchRequest(
  query = {},
  { isSystemManager = false, pageLength = PRINT_PRODUCT_LIMIT, featureFlagOverride = 1 } = {}
) {
  const state = stateFromPrintableQuery(query, isSystemManager);
  const trimmedQuery = typeof state.q === "string" ? state.q.trim() : "";
  const skuSearch = looksLikePrintableSku(trimmedQuery);

  return {
    state,
    payload: {
      query: skuSearch ? "" : trimmedQuery,
      filters: state.filters,
      sort_by: state.sort_by,
      page: 1,
      page_length: pageLength,
      include_inactive: state.include_inactive,
      item_code_hint: skuSearch ? trimmedQuery : "",
      feature_flag_override: featureFlagOverride,
    },
  };
}

export function applyPrintableLimit(products = [], totalCount = 0, limit = PRINT_PRODUCT_LIMIT) {
  const safeProducts = Array.isArray(products) ? products : [];
  const numericTotal = Number(totalCount);
  const resolvedTotal = Number.isFinite(numericTotal) && numericTotal >= 0
    ? numericTotal
    : safeProducts.length;

  return {
    items: safeProducts.slice(0, limit),
    totalCount: resolvedTotal,
    printCount: Math.min(limit, safeProducts.length),
    isLimited: resolvedTotal > limit || safeProducts.length > limit,
    limit,
  };
}

export function getEffectivePrintPrice(document = {}) {
  const rate = Number(document?.rate);
  const offerRate = Number(document?.offer_rate);
  if (offerRate > 0 && rate > 0 && offerRate < rate) {
    return offerRate;
  }
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

export function formatPrintPrice(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "Price on request";
  }
  return `AED ${numeric.toFixed(2)}`;
}

export function escapePrintHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildPrintableHtml({
  products = [],
  totalCount = 0,
  printCount = 0,
  queryLabel = "",
  generatedAt = "",
  title = "IHG Product List",
} = {}) {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeTitle = escapePrintHtml(title);
  const safeQueryLabel = typeof queryLabel === "string" ? queryLabel.trim() : "";
  const subtitleBits = [];

  if (safeQueryLabel) {
    subtitleBits.push(`Search: ${safeQueryLabel}`);
  }
  subtitleBits.push(`Matching products: ${Number(totalCount) || safeProducts.length}`);
  subtitleBits.push(`Printing: ${Number(printCount) || safeProducts.length}`);
  if (generatedAt) {
    subtitleBits.push(`Generated: ${generatedAt}`);
  }

  const cardsMarkup = safeProducts
    .map((product) => {
      const imageUrl = escapePrintHtml(product?.image_url || "/empty-states.png");
      const itemCode = escapePrintHtml(product?.item_code || "-");
      const itemName = escapePrintHtml(product?.item_name || product?.item_code || "Unnamed product");
      const priceLabel = escapePrintHtml(product?.price_label || "Price on request");

      return `
        <article class="print-card">
          <div class="print-card__image-wrap">
            <img class="print-card__image" src="${imageUrl}" alt="${itemName}" loading="eager" />
          </div>
          <div class="print-card__meta">
            <p class="print-card__code">${itemCode}</p>
            <p class="print-card__name">${itemName}</p>
            <p class="print-card__price">${priceLabel}</p>
          </div>
        </article>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 10mm;
      }

      * {
        box-sizing: border-box;
      }

      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #111827;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      }

      body {
        padding: 8mm;
      }

      .print-shell {
        width: 100%;
      }

      .print-header {
        margin-bottom: 8mm;
        border-bottom: 1px solid #dbe3ec;
        padding-bottom: 4mm;
      }

      .print-title {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      .print-subtitle {
        margin: 2mm 0 0;
        font-size: 10px;
        line-height: 1.5;
        color: #6b7280;
      }

      .print-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 4mm;
      }

      .print-card {
        break-inside: avoid;
        page-break-inside: avoid;
        border: 1px solid #dbe3ec;
        border-radius: 10px;
        padding: 3mm;
        min-height: 64mm;
        display: flex;
        flex-direction: column;
        background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      }

      .print-card__image-wrap {
        border-radius: 8px;
        background: #ffffff;
        border: 1px solid #eef2f7;
        height: 30mm;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .print-card__image {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .print-card__meta {
        display: flex;
        flex: 1;
        flex-direction: column;
        margin-top: 3mm;
      }

      .print-card__code {
        margin: 0 0 1.2mm;
        font-size: 8px;
        line-height: 1.35;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #64748b;
        word-break: break-word;
      }

      .print-card__name {
        margin: 0;
        font-size: 10px;
        line-height: 1.35;
        color: #111827;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 40px;
      }

      .print-card__price {
        margin: auto 0 0;
        padding-top: 3mm;
        font-size: 10px;
        font-weight: 700;
        color: #0f172a;
      }

      @media print {
        body {
          padding: 0;
        }

        .print-card {
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <main class="print-shell">
      <header class="print-header">
        <h1 class="print-title">${safeTitle}</h1>
        <p class="print-subtitle">${escapePrintHtml(subtitleBits.join(" | "))}</p>
      </header>
      <section class="print-grid">
        ${cardsMarkup}
      </section>
    </main>
    <script>
      (function () {
        var waitForImages = function () {
          var images = Array.prototype.slice.call(document.images || []);
          if (!images.length) {
            return Promise.resolve();
          }
          return Promise.allSettled(images.map(function (img) {
            if (img.complete) return Promise.resolve();
            return new Promise(function (resolve) {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }));
        };

        window.addEventListener("load", function () {
          waitForImages().then(function () {
            window.setTimeout(function () {
              window.focus();
              window.print();
            }, 250);
          });
        });

        window.addEventListener("afterprint", function () {
          window.setTimeout(function () {
            window.close();
          }, 150);
        });
      })();
    <\/script>
  </body>
</html>`;
}
