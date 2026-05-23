const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const sumStockRows = (rows = []) =>
  rows.reduce((total, row) => {
    if (row === null || row === undefined) {
      return total;
    }

    if (typeof row === "number" || typeof row === "string") {
      const numeric = toFiniteNumber(row);
      return numeric !== null ? total + numeric : total;
    }

    const actualQty = toFiniteNumber(row?.actual_qty);
    if (actualQty !== null) {
      return total + actualQty;
    }

    const availableQty = toFiniteNumber(row?.available_qty);
    if (availableQty !== null) {
      return total + availableQty;
    }

    const fallbackQty = toFiniteNumber(row?.qty ?? row?.stock);
    return fallbackQty !== null ? total + fallbackQty : total;
  }, 0);

const parseInStockFlag = (value) => {
  if (value === true || value === 1 || value === "1") {
    return true;
  }
  if (value === false || value === 0 || value === "0") {
    return false;
  }
  return null;
};

export const resolveStockQty = (document = {}) => {
  const totalStock = toFiniteNumber(document?.total_stock);
  if (totalStock !== null) {
    return totalStock;
  }

  if (Array.isArray(document?.stock_rows) && document.stock_rows.length > 0) {
    return sumStockRows(document.stock_rows);
  }

  if (Array.isArray(document?.stock) && document.stock.length > 0) {
    return sumStockRows(document.stock);
  }

  const stock = toFiniteNumber(document?.stock);
  if (stock !== null) {
    return stock;
  }

  return 0;
};

export const resolveInStock = (document = {}) => {
  const explicit = parseInStockFlag(document?.in_stock);
  if (explicit !== null) {
    return explicit;
  }
  return resolveStockQty(document) > 0;
};

export const formatStockQty = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  if (Number.isInteger(numeric)) {
    return numeric.toLocaleString();
  }

  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};
