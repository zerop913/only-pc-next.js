export interface OrderStatusStat {
  statusName: string;
  statusColor: string;
  count: number;
}

export interface RecentOrder {
  id: number;
  orderNumber: string;
  totalPrice: string;
  createdAt: string;
  statusId: number;
  statusName: string;
  statusColor: string;
}

export interface Client {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  firstOrderDate: string;
  recentOrders: RecentOrder[];
  orderStatusStats: OrderStatusStat[];
}

export interface SortOption {
  value: string;
  label: string;
} 