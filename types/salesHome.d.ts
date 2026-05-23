export interface SalesHomeProfile {
  salesPersonName: string;
  image: string;
  designation: string;
  territory: string;
  branch: string;
  rank: number;
  totalSalesReps: number;
}

export interface SalesHomePerformance {
  thisMonthSales: number;
  thisMonthTarget: number;
  achievementPercentage: number;
  remainingTarget: number;
  lastMonthSales: number;
  lastMonthTarget: number;
  totalOutstanding: number;
  outstandingCustomerCount: number;
}

export interface SalesHomeInsight {
  id: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  message: string;
}

export interface SalesHomeCategory {
  category: string;
  productCount: number;
  salesAmount: number;
}

export interface SalesHomeProductItem {
  itemCode: string;
  itemName: string;
  qty: number;
  amount: number;
  image: string;
}

export interface SalesHomeProductLists {
  newArrivalsTop10: SalesHomeProductItem[];
  backToStockTop10: SalesHomeProductItem[];
  topSellingThisMonthTop10: SalesHomeProductItem[];
  topSellingLastMonthTop10: SalesHomeProductItem[];
  topSellingThisWeekTop10: SalesHomeProductItem[];
}

export interface SalesHomeChartPoint {
  label: string;
  sales: number;
  target?: number;
}

export interface SalesHomeCharts {
  monthlySalesLast6Months: SalesHomeChartPoint[];
  salesVsTargetCurrentMonth: SalesHomeChartPoint[];
  productTrend: SalesHomeChartPoint[];
  categoryPerformance: Array<{ label: string; value: number }>;
}

export interface SalesHomeCustomer {
  customerName: string;
  value: number;
  dateLabel: string;
  extraLabel: string;
}

export interface SalesHomeCustomers {
  recentlyOrderedCustomers: SalesHomeCustomer[];
  customersWithOutstanding: SalesHomeCustomer[];
  inactive30PlusDays: SalesHomeCustomer[];
  topBuyingCustomers: SalesHomeCustomer[];
  frequentlyReturnedItems: Array<{ itemName: string; returns: number }>;
}

export interface SalesHomeAllResponse {
  profile: SalesHomeProfile;
  performance: SalesHomePerformance;
  insights: SalesHomeInsight[];
  categories: SalesHomeCategory[];
  productLists: SalesHomeProductLists;
  charts: SalesHomeCharts;
  customers: SalesHomeCustomers;
  quickActions: Array<{ label: string; route: string }>;
  meta: {
    generatedAt: string;
    cacheTtlSeconds: number;
    mockData: boolean;
    source: 'erpnext' | 'mock';
  };
}
