import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoredUserProfile } from "@/libs/api";

const AUTO_REFRESH_MS = 60000;

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function defaultPayload() {
  return {
    profile: {
      salesPersonName: "Sales Executive",
      image: "",
      designation: "Sales Executive",
      territory: "General",
      branch: "Main",
      rank: 0,
      totalSalesReps: 0,
    },
    performance: {
      thisMonthSales: 0,
      thisMonthTarget: 0,
      achievementPercentage: 0,
      remainingTarget: 0,
      lastMonthSales: 0,
      lastMonthTarget: 0,
      totalOutstanding: 0,
      outstandingCustomerCount: 0,
    },
    insights: [],
    categories: [],
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
    quickActions: [],
    meta: {
      generatedAt: "",
      cacheTtlSeconds: 600,
      mockData: false,
      source: "erpnext",
      cached: false,
    },
  };
}

function normalizePayload(raw = {}) {
  const base = defaultPayload();
  return {
    ...base,
    ...raw,
    profile: { ...base.profile, ...(raw?.profile || {}) },
    performance: {
      ...base.performance,
      ...(raw?.performance || {}),
      thisMonthSales: toNumber(raw?.performance?.thisMonthSales),
      thisMonthTarget: toNumber(raw?.performance?.thisMonthTarget),
      achievementPercentage: toNumber(raw?.performance?.achievementPercentage),
      remainingTarget: toNumber(raw?.performance?.remainingTarget),
      lastMonthSales: toNumber(raw?.performance?.lastMonthSales),
      lastMonthTarget: toNumber(raw?.performance?.lastMonthTarget),
      totalOutstanding: toNumber(raw?.performance?.totalOutstanding),
      outstandingCustomerCount: toNumber(raw?.performance?.outstandingCustomerCount),
    },
    insights: asArray(raw?.insights),
    categories: asArray(raw?.categories),
    productLists: {
      ...base.productLists,
      ...(raw?.productLists || {}),
      newArrivalsTop10: asArray(raw?.productLists?.newArrivalsTop10),
      backToStockTop10: asArray(raw?.productLists?.backToStockTop10),
      topSellingThisMonthTop10: asArray(raw?.productLists?.topSellingThisMonthTop10),
      topSellingLastMonthTop10: asArray(raw?.productLists?.topSellingLastMonthTop10),
      topSellingThisWeekTop10: asArray(raw?.productLists?.topSellingThisWeekTop10),
    },
    charts: {
      ...base.charts,
      ...(raw?.charts || {}),
      monthlySalesLast6Months: asArray(raw?.charts?.monthlySalesLast6Months),
      salesVsTargetCurrentMonth: asArray(raw?.charts?.salesVsTargetCurrentMonth),
      productTrend: asArray(raw?.charts?.productTrend),
      categoryPerformance: asArray(raw?.charts?.categoryPerformance),
    },
    customers: {
      ...base.customers,
      ...(raw?.customers || {}),
      recentlyOrderedCustomers: asArray(raw?.customers?.recentlyOrderedCustomers),
      customersWithOutstanding: asArray(raw?.customers?.customersWithOutstanding),
      inactive30PlusDays: asArray(raw?.customers?.inactive30PlusDays),
      topBuyingCustomers: asArray(raw?.customers?.topBuyingCustomers),
      frequentlyReturnedItems: asArray(raw?.customers?.frequentlyReturnedItems),
    },
    quickActions: asArray(raw?.quickActions),
    meta: { ...base.meta, ...(raw?.meta || {}) },
  };
}

export default function useHomeDashboardData() {
  const [payload, setPayload] = useState(defaultPayload());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState({
    email: "",
    name: "",
    customerId: "",
    roles: [],
  });

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Identify the logged-in sales user so the backend scopes the profile to them
      // (email -> Employee.user_id -> Sales Person). Name is a display fallback.
      const me = getStoredUserProfile();
      const params = new URLSearchParams();
      if (me?.email) params.set("sales_user", me.email);
      if (me?.name) params.set("sales_user_name", me.name);
      const qs = params.toString();

      const response = await fetch(`/api/sales-home/all${qs ? `?${qs}` : ""}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Unable to load sales home dashboard.");
      }

      setPayload(normalizePayload(data || {}));
    } catch (err) {
      setError(err?.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUserProfile(getStoredUserProfile());
    refreshAll();

    const intervalId = window.setInterval(refreshAll, AUTO_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [refreshAll]);

  const derived = useMemo(() => {
    const thisMonthTarget = toNumber(payload.performance.thisMonthTarget);
    const thisMonthSales = toNumber(payload.performance.thisMonthSales);

    return {
      thisMonthTarget,
      thisMonthSales,
      achievementPercentage: thisMonthTarget > 0
        ? (thisMonthSales / thisMonthTarget) * 100
        : toNumber(payload.performance.achievementPercentage),
      hasAnyInsights: payload.insights.length > 0,
      hasAnyCategories: payload.categories.length > 0,
      hasAnyProducts:
        payload.productLists.newArrivalsTop10.length > 0
        || payload.productLists.backToStockTop10.length > 0
        || payload.productLists.topSellingThisMonthTop10.length > 0,
      hasAnyCharts:
        payload.charts.monthlySalesLast6Months.length > 0
        || payload.charts.salesVsTargetCurrentMonth.length > 0,
      hasAnyCustomers:
        payload.customers.recentlyOrderedCustomers.length > 0
        || payload.customers.customersWithOutstanding.length > 0,
    };
  }, [payload]);

  return {
    payload,
    loading,
    error,
    userProfile,
    derived,
    refreshAll,
  };
}
