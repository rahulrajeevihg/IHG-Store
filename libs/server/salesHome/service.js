// Sales-home talks to the self-hosted dev bench (igh_search lives there), which is a
// different target from the app-wide ERP_BASE_URL (Frappe Cloud). Prefer SALES_HOME_*
// overrides so we don't redirect the whole app's ERP traffic; fall back to shared vars.
const ERP_BASE_URL = (process.env.SALES_HOME_ERP_BASE_URL || process.env.ERP_BASE_URL || "http://167.71.204.41").replace(/\/+$/, "");
const ERP_API_KEY = process.env.SALES_HOME_ERP_API_KEY || process.env.ERP_API_KEY || "";
const ERP_API_SECRET = process.env.SALES_HOME_ERP_API_SECRET || process.env.ERP_API_SECRET || "";
const ERP_USERNAME = process.env.SALES_HOME_ERP_USERNAME || process.env.ERP_USERNAME || "";
const ERP_PASSWORD = process.env.SALES_HOME_ERP_PASSWORD || process.env.ERP_PASSWORD || "";
const SALES_HOME_CACHE_TTL_MS = Math.max(300000, Number(process.env.SALES_HOME_CACHE_TTL_MS || 600000));
const ERP_TIMEOUT_MS = Math.max(10000, Number(process.env.ERP_TIMEOUT_MS || 30000));

const cacheStore = new Map();
let loginSession = {
  cookie: "",
  csrfToken: "",
  expiresAt: 0,
};

const QUICK_ACTIONS = [
  { label: "Create Order", route: "/list" },
  { label: "Check Stock", route: "/search" },
  { label: "Customer Ledger", route: "/profile" },
  { label: "Outstanding", route: "/profile" },
  { label: "New Arrivals", route: "/search/New%20Arrivals" },
  { label: "Credit Note", route: "/search/Credit%20Note" },
  { label: "Catalogs", route: "/brands" },
  { label: "Share Product", route: "/search" },
];

function nowIso() {
  return new Date().toISOString();
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(date) {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function formatDateYMD(date) {
  return date.toISOString().slice(0, 10);
}

function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getLastMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function getLastMonthEnd(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 0);
}

function getSixMonthsAgoStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() - 5, 1);
}

function getWeekAgo(date = new Date()) {
  return new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
}

function normalizeFilters(filters = []) {
  return Array.isArray(filters) ? filters : [];
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeMethodPayload(responsePayload) {
  const payload = responsePayload?.message || responsePayload || {};
  if (String(payload?.status || "").toLowerCase() === "error") {
    throw new Error(payload?.message || "ERP method returned an error status.");
  }
  return payload;
}

function parseSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const one = response.headers.get("set-cookie");
  return one ? [one] : [];
}

function extractCookieKV(setCookieHeaders, key) {
  if (!Array.isArray(setCookieHeaders)) return "";
  for (const value of setCookieHeaders) {
    const match = String(value).match(new RegExp(`${key}=([^;]+)`));
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return "";
}

async function withTimeout(task, timeoutMs = ERP_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new DOMException("ERP request timed out", "TimeoutError"));
  }, timeoutMs);

  try {
    return await task(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

function getTokenAuthHeader() {
  if (!ERP_API_KEY || !ERP_API_SECRET) return "";
  return `token ${ERP_API_KEY}:${ERP_API_SECRET}`;
}

async function ensureLoginSession() {
  const now = Date.now();
  if (loginSession.cookie && loginSession.expiresAt > now + 60000) {
    return loginSession;
  }

  if (!ERP_USERNAME || !ERP_PASSWORD) {
    throw new Error("ERP_USERNAME/ERP_PASSWORD not configured for login auth fallback.");
  }

  const loginBody = new URLSearchParams({
    usr: ERP_USERNAME,
    pwd: ERP_PASSWORD,
  }).toString();

  const response = await withTimeout((signal) =>
    fetch(`${ERP_BASE_URL}/api/method/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: loginBody,
      redirect: "manual",
      signal,
    })
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`ERP login failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const setCookieHeaders = parseSetCookieHeaders(response);
  const sid = extractCookieKV(setCookieHeaders, "sid");
  const userId = extractCookieKV(setCookieHeaders, "user_id");
  const csrfToken = extractCookieKV(setCookieHeaders, "csrf_token");

  if (!sid) {
    throw new Error("ERP login succeeded but sid cookie missing.");
  }

  const cookieParts = [`sid=${sid}`];
  if (userId) cookieParts.push(`user_id=${encodeURIComponent(userId)}`);
  if (csrfToken) cookieParts.push(`csrf_token=${encodeURIComponent(csrfToken)}`);

  loginSession = {
    cookie: cookieParts.join("; "),
    csrfToken,
    expiresAt: Date.now() + 45 * 60 * 1000,
  };

  return loginSession;
}

async function erpRequest(path, { method = "GET", query = {}, body } = {}) {
  const qs = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    qs.set(key, typeof value === "string" ? value : JSON.stringify(value));
  });

  const url = `${ERP_BASE_URL}${path}${qs.toString() ? `?${qs.toString()}` : ""}`;

  const headers = {
    Accept: "application/json",
  };

  let authStrategy = "token";
  const tokenHeader = getTokenAuthHeader();
  if (tokenHeader) {
    headers.Authorization = tokenHeader;
  } else {
    authStrategy = "session";
    const session = await ensureLoginSession();
    headers.Cookie = session.cookie;
    if (session.csrfToken) {
      headers["X-Frappe-CSRF-Token"] = session.csrfToken;
    }
  }

  let payloadBody;
  if (body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json";
    payloadBody = JSON.stringify(body);
  }

  const response = await withTimeout((signal) =>
    fetch(url, {
      method,
      headers,
      body: payloadBody,
      signal,
      redirect: "manual",
    })
  );

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const asJson = contentType.includes("application/json") && text
    ? JSON.parse(text)
    : text
      ? { message: text }
      : {};

  if (!response.ok) {
    const errorMessage = asJson?.message?.message || asJson?.message || `ERP request failed (${response.status})`;
    if (authStrategy === "session") {
      loginSession = { cookie: "", csrfToken: "", expiresAt: 0 };
    }
    throw new Error(errorMessage);
  }

  return asJson;
}

async function erpMethod(methodName, payload = {}) {
  return erpRequest(`/api/method/${methodName}`, {
    method: "POST",
    body: payload,
  });
}

async function erpResourceList(doctype, { fields = ["name"], filters = [], orderBy = "modified desc", limit = 100, start = 0 } = {}) {
  return erpRequest(`/api/resource/${encodeURIComponent(doctype)}`, {
    method: "GET",
    query: {
      fields,
      filters: normalizeFilters(filters),
      order_by: orderBy,
      limit_page_length: limit,
      limit_start: start,
    },
  });
}

function getOrSetCache(cacheKey, ttlMs, loader) {
  const existing = cacheStore.get(cacheKey);
  if (existing && existing.expiresAt > Date.now()) {
    return Promise.resolve({ data: existing.data, cached: true });
  }

  return loader().then((data) => {
    cacheStore.set(cacheKey, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
    return { data, cached: false };
  });
}

function resolveImageUrl(img) {
  const s = String(img || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${ERP_BASE_URL}${s}`;
  return s;
}

function mapProductRow(row, qtyKey, amountKey) {
  return {
    itemCode: row?.item_code || "",
    itemName: row?.item_name || row?.item_code || "Unknown item",
    qty: toNumber(row?.[qtyKey]),
    amount: toNumber(row?.[amountKey]),
    image: resolveImageUrl(row?.image),
  };
}

function getMonthSalesBuckets(invoices = []) {
  const buckets = new Map();
  invoices.forEach((invoice) => {
    const date = new Date(invoice?.posting_date || invoice?.creation || Date.now());
    if (Number.isNaN(date.getTime())) return;
    const key = monthKey(date);
    const amount = toNumber(invoice?.grand_total || invoice?.base_grand_total || invoice?.net_total || 0);
    const signed = Number(invoice?.is_return) === 1 ? -Math.abs(amount) : amount;
    buckets.set(key, (buckets.get(key) || 0) + signed);
  });
  return buckets;
}

function sumByDateRange(invoices, fromDate, toDate) {
  const from = new Date(fromDate).getTime();
  const to = new Date(toDate).getTime();
  return invoices.reduce((sum, row) => {
    const date = new Date(row?.posting_date || row?.creation || 0).getTime();
    if (!Number.isFinite(date) || date < from || date > to) return sum;
    const amount = toNumber(row?.grand_total || row?.base_grand_total || row?.net_total || 0);
    const signed = Number(row?.is_return) === 1 ? -Math.abs(amount) : amount;
    return sum + signed;
  }, 0);
}

function buildMockAllPayload() {
  const generatedAt = nowIso();
  return {
    profile: {
      salesPersonName: "Sales Executive",
      image: "",
      designation: "Sales Executive",
      territory: "General",
      branch: "Main",
      rank: 1,
      totalSalesReps: 1,
    },
    performance: {
      thisMonthSales: 720000,
      thisMonthTarget: 1000000,
      achievementPercentage: 72,
      remainingTarget: 280000,
      lastMonthSales: 640000,
      lastMonthTarget: 900000,
      totalOutstanding: 185000,
      outstandingCustomerCount: 12,
    },
    insights: [
      { id: "insight-1", severity: "warning", title: "Target trajectory", message: "You are 12% behind compared to last month pace." },
      { id: "insight-2", severity: "info", title: "Trending category", message: "PVC category is trending in your territory." },
      { id: "insight-3", severity: "critical", title: "Overdue receivables", message: "3 customers have pending payments above 60 days." },
      { id: "insight-4", severity: "warning", title: "Low stock signal", message: "Lighting products stock is running low." },
    ],
    categories: [
      { category: "Electrical", productCount: 1234, salesAmount: 244000 },
      { category: "Plumbing", productCount: 987, salesAmount: 190000 },
      { category: "Lighting", productCount: 876, salesAmount: 121000 },
      { category: "Hardware", productCount: 765, salesAmount: 88000 },
      { category: "Tools", productCount: 654, salesAmount: 77000 },
    ],
    productLists: {
      newArrivalsTop10: [],
      backToStockTop10: [],
      topSellingThisMonthTop10: [],
      topSellingLastMonthTop10: [],
      topSellingThisWeekTop10: [],
    },
    charts: {
      monthlySalesLast6Months: [],
      salesVsTargetCurrentMonth: [],
      productTrend: [],
      categoryPerformance: [],
    },
    customers: {
      recentlyOrderedCustomers: [],
      customersWithOutstanding: [],
      inactive30PlusDays: [],
      topBuyingCustomers: [],
      frequentlyReturnedItems: [],
    },
    quickActions: QUICK_ACTIONS,
    meta: {
      generatedAt,
      cacheTtlSeconds: Math.floor(SALES_HOME_CACHE_TTL_MS / 1000),
      mockData: true,
      source: "mock",
    },
  };
}

function buildSalesVsTargetCurrentMonth(thisMonthSales, thisMonthTarget) {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  const chart = [];

  for (let day = 1; day <= currentDay; day += 1) {
    const ratio = day / currentDay;
    chart.push({
      label: `${day} ${today.toLocaleDateString("en-US", { month: "short" })}`,
      sales: Number((thisMonthSales * ratio).toFixed(2)),
      target: Number((thisMonthTarget * (day / daysInMonth)).toFixed(2)),
    });
  }

  return chart;
}

function buildMonthlySalesLast6Months(monthBuckets, monthTargets = {}) {
  const now = new Date();
  const chart = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    chart.push({
      label: formatMonth(d),
      sales: Number((monthBuckets.get(key) || 0).toFixed(2)),
      target: Number((monthTargets[key] || 0).toFixed(2)),
    });
  }
  return chart;
}

function topCustomersFromInvoices(invoices, { requireOutstanding = false, limit = 5 } = {}) {
  const grouped = new Map();
  invoices.forEach((invoice) => {
    const customerName = invoice?.customer_name || invoice?.customer || "Unknown Customer";
    const amount = toNumber(invoice?.grand_total || invoice?.base_grand_total || invoice?.net_total || 0);
    const outstanding = toNumber(invoice?.outstanding_amount || 0);
    if (requireOutstanding && outstanding <= 0) return;
    const current = grouped.get(customerName) || {
      customerName,
      value: 0,
      outstanding: 0,
      lastDate: invoice?.posting_date || invoice?.creation || "",
    };
    current.value += amount;
    current.outstanding += outstanding;
    if ((invoice?.posting_date || "") > current.lastDate) {
      current.lastDate = invoice?.posting_date;
    }
    grouped.set(customerName, current);
  });

  return [...grouped.values()]
    .sort((a, b) => (requireOutstanding ? b.outstanding - a.outstanding : b.value - a.value))
    .slice(0, limit)
    .map((row) => ({
      customerName: row.customerName,
      value: requireOutstanding ? row.outstanding : row.value,
      dateLabel: row.lastDate || "",
      extraLabel: requireOutstanding ? "Outstanding" : "Ordered",
    }));
}

function buildInactiveCustomers(invoices, limit = 5) {
  const lastOrderByCustomer = new Map();
  invoices.forEach((invoice) => {
    const customerName = invoice?.customer_name || invoice?.customer || "Unknown Customer";
    const postingDate = invoice?.posting_date || invoice?.creation;
    if (!postingDate) return;
    const last = lastOrderByCustomer.get(customerName);
    if (!last || postingDate > last) {
      lastOrderByCustomer.set(customerName, postingDate);
    }
  });

  const now = Date.now();
  return [...lastOrderByCustomer.entries()]
    .map(([customerName, dateString]) => {
      const diffDays = Math.floor((now - new Date(dateString).getTime()) / (24 * 60 * 60 * 1000));
      return { customerName, diffDays, dateString };
    })
    .filter((row) => row.diffDays >= 30)
    .sort((a, b) => b.diffDays - a.diffDays)
    .slice(0, limit)
    .map((row) => ({
      customerName: row.customerName,
      value: 0,
      dateLabel: row.dateString,
      extraLabel: `Last order ${row.diffDays} days ago`,
    }));
}

async function fetchAllFromErp({ salesUser = "", salesUserName = "" } = {}) {
  const now = new Date();
  const currentMonthStart = getMonthStart(now);
  const lastMonthStart = getLastMonthStart(now);
  const lastMonthEnd = getLastMonthEnd(now);
  const sixMonthsStart = getSixMonthsAgoStart(now);
  const weekAgo = getWeekAgo(now);

  const [dashboardRaw, quotationsRaw, invoicesRaw, salesPersonsRaw, lowStockRaw] = await Promise.all([
    erpMethod("igh_search.igh_search.api.get_sales_dashboard_reports", {}),
    erpMethod("igh_search.igh_search.api.get_recent_quotations", {}),
    erpResourceList("Sales Invoice", {
      fields: [
        "name",
        "posting_date",
        "creation",
        "customer",
        "customer_name",
        "grand_total",
        "base_grand_total",
        "net_total",
        "outstanding_amount",
        "is_return",
      ],
      filters: [["docstatus", "=", 1], ["posting_date", ">=", formatDateYMD(sixMonthsStart)]],
      orderBy: "posting_date desc",
      limit: 1200,
    }),
    erpResourceList("Sales Person", {
      // NOTE: Sales Person has no `territory` field — including it makes ERPNext throw
      // DataError (HTTP 417), which previously failed the whole batch → mock fallback.
      fields: ["name", "employee", "parent_sales_person"],
      orderBy: "modified desc",
      limit: 500,
    }),
    erpResourceList("Bin", {
      fields: ["item_code", "actual_qty", "projected_qty", "warehouse"],
      orderBy: "actual_qty asc",
      limit: 200,
    }),
  ]);

  const dashboard = normalizeMethodPayload(dashboardRaw);
  const quotationsPayload = normalizeMethodPayload(quotationsRaw);
  const quotations = normalizeArray(quotationsPayload?.data);
  const invoices = normalizeArray(invoicesRaw?.data);
  const salesPersons = normalizeArray(salesPersonsRaw?.data);
  const lowStockRows = normalizeArray(lowStockRaw?.data);

  const salespersonReport = normalizeArray(dashboard?.salesperson_report_mtd).map((row) => ({
    sales_person: row?.sales_person || "",
    total_sales: toNumber(row?.total_sales),
    sold_item_count: toNumber(row?.sold_item_count),
  }));

  // Resolve the logged-in user to their Sales Person + Employee.
  // Chain: app login email -> Employee.user_id -> Sales Person.employee.
  // We DO NOT fall back to "first sales person" any more — an unidentified viewer should
  // never be shown someone else's identity.
  const loginUser = String(salesUser || "").trim();
  let resolvedSalesPersonName = "";
  let resolvedEmployeeId = "";
  if (loginUser) {
    try {
      if (loginUser.includes("@")) {
        const empRaw = await erpResourceList("Employee", {
          fields: ["name"],
          filters: [["user_id", "=", loginUser]],
          limit: 1,
        });
        resolvedEmployeeId = normalizeArray(empRaw?.data)[0]?.name || "";
        if (resolvedEmployeeId) {
          const spRaw = await erpResourceList("Sales Person", {
            fields: ["name"],
            filters: [["employee", "=", resolvedEmployeeId]],
            limit: 1,
          });
          resolvedSalesPersonName = normalizeArray(spRaw?.data)[0]?.name || "";
        }
      }
      if (!resolvedSalesPersonName) {
        const spRaw = await erpResourceList("Sales Person", {
          fields: ["name", "employee"],
          filters: [["name", "=", loginUser]],
          limit: 1,
        });
        const sp = normalizeArray(spRaw?.data)[0];
        if (sp) {
          resolvedSalesPersonName = sp.name;
          resolvedEmployeeId = resolvedEmployeeId || sp.employee || "";
        }
      }
    } catch (_) {
      /* keep unresolved; profile falls back to the supplied display name */
    }
  }

  // Only ever show the resolved logged-in person — never an arbitrary "first" sales person.
  const salesPersonName = resolvedSalesPersonName;

  const mappedSalesPerson = salesPersonName
    ? (salesPersons.find((row) => row?.name === salesPersonName) || null)
    : null;
  const employeeId = resolvedEmployeeId || mappedSalesPerson?.employee || "";

  let employeeProfile = null;
  if (employeeId) {
    try {
      const employeeRaw = await erpResourceList("Employee", {
        fields: ["name", "employee_name", "designation", "branch", "image"],
        filters: [["name", "=", employeeId]],
        limit: 1,
      });
      employeeProfile = normalizeArray(employeeRaw?.data)[0] || null;
    } catch (_) {
      employeeProfile = null;
    }
  }

  const sortedRank = [...salespersonReport].sort((a, b) => b.total_sales - a.total_sales);
  const rankIndex = salesPersonName ? sortedRank.findIndex((row) => row.sales_person === salesPersonName) : -1;
  const rank = rankIndex >= 0 ? rankIndex + 1 : 0;

  const monthSalesBuckets = getMonthSalesBuckets(invoices);
  const thisMonthSales = sumByDateRange(invoices, currentMonthStart, now);
  const lastMonthSales = sumByDateRange(invoices, lastMonthStart, lastMonthEnd);

  const lastSixMonthsValues = [];
  for (let i = 1; i <= 6; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    lastSixMonthsValues.push(monthSalesBuckets.get(monthKey(d)) || 0);
  }

  const baseline = lastSixMonthsValues.length > 0
    ? lastSixMonthsValues.reduce((sum, value) => sum + value, 0) / lastSixMonthsValues.length
    : 0;

  const thisMonthTarget = Math.max(thisMonthSales, lastMonthSales, baseline) * 1.1 || 1;
  const lastMonthTarget = Math.max(lastMonthSales, baseline) * 1.05 || 1;
  const achievementPercentage = clamp((thisMonthSales / thisMonthTarget) * 100, 0, 999);
  const remainingTarget = Math.max(thisMonthTarget - thisMonthSales, 0);

  const outstandingInvoices = invoices.filter((row) => toNumber(row?.outstanding_amount) > 0);
  const totalOutstanding = outstandingInvoices.reduce((sum, row) => sum + toNumber(row?.outstanding_amount), 0);
  const outstandingCustomerCount = new Set(outstandingInvoices.map((row) => row?.customer || row?.customer_name).filter(Boolean)).size;

  const outstandingAbove60Days = outstandingInvoices.filter((row) => {
    const date = row?.posting_date || row?.creation;
    if (!date) return false;
    const diffDays = (Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000);
    return diffDays >= 60;
  });

  const topThisMonth = normalizeArray(dashboard?.month_top_items?.qty_wise).slice(0, 10).map((row) => mapProductRow(row, "net_qty", "net_value"));
  const topLastMonth = normalizeArray(dashboard?.month_top_items?.count_wise).slice(0, 10).map((row) => mapProductRow(row, "net_qty", "net_value"));
  const topThisWeek = normalizeArray(dashboard?.today_sold_items).slice(0, 10).map((row) => mapProductRow(row, "net_qty", "net_value"));
  const newArrivalsTop10 = normalizeArray(dashboard?.week_new_arrived_items).slice(0, 10).map((row) => mapProductRow(row, "received_qty", "received_value"));
  const backToStockTop10 = normalizeArray(dashboard?.week_credit_note_stock_items).slice(0, 10).map((row) => mapProductRow(row, "return_qty", "return_value"));

  const combinedItems = [...topThisMonth, ...topLastMonth, ...topThisWeek];
  const itemCodes = [...new Set(combinedItems.map((item) => item.itemCode).filter(Boolean))];

  let itemGroupMap = {};
  if (itemCodes.length > 0) {
    try {
      const itemsRaw = await erpResourceList("Item", {
        fields: ["item_code", "item_group"],
        filters: [["item_code", "in", itemCodes]],
        orderBy: "modified desc",
        limit: 500,
      });
      itemGroupMap = normalizeArray(itemsRaw?.data).reduce((acc, row) => {
        if (row?.item_code) {
          acc[row.item_code] = row?.item_group || "Uncategorized";
        }
        return acc;
      }, {});
    } catch (_) {
      itemGroupMap = {};
    }
  }

  const categoryMap = new Map();
  topThisMonth.forEach((item) => {
    const category = itemGroupMap[item.itemCode] || "Uncategorized";
    const existing = categoryMap.get(category) || { category, productSet: new Set(), salesAmount: 0 };
    existing.productSet.add(item.itemCode || item.itemName);
    existing.salesAmount += toNumber(item.amount);
    categoryMap.set(category, existing);
  });

  const categories = [...categoryMap.values()]
    .map((row) => ({
      category: row.category,
      productCount: row.productSet.size,
      salesAmount: Number(row.salesAmount.toFixed(2)),
    }))
    .sort((a, b) => b.salesAmount - a.salesAmount)
    .slice(0, 10);

  const monthlyTargets = {};
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    monthlyTargets[key] = i === 0 ? thisMonthTarget : Math.max(lastMonthTarget, baseline);
  }

  const monthlySalesLast6Months = buildMonthlySalesLast6Months(monthSalesBuckets, monthlyTargets);

  const salesVsTargetCurrentMonth = buildSalesVsTargetCurrentMonth(thisMonthSales, thisMonthTarget);

  const productTrend = topThisMonth.slice(0, 6).map((item) => ({
    label: item.itemName,
    sales: toNumber(item.qty),
  }));

  const categoryPerformance = categories.slice(0, 6).map((item) => ({
    label: item.category,
    value: toNumber(item.salesAmount),
  }));

  const recentlyOrderedCustomers = topCustomersFromInvoices(invoices, { requireOutstanding: false, limit: 5 });
  const customersWithOutstanding = topCustomersFromInvoices(invoices, { requireOutstanding: true, limit: 5 });
  const inactive30PlusDays = buildInactiveCustomers(invoices, 5);
  const topBuyingCustomers = topCustomersFromInvoices(invoices, { requireOutstanding: false, limit: 5 });

  const frequentlyReturnedItems = backToStockTop10.slice(0, 5).map((item) => ({
    itemName: item.itemName,
    returns: toNumber(item.qty),
  }));

  const lowStockCandidates = lowStockRows
    .filter((row) => toNumber(row?.actual_qty) > 0 && toNumber(row?.actual_qty) <= 5)
    .slice(0, 3)
    .map((row) => row?.item_code)
    .filter(Boolean);

  const comparedToLastMonthPct = lastMonthSales > 0
    ? Number((((thisMonthSales - lastMonthSales) / lastMonthSales) * 100).toFixed(1))
    : 0;

  const insights = [
    {
      id: "target-vs-last-month",
      severity: thisMonthSales >= lastMonthSales ? "success" : "warning",
      title: "Target trajectory",
      message: thisMonthSales >= lastMonthSales
        ? `You are ahead by ${Math.abs(comparedToLastMonthPct)}% versus last month.`
        : `You are behind by ${Math.abs(comparedToLastMonthPct)}% versus last month.`,
    },
    {
      id: "trending-category",
      severity: "info",
      title: "Trending category",
      message: categories[0]
        ? `${categories[0].category} is trending in your mapped territory.`
        : "No category trend data available yet.",
    },
    {
      id: "pending-above-60-days",
      severity: outstandingAbove60Days.length > 0 ? "critical" : "success",
      title: "Overdue receivables",
      message: outstandingAbove60Days.length > 0
        ? `${outstandingAbove60Days.length} customers have pending payments above 60 days.`
        : "No >60 day outstanding receivables detected.",
    },
    {
      id: "low-stock-alert",
      severity: lowStockCandidates.length > 0 ? "warning" : "success",
      title: "Low stock alerts",
      message: lowStockCandidates.length > 0
        ? `${lowStockCandidates.slice(0, 2).join(", ")} ${lowStockCandidates.length > 2 ? "and more" : ""} are low on stock.`
        : "No critical low-stock products detected.",
    },
  ];

  // ── Catalog-driven storefront fallback ────────────────────────────────────────
  // Sales-derived product lists & categories are scoped to the current day/week/month
  // and can be empty on benches without recent sales. Pull from the catalog so the
  // storefront (new arrivals + category strip) still renders real products.
  let featuredItems = [];
  let catalogCategories = [];
  try {
    const recentItemsRaw = await erpResourceList("Item", {
      fields: ["item_code", "item_name", "image", "item_group", "standard_rate", "is_sales_item", "has_variants"],
      filters: [["disabled", "=", 0], ["is_sales_item", "=", 1]],
      orderBy: "creation desc",
      limit: 200,
    });
    const recentItems = normalizeArray(recentItemsRaw?.data);
    const isJunk = (r) => /\b(test|temp|sample|dummy|abcd)\b/i.test(`${r?.item_code || ""} ${r?.item_name || ""}`);
    const mapItem = (r) => ({
      itemCode: r?.item_code || "",
      itemName: r?.item_name || r?.item_code || "Item",
      qty: 0,
      amount: toNumber(r?.standard_rate),
      image: resolveImageUrl(r?.image),
    });
    // Prefer real, sellable products that have an image; fall back to any non-junk item.
    const clean = recentItems.filter((r) => !isJunk(r) && Number(r?.has_variants) !== 1);
    const withImage = clean.filter((r) => String(r?.image || "").trim());
    featuredItems = (withImage.length >= 5 ? withImage : clean).slice(0, 10).map(mapItem);

    const SKIP_GROUPS = new Set(["unapproved items", "raw materials", "approved group", "asset items", "all item groups", "products", "services"]);
    const groupCounts = new Map();
    clean.forEach((r) => {
      const g = String(r?.item_group || "").trim();
      if (!g || SKIP_GROUPS.has(g.toLowerCase())) return;
      groupCounts.set(g, (groupCounts.get(g) || 0) + 1);
    });
    catalogCategories = [...groupCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => ({ category, productCount: 0, salesAmount: 0 }));

    const realCounts = await Promise.all(
      catalogCategories.map((c) =>
        erpRequest("/api/method/frappe.client.get_count", {
          query: { doctype: "Item", filters: [["item_group", "=", c.category], ["disabled", "=", 0]] },
        })
          .then((r) => toNumber(r?.message))
          .catch(() => 0)
      )
    );
    catalogCategories = catalogCategories.map((c, i) => ({ ...c, productCount: realCounts[i] }));
  } catch (_) {
    featuredItems = [];
    catalogCategories = [];
  }

  const finalCategories = categories.length ? categories : catalogCategories;
  const finalNewArrivals = newArrivalsTop10.length ? newArrivalsTop10 : featuredItems.slice(0, 5);

  const profile = {
    salesPersonName: employeeProfile?.employee_name || salesPersonName || salesUserName || loginUser || "Sales Executive",
    image: resolveImageUrl(employeeProfile?.image),
    designation: employeeProfile?.designation || "Sales Executive",
    territory: "General",
    branch: employeeProfile?.branch || "Main Branch",
    rank,
    totalSalesReps: sortedRank.length || 0,
  };

  const performance = {
    thisMonthSales: Number(thisMonthSales.toFixed(2)),
    thisMonthTarget: Number(thisMonthTarget.toFixed(2)),
    achievementPercentage: Number(achievementPercentage.toFixed(2)),
    remainingTarget: Number(remainingTarget.toFixed(2)),
    lastMonthSales: Number(lastMonthSales.toFixed(2)),
    lastMonthTarget: Number(lastMonthTarget.toFixed(2)),
    totalOutstanding: Number(totalOutstanding.toFixed(2)),
    outstandingCustomerCount,
  };

  return {
    profile,
    performance,
    insights,
    categories: finalCategories,
    productLists: {
      newArrivalsTop10: finalNewArrivals,
      backToStockTop10,
      topSellingThisMonthTop10: topThisMonth,
      topSellingLastMonthTop10: topLastMonth,
      topSellingThisWeekTop10: topThisWeek,
    },
    charts: {
      monthlySalesLast6Months,
      salesVsTargetCurrentMonth,
      productTrend,
      categoryPerformance,
    },
    customers: {
      recentlyOrderedCustomers,
      customersWithOutstanding,
      inactive30PlusDays,
      topBuyingCustomers,
      frequentlyReturnedItems,
    },
    quickActions: QUICK_ACTIONS,
    meta: {
      generatedAt: nowIso(),
      cacheTtlSeconds: Math.floor(SALES_HOME_CACHE_TTL_MS / 1000),
      mockData: false,
      source: "erpnext",
    },
    _raw: {
      quotations,
      weekAgo: formatDateYMD(weekAgo),
    },
  };
}

export async function getSalesHomeAll({ salesUser = "", salesUserName = "" } = {}) {
  const cacheKey = `sales-home:all:${salesUser || "default"}`;

  try {
    const { data, cached } = await getOrSetCache(cacheKey, SALES_HOME_CACHE_TTL_MS, () =>
      fetchAllFromErp({ salesUser, salesUserName })
    );

    return {
      ...data,
      meta: {
        ...(data?.meta || {}),
        cached,
      },
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const mock = buildMockAllPayload();
      return {
        ...mock,
        meta: {
          ...mock.meta,
          cached: false,
          error: error?.message || "ERP unavailable, mock data served.",
        },
      };
    }

    throw error;
  }
}

export async function getSalesHomeSection(section, options = {}) {
  const all = await getSalesHomeAll(options);
  switch (section) {
    case "profile":
      return { profile: all.profile, meta: all.meta };
    case "performance":
      return { performance: all.performance, meta: all.meta };
    case "insights":
      return { insights: all.insights, meta: all.meta };
    case "categories":
      return { categories: all.categories, meta: all.meta };
    case "product-lists":
      return { productLists: all.productLists, meta: all.meta };
    case "charts":
      return { charts: all.charts, meta: all.meta };
    case "customers":
      return { customers: all.customers, meta: all.meta };
    default:
      return all;
  }
}
