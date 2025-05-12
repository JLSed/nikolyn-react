import { supabase } from "./supabase";
import {
  DashboardSummary,
  SalesByPaymentMethod,
  OrderStatusBreakdown,
  RecentSale,
  LowStockProduct,
  ExpiringProduct,
  DailySales,
} from "../types/dashboard";
import { ApiResponse } from "../types/api";

// Define types for database responses
interface OrderRecord {
  status: string;
  total_amount: number;
  payment_method?: string;
  created_at: string;
}

interface ProductEntryRecord {
  entry_id: string;
  item_id: string;
  quantity: number;
  expiration_date?: string;
  TBL_PRODUCT_ITEM?: {
    item_name: string;
  };
}

// Get today's revenue and order counts
export async function getDashboardSummary(): Promise<
  ApiResponse<DashboardSummary>
> {
  try {
    // Get today's date at the start of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISOString = today.toISOString();

    // Get tomorrow's date at the start of the day (for upper bound)
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowISOString = tomorrow.toISOString();

    // Query orders from today only (between start of today and start of tomorrow)
    const { data, error } = await supabase
      .from("TBL_ORDERS")
      .select("status, total_amount")
      .gte("created_at", todayISOString)
      .lt("created_at", tomorrowISOString);

    if (error) {
      throw error;
    }

    const orders = data as OrderRecord[];
    console.log("Orders from today:", orders);

    // Calculate total revenue and order counts
    let todayRevenue = 0;
    let completed = 0;
    let pending = 0;
    let cancelled = 0;

    orders.forEach((order) => {
      // Only add to revenue if the order is COMPLETE
      if (order.status === "COMPLETE") {
        todayRevenue += order.total_amount;
        completed++;
      } else if (order.status === "PENDING") {
        pending++;
      } else if (order.status === "CANCELLED") {
        cancelled++;
      }
    });

    const summary: DashboardSummary = {
      todayRevenue,
      orderCounts: {
        completed,
        pending,
        cancelled,
        total: orders.length || 0,
      },
    };

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard summary",
    };
  }
}

// Get recent sales data for the chart (last 7 days)
export async function getRecentSales(): Promise<ApiResponse<RecentSale[]>> {
  try {
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("TBL_ORDERS")
      .select("created_at, total_amount")
      .gte("created_at", sevenDaysAgo.toISOString())
      .eq("status", "COMPLETE")
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    const orders = data as OrderRecord[];

    // Group by date and calculate daily totals
    const salesByDate = orders.reduce<Record<string, number>>((acc, order) => {
      const date = new Date(order.created_at).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + order.total_amount;
      return acc;
    }, {});

    // Convert to array of objects
    const recentSales: RecentSale[] = Object.entries(salesByDate).map(
      ([date, amount]): RecentSale => ({
        date,
        amount,
      })
    );

    return {
      success: true,
      data: recentSales,
    };
  } catch (error) {
    console.error("Error fetching recent sales:", error);
    return {
      success: false,
      error: "Failed to fetch recent sales data",
    };
  }
}

// Get sales by payment method
export async function getSalesByPaymentMethod(): Promise<
  ApiResponse<SalesByPaymentMethod[]>
> {
  try {
    const { data, error } = await supabase
      .from("TBL_ORDERS")
      .select("payment_method, total_amount");

    if (error) {
      throw error;
    }

    const orders = data as OrderRecord[];

    // Group by payment method
    type MethodSummary = Record<string, { amount: number; count: number }>;

    const methodSummary = orders.reduce<MethodSummary>((acc, order) => {
      const method = order.payment_method || "Unknown";
      if (!acc[method]) {
        acc[method] = { amount: 0, count: 0 };
      }
      acc[method].amount += order.total_amount;
      acc[method].count += 1;
      return acc;
    }, {});

    // Convert to array
    const salesByMethod: SalesByPaymentMethod[] = Object.entries(
      methodSummary
    ).map(
      ([method, { amount, count }]): SalesByPaymentMethod => ({
        method,
        amount,
        count,
      })
    );

    return {
      success: true,
      data: salesByMethod,
    };
  } catch (error) {
    console.error("Error fetching sales by payment method:", error);
    return {
      success: false,
      error: "Failed to fetch sales by payment method",
    };
  }
}

// Get order status breakdown
export async function getOrderStatusBreakdown(): Promise<
  ApiResponse<OrderStatusBreakdown[]>
> {
  try {
    const { data, error } = await supabase.from("TBL_ORDERS").select("status");

    if (error) {
      throw error;
    }

    const orders = data as OrderRecord[];

    // Count orders by status
    const statusCounts: Record<string, number> = {
      COMPLETE: 0,
      PENDING: 0,
      CANCELLED: 0,
    };

    orders.forEach((order) => {
      if (order.status in statusCounts) {
        statusCounts[order.status]++;
      }
    });

    const totalOrders = orders.length;

    // Convert to array with percentages
    const statusBreakdown: OrderStatusBreakdown[] = Object.entries(
      statusCounts
    ).map(
      ([status, count]): OrderStatusBreakdown => ({
        status,
        count,
        percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0,
      })
    );

    return {
      success: true,
      data: statusBreakdown,
    };
  } catch (error) {
    console.error("Error fetching order status breakdown:", error);
    return {
      success: false,
      error: "Failed to fetch order status breakdown",
    };
  }
}

// Get low stock products
export async function getLowStockProducts(
  threshold: number = 5
): Promise<ApiResponse<LowStockProduct[]>> {
  try {
    const { data, error } = (await supabase.from("TBL_PRODUCT_ENTRY").select(`
        entry_id,
        item_id,
        quantity,
        TBL_PRODUCT_ITEM(item_name)
      `)) as { data: ProductEntryRecord[]; error: any };

    if (error) {
      throw error;
    }

    const entries = data as ProductEntryRecord[];

    // Group by item and calculate total quantity
    interface ItemQuantity {
      id: string;
      name: string;
      total: number;
    }

    const itemQuantities = entries.reduce<Record<string, ItemQuantity>>(
      (acc, entry) => {
        const itemId = entry.item_id;
        const itemName = entry.TBL_PRODUCT_ITEM?.item_name || "Unknown Product";
        const quantity = entry.quantity || 0;

        if (!acc[itemId]) {
          acc[itemId] = { id: itemId, name: itemName, total: 0 };
        }

        acc[itemId].total += quantity;
        return acc;
      },
      {}
    );

    // Filter low stock items and convert to array
    const lowStockItems: LowStockProduct[] = Object.values(itemQuantities)
      .filter((item) => item.total <= threshold)
      .map(
        (item): LowStockProduct => ({
          item_id: item.id,
          item_name: item.name,
          totalQuantity: item.total,
        })
      )
      .sort((a, b) => a.totalQuantity - b.totalQuantity); // Sort by quantity ascending

    return {
      success: true,
      data: lowStockItems,
    };
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return {
      success: false,
      error: "Failed to fetch low stock products",
    };
  }
}

// Get soon-to-expire products (within the next month)
export async function getSoonToExpireProducts(): Promise<
  ApiResponse<ExpiringProduct[]>
> {
  try {
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const today = new Date();

    const { data, error } = await supabase
      .from("TBL_PRODUCT_ENTRY")
      .select(
        `
        entry_id,
        item_id,
        quantity,
        expiration_date,
        TBL_PRODUCT_ITEM(item_name)
      `
      )
      .lt("expiration_date", oneMonthFromNow.toISOString())
      .gt("expiration_date", today.toISOString())
      .order("expiration_date", { ascending: true });

    if (error) {
      throw error;
    }

    const entries = data as unknown as ProductEntryRecord[];

    // Calculate days remaining and format data
    const expiringProducts: ExpiringProduct[] = entries.map(
      (entry): ExpiringProduct => {
        const expirationDate = new Date(entry.expiration_date || "");
        const daysRemaining = Math.ceil(
          (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          item_id: entry.item_id,
          item_name: entry.TBL_PRODUCT_ITEM?.item_name || "Unknown Product",
          expiration_date: entry.expiration_date || "",
          quantity: entry.quantity || 0,
          days_remaining: daysRemaining,
        };
      }
    );

    return {
      success: true,
      data: expiringProducts,
    };
  } catch (error) {
    console.error("Error fetching soon-to-expire products:", error);
    return {
      success: false,
      error: "Failed to fetch soon-to-expire products",
    };
  }
}

// Get daily sales data
export async function getDailySales(
  days: number = 30
): Promise<ApiResponse<DailySales[]>> {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("TBL_ORDERS")
      .select("created_at, total_amount, status") // Added status to the select
      .eq("status", "COMPLETE") // Filter for COMPLETE orders only
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error) {
      throw error;
    }

    const orders = data as OrderRecord[];

    // Group by date
    interface DailySaleSummary {
      revenue: number;
      order_count: number;
    }

    const salesByDate: Record<string, DailySaleSummary> = {};

    // Create empty entries for each date in the range
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateString = d.toISOString().split("T")[0];
      salesByDate[dateString] = { revenue: 0, order_count: 0 };
    }

    // Fill in actual data
    orders.forEach((order) => {
      const dateString = new Date(order.created_at).toISOString().split("T")[0];
      if (salesByDate[dateString]) {
        salesByDate[dateString].revenue += order.total_amount;
        salesByDate[dateString].order_count += 1;
      }
    });

    // Convert to array and calculate change percentage
    const dailySalesArray = Object.entries(salesByDate)
      .sort(
        ([dateA], [dateB]) =>
          new Date(dateA).getTime() - new Date(dateB).getTime()
      )
      .map(([date, { revenue, order_count }], index, array): DailySales => {
        let change_percentage = 0;
        let increase = true;

        // Calculate change from previous day (if not the first item)
        if (index > 0) {
          const previousRevenue = array[index - 1][1].revenue;
          if (previousRevenue > 0) {
            change_percentage =
              ((revenue - previousRevenue) / previousRevenue) * 100;
            increase = revenue >= previousRevenue;
          } else if (revenue > 0) {
            // Previous was 0, but current is not
            change_percentage = 100;
            increase = true;
          }
        }

        return {
          date,
          revenue,
          order_count,
          change_percentage: parseFloat(change_percentage.toFixed(2)),
          increase,
        };
      });

    return {
      success: true,
      data: dailySalesArray,
    };
  } catch (error) {
    console.error("Error fetching daily sales:", error);
    return {
      success: false,
      error: "Failed to fetch daily sales data",
    };
  }
}
