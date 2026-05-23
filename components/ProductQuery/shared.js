import { getStoredUserProfile, PRODUCT_TEAM_ADMIN_ROLES, SUPER_ADMIN_ROLES } from "@/libs/api";

export const PRODUCT_QUERY_TYPES = [
  { value: "general_query", label: "General question" },
  { value: "wrong_spec", label: "Wrong spec" },
  { value: "missing_spec", label: "Missing spec" },
  { value: "wrong_image", label: "Wrong image" },
  { value: "wrong_category_brand", label: "Wrong category / brand" },
  { value: "duplicate_product", label: "Duplicate product" },
  { value: "stock_pricing_mismatch", label: "Stock / pricing mismatch" },
  { value: "other", label: "Other" },
];

export const PRODUCT_QUERY_SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const PRODUCT_QUERY_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "awaiting_reporter", label: "Awaiting reply" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "reopened", label: "Reopened" },
];

export const PRODUCT_QUERY_STAGES = [
  { value: "chat", label: "Chat" },
  { value: "ticket", label: "Ticket" },
];

export function isProductTeamAdminRoleList(roles = []) {
  return PRODUCT_TEAM_ADMIN_ROLES.some((role) => roles.includes(role));
}

export function isSuperAdminRoleList(roles = []) {
  return SUPER_ADMIN_ROLES.some((role) => roles.includes(role));
}

export function getProductTeamAdminFlag() {
  return isProductTeamAdminRoleList(getStoredUserProfile().roles);
}

export function getSuperAdminFlag() {
  return isSuperAdminRoleList(getStoredUserProfile().roles);
}

export function getQueryStatusMeta(status) {
  const normalized = String(status || "").toLowerCase();
  const toneMap = {
    open: "bg-[#fff1f2] text-[#be123c] border-[#fecdd3]",
    in_progress: "bg-[#fffbeb] text-[#b45309] border-[#fde68a]",
    awaiting_reporter: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
    resolved: "bg-[#ecfdf3] text-[#047857] border-[#a7f3d0]",
    closed: "bg-[#f8fafc] text-[#475569] border-[#dbe3ec]",
    reopened: "bg-[#fdf2f8] text-[#be185d] border-[#fbcfe8]",
  };

  return {
    label: PRODUCT_QUERY_STATUSES.find((option) => option.value === normalized)?.label || "Status",
    className: toneMap[normalized] || toneMap.closed,
  };
}

export function formatQueryLabel(options, value, fallback = "—") {
  return options.find((option) => option.value === value)?.label || fallback;
}

export function buildProductQueryContext(product = {}) {
  const safeProduct = product || {};
  const itemCode = safeProduct.item_code || safeProduct.name || "";
  const itemName = safeProduct.item_name || safeProduct.item || safeProduct.item_name_snapshot || "";

  return {
    item_code: itemCode,
    item_name_snapshot: itemName,
    brand: safeProduct.brand || "",
    category_list: safeProduct.category_list || safeProduct.item_group || "",
    website_image_url: safeProduct.website_image_url || safeProduct.image || "",
    product_reference: safeProduct,
  };
}

/** Human-readable "x ago" for ISO/Frappe datetimes. */
export function formatRelativeTime(value) {
  if (!value) return "";
  const ts = new Date(String(value).replace(" ", "T")).getTime();
  if (Number.isNaN(ts)) return "";
  const diff = Date.now() - ts;
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}

/** Compact duration from seconds, e.g. 5400 -> "1h 30m". */
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "—";
  const s = Number(seconds);
  if (Number.isNaN(s) || s < 0) return "—";
  if (s < 60) return `${Math.round(s)}s`;
  const min = Math.floor(s / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  if (hr < 24) return remMin ? `${hr}h ${remMin}m` : `${hr}h`;
  const day = Math.floor(hr / 24);
  const remHr = hr % 24;
  return remHr ? `${day}d ${remHr}h` : `${day}d`;
}
