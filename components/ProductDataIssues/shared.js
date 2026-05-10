import { getStoredUserProfile, PRODUCT_DATA_MANAGER_ROLES } from "@/libs/api";

export const PRODUCT_DATA_ISSUE_TYPES = [
  { value: "wrong_spec", label: "Wrong spec" },
  { value: "missing_spec", label: "Missing spec" },
  { value: "wrong_image", label: "Wrong image" },
  { value: "wrong_category_brand", label: "Wrong category / brand" },
  { value: "duplicate_product", label: "Duplicate product" },
  { value: "stock_pricing_mismatch", label: "Stock / pricing mismatch" },
  { value: "other", label: "Other" },
];

export const PRODUCT_DATA_ISSUE_SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const PRODUCT_DATA_ISSUE_STATUSES = [
  { value: "open", label: "Open" },
  { value: "triaged", label: "Triaged" },
  { value: "in_progress", label: "In Progress" },
  { value: "fixed", label: "Fixed" },
  { value: "closed", label: "Closed" },
  { value: "reopened", label: "Reopened" },
];

export const PRODUCT_DATA_AFFECTED_FIELDS = [
  { value: "item_name", label: "Product name" },
  { value: "description", label: "Description" },
  { value: "item_description", label: "Short description" },
  { value: "website_image_url", label: "Product image" },
  { value: "brand", label: "Brand" },
  { value: "category_list", label: "Category" },
  { value: "item_group", label: "Item group" },
  { value: "power", label: "Power" },
  { value: "color_temp", label: "Color temperature" },
  { value: "ip_rate", label: "IP rating" },
  { value: "beam_angle", label: "Beam angle" },
  { value: "input_voltage", label: "Input voltage" },
  { value: "output_current", label: "Output current" },
  { value: "output_voltage", label: "Output voltage" },
  { value: "stock", label: "Stock" },
  { value: "rate", label: "Price" },
  { value: "other", label: "Other" },
];

export function isProductDataManagerRoleList(roles = []) {
  return PRODUCT_DATA_MANAGER_ROLES.some((role) => roles.includes(role));
}

export function getProductDataIssueManagerFlag() {
  return isProductDataManagerRoleList(getStoredUserProfile().roles);
}

export function getProductIssueStatusMeta(status) {
  const normalized = String(status || "").toLowerCase();
  const toneMap = {
    open: "bg-[#fff1f2] text-[#be123c] border-[#fecdd3]",
    triaged: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
    in_progress: "bg-[#fffbeb] text-[#b45309] border-[#fde68a]",
    fixed: "bg-[#ecfdf3] text-[#047857] border-[#a7f3d0]",
    closed: "bg-[#f8fafc] text-[#475569] border-[#dbe3ec]",
    reopened: "bg-[#fdf2f8] text-[#be185d] border-[#fbcfe8]",
  };

  return {
    label:
      PRODUCT_DATA_ISSUE_STATUSES.find((option) => option.value === normalized)?.label ||
      "Status",
    className: toneMap[normalized] || toneMap.closed,
  };
}

export function formatIssueLabel(options, value, fallback = "Select option") {
  return options.find((option) => option.value === value)?.label || fallback;
}

export function buildProductIssueContext(product = {}) {
  const safeProduct = product || {};
  const itemCode = safeProduct.item_code || safeProduct.name || "";
  const itemName = safeProduct.item_name || safeProduct.item || "";

  return {
    item_code: itemCode,
    item_name_snapshot: itemName,
    brand: safeProduct.brand || "",
    category_list: safeProduct.category_list || safeProduct.item_group || "",
    website_image_url: safeProduct.website_image_url || safeProduct.image || "",
    product_reference: safeProduct,
  };
}

export function getCurrentFieldValue(product = {}, field) {
  if (!field || field === "other") return "";
  const safeProduct = product || {};

  const source = {
    ...safeProduct,
    description: safeProduct.description || safeProduct.full_description || "",
    item_description: safeProduct.item_description || safeProduct.description || "",
    website_image_url: safeProduct.website_image_url || safeProduct.image || "",
    color_temp: safeProduct.color_temp || safeProduct.color_temp_ || "",
    stock: safeProduct.stock,
    rate: safeProduct.offer_rate > 0 ? safeProduct.offer_rate : safeProduct.rate,
  };

  const value = source[field];
  if (value === undefined || value === null) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (_) {
      return "";
    }
  }

  return String(value);
}

export function getIssueSummaryCounts(items = []) {
  return items.reduce(
    (summary, item) => {
      const status = item?.status || "open";
      summary.total += 1;
      summary[status] = (summary[status] || 0) + 1;
      return summary;
    },
    { total: 0 }
  );
}
