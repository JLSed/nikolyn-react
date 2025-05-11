export interface DashboardSummary {
  todayRevenue: number;
  orderCounts: {
    completed: number;
    pending: number;
    cancelled: number;
    total: number;
  };
}

export interface SalesByPaymentMethod {
  method: string;
  amount: number;
  count: number;
}

export interface OrderStatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface RecentSale {
  date: string;
  amount: number;
}

export interface LowStockProduct {
  item_id: string;
  item_name: string;
  totalQuantity: number;
}

export interface ExpiringProduct {
  item_id: string;
  item_name: string;
  expiration_date: string;
  quantity: number;
  days_remaining: number;
}

export interface DailySales {
  date: string;
  revenue: number;
  order_count: number;
  change_percentage: number;
  increase: boolean;
}
