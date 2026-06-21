import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PRINT_PRODUCT_LIMIT,
  applyPrintableLimit,
  buildPrintableSearchRequest,
  formatPrintPrice,
  getEffectivePrintPrice,
} from "../listPrint.mjs";

test("buildPrintableSearchRequest: maps standard list query to a first-page 500-item request", () => {
  const { state, payload } = buildPrintableSearchRequest({
    q: "track light",
    sort_by: "rate:asc",
    page: "3",
    page_length: "100",
    search_v2: "1",
    brand: ["Targetti", "Lumenwerx"],
    category_list: "Indoor",
    in_stock: "0",
    show_promotion: "1",
    rate_min: "100",
    rate_max: "250",
  });

  assert.equal(state.q, "track light");
  assert.equal(state.page, 3);
  assert.equal(state.page_length, 100);
  assert.equal(state.search_v2, true);
  assert.deepEqual(state.filters.brand, ["Targetti", "Lumenwerx"]);
  assert.deepEqual(state.filters.category_list, ["Indoor"]);
  assert.equal(state.filters.in_stock, false);
  assert.equal(state.filters.show_promotion, true);
  assert.deepEqual(state.filters.rate_range, { min: "100", max: "250" });

  assert.deepEqual(payload, {
    query: "track light",
    filters: state.filters,
    sort_by: "rate:asc",
    page: 1,
    page_length: PRINT_PRODUCT_LIMIT,
    include_inactive: false,
    item_code_hint: "",
    feature_flag_override: 1,
  });
});

test("buildPrintableSearchRequest: preserves applied URL filters from AI/guided search state", () => {
  const { state, payload } = buildPrintableSearchRequest({
    q: "warm dim downlight",
    search_v2: "1",
    sort_by: "stock:desc",
    product_type: ["Downlight"],
    color_temp: ["3000K"],
    mounting: ["Recessed"],
    power_value_min: "8",
    power_value_max: "12",
    in_stock: "1",
  });

  assert.equal(state.search_v2, true);
  assert.equal(state.sort_by, "stock:desc");
  assert.deepEqual(state.filters.product_type, ["Downlight"]);
  assert.deepEqual(state.filters.color_temp, ["3000K"]);
  assert.deepEqual(state.filters.mounting, ["Recessed"]);
  assert.deepEqual(state.filters.power_value_range, { min: "8", max: "12" });
  assert.equal(payload.query, "warm dim downlight");
  assert.equal(payload.item_code_hint, "");
});

test("buildPrintableSearchRequest: defaults safely when query params are missing", () => {
  const { state, payload } = buildPrintableSearchRequest({});

  assert.equal(state.q, "");
  assert.equal(state.sort_by, "");
  assert.equal(state.page, 1);
  assert.equal(state.page_length, 20);
  assert.equal(state.search_v2, false);
  assert.equal(state.filters.in_stock, null);
  assert.equal(state.filters.show_promotion, false);

  assert.equal(payload.page, 1);
  assert.equal(payload.page_length, PRINT_PRODUCT_LIMIT);
  assert.equal(payload.query, "");
  assert.equal(payload.item_code_hint, "");
});

test("buildPrintableSearchRequest: converts SKU-like searches to item_code_hint requests", () => {
  const { payload } = buildPrintableSearchRequest({
    q: "LED-1001",
  });

  assert.equal(payload.query, "");
  assert.equal(payload.item_code_hint, "LED-1001");
});

test("applyPrintableLimit: keeps all products when results are under the limit", () => {
  const result = applyPrintableLimit([{ id: 1 }, { id: 2 }], 2, 500);

  assert.equal(result.isLimited, false);
  assert.equal(result.printCount, 2);
  assert.equal(result.totalCount, 2);
  assert.deepEqual(result.items, [{ id: 1 }, { id: 2 }]);
});

test("applyPrintableLimit: keeps all products when results are exactly at the limit", () => {
  const items = Array.from({ length: 500 }, (_, index) => ({ id: index + 1 }));
  const result = applyPrintableLimit(items, 500, 500);

  assert.equal(result.isLimited, false);
  assert.equal(result.printCount, 500);
  assert.equal(result.items.length, 500);
});

test("applyPrintableLimit: trims to the first 500 products when total results are above the limit", () => {
  const items = Array.from({ length: 500 }, (_, index) => ({ id: index + 1 }));
  const result = applyPrintableLimit(items, 781, 500);

  assert.equal(result.isLimited, true);
  assert.equal(result.limit, 500);
  assert.equal(result.totalCount, 781);
  assert.equal(result.printCount, 500);
  assert.equal(result.items.length, 500);
  assert.deepEqual(result.items[0], { id: 1 });
  assert.deepEqual(result.items[499], { id: 500 });
});

test("getEffectivePrintPrice: prefers a valid promo price", () => {
  assert.equal(getEffectivePrintPrice({ rate: 125, offer_rate: 99 }), 99);
  assert.equal(formatPrintPrice(getEffectivePrintPrice({ rate: 125, offer_rate: 99 })), "AED 99.00");
});

test("getEffectivePrintPrice: falls back to regular rate when promo is absent or invalid", () => {
  assert.equal(getEffectivePrintPrice({ rate: 125, offer_rate: 140 }), 125);
  assert.equal(getEffectivePrintPrice({ rate: 125, offer_rate: 0 }), 125);
  assert.equal(getEffectivePrintPrice({ rate: 0, offer_rate: 0 }), 0);
  assert.equal(formatPrintPrice(getEffectivePrintPrice({ rate: 0, offer_rate: 0 })), "Price on request");
});
