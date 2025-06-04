export interface AnalyticsOverview {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  averageOrder: number;
}

export interface TopProduct {
  name: string;
  totalSold: number;
  totalRevenue: number;
}

export interface OrdersByStatus {
  statusName: string;
  statusColor: string | null;
  count: number;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
}

export interface OrdersByDay {
  date: string;
  ordersCount: number;
}

export interface PaymentMethodStats {
  method: string;
  count: number;
  totalAmount: number;
}

export interface CombinedDayData {
  date: string;
  ordersCount: number;
  revenue: number;
}

export interface AnalyticsData {
  period: number;
  startDate: string;
  endDate: string;
  overview: AnalyticsOverview;
  topProducts: TopProduct[];
  ordersByStatus: OrdersByStatus[];
  revenueByDay: RevenueByDay[];
  ordersByDay: OrdersByDay[];
  paymentMethods: PaymentMethodStats[];
}
