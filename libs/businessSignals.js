function firstNumber(...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return NaN;
}

export function getBusinessSignals(source = {}) {
  const starRating = firstNumber(
    source.product_star_rating,
    source.star_rating,
    source.product_rating
  );
  const customerCount = firstNumber(
    source.customer_count,
    source.invoice_count,
    source.happy_customers
  );
  const soldQty = firstNumber(
    source.total_sold_qty_lifetime,
    source.total_sold_qty,
    source.sold_qty_lifetime,
    source.sold_qty
  );

  return {
    starRating,
    customerCount,
    soldQty,
    hasStarRating: Number.isFinite(starRating) && starRating > 0,
    hasCustomerCount: Number.isFinite(customerCount) && customerCount > 0,
    hasSoldQty: Number.isFinite(soldQty) && soldQty > 0,
  };
}

export function formatStarRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  return `${(Math.round(numeric * 10) / 10).toFixed(1)} / 5`;
}

export function formatPlusCount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  const rounded = Math.floor(numeric);
  return `${new Intl.NumberFormat("en-US").format(rounded)}+`;
}

export function formatHappyCustomers(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count <= 0) {
    return "-";
  }
  return `${formatPlusCount(count)} customers`;
}

export function formatLifetimeSoldQty(value) {
  const qty = Number(value);
  if (!Number.isFinite(qty) || qty <= 0) {
    return "-";
  }
  return `${formatPlusCount(qty)} qty sold`;
}
