import { useEffect, useState, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import NavBar from "../components/NavBar";
import { FaArrowUp, FaArrowDown, FaFileExport } from "react-icons/fa";
import {
  getDashboardSummary,
  getRecentSales,
  getSalesByPaymentMethod,
  getOrderStatusBreakdown,
  getLowStockProducts,
  getSoonToExpireProducts,
  getDailySales,
} from "../lib/dashboard-api";
import {
  DashboardSummary,
  SalesByPaymentMethod,
  OrderStatusBreakdown,
  RecentSale,
  LowStockProduct,
  ExpiringProduct,
  DailySales,
} from "../types/dashboard";
import { Chart, registerables } from "chart.js";
import { AiOutlineAudit } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
Chart.register(...registerables);

function DashboardPage() {
  const navigate = useNavigate();
  // State for all dashboard data
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<SalesByPaymentMethod[]>(
    []
  );
  const [statusBreakdown, setStatusBreakdown] = useState<
    OrderStatusBreakdown[]
  >([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>(
    []
  );
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>(
    []
  );
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortDateDirection, setSortDateDirection] = useState<"desc" | "asc">(
    "desc"
  );

  // Chart refs
  const salesChartRef = useRef<HTMLCanvasElement | null>(null);
  const salesChartInstance = useRef<Chart | null>(null);
  const paymentChartRef = useRef<HTMLCanvasElement | null>(null);
  const paymentChartInstance = useRef<Chart | null>(null);
  const statusChartRef = useRef<HTMLCanvasElement | null>(null);
  const statusChartInstance = useRef<Chart | null>(null);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [
          summaryResult,
          recentSalesResult,
          paymentMethodsResult,
          statusBreakdownResult,
          lowStockResult,
          expiringProductsResult,
          dailySalesResult,
        ] = await Promise.all([
          getDashboardSummary(),
          getRecentSales(),
          getSalesByPaymentMethod(),
          getOrderStatusBreakdown(),
          getLowStockProducts(),
          getSoonToExpireProducts(),
          getDailySales(),
        ]);

        // Set state with results
        if (summaryResult.success) setSummary(summaryResult.data || null);
        if (recentSalesResult.success)
          setRecentSales(recentSalesResult.data || []);
        if (paymentMethodsResult.success)
          setPaymentMethods(paymentMethodsResult.data || []);
        if (statusBreakdownResult.success)
          setStatusBreakdown(statusBreakdownResult.data || []);
        if (lowStockResult.success)
          setLowStockProducts(lowStockResult.data || []);
        if (expiringProductsResult.success)
          setExpiringProducts(expiringProductsResult.data || []);
        if (dailySalesResult.success)
          setDailySales(dailySalesResult.data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Setup charts when data is loaded
  useEffect(() => {
    // Only create charts when we have data and the refs are available
    if (
      !loading &&
      salesChartRef.current &&
      paymentChartRef.current &&
      statusChartRef.current
    ) {
      // Setup Recent Sales Chart
      if (salesChartInstance.current) {
        salesChartInstance.current.destroy();
      }

      const salesCtx = salesChartRef.current.getContext("2d");
      if (salesCtx) {
        salesChartInstance.current = new Chart(salesCtx, {
          type: "line",
          data: {
            labels: recentSales.map((sale) =>
              new Date(sale.date).toLocaleDateString()
            ),
            datasets: [
              {
                label: "Sales Amount",
                data: recentSales.map((sale) => sale.amount),
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 2,
                tension: 0.3,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function (value) {
                    return "₱ " + value;
                  },
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: "Recent Sales (Last 7 Days)",
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return "₱ " + context.raw;
                  },
                },
              },
            },
          },
        });
      }

      // Setup Payment Methods Chart
      if (paymentChartInstance.current) {
        paymentChartInstance.current.destroy();
      }

      const paymentCtx = paymentChartRef.current.getContext("2d");
      if (paymentCtx) {
        paymentChartInstance.current = new Chart(paymentCtx, {
          type: "doughnut",
          data: {
            labels: paymentMethods.map((method) => method.method),
            datasets: [
              {
                data: paymentMethods.map((method) => method.amount),
                backgroundColor: [
                  "rgba(255, 99, 132, 0.7)",
                  "rgba(54, 162, 235, 0.7)",
                  "rgba(255, 206, 86, 0.7)",
                  "rgba(75, 192, 192, 0.7)",
                  "rgba(153, 102, 255, 0.7)",
                ],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: "Sales by Payment Method",
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const value = context.raw as number;
                    const total = context.dataset.data.reduce(
                      (acc: number, val: number) => acc + val,
                      0
                    );
                    const percentage = Math.round((value / total) * 100);
                    return `₱ ${value} (${percentage}%)`;
                  },
                },
              },
            },
          },
        });
      }

      // Setup Status Breakdown Chart
      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
      }

      const statusCtx = statusChartRef.current.getContext("2d");
      if (statusCtx) {
        statusChartInstance.current = new Chart(statusCtx, {
          type: "pie",
          data: {
            labels: statusBreakdown.map((status) => status.status),
            datasets: [
              {
                data: statusBreakdown.map((status) => status.count),
                backgroundColor: [
                  "rgba(75, 192, 192, 0.7)", // Completed - Green
                  "rgba(255, 206, 86, 0.7)", // Pending - Yellow
                  "rgba(255, 99, 132, 0.7)", // Cancelled - Red
                ],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: "Order Status Breakdown",
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const value = context.raw as number;
                    const total = context.dataset.data.reduce(
                      (acc: number, val: number) => acc + val,
                      0
                    );
                    const percentage = Math.round((value / total) * 100);
                    return `${context.label}: ${value} (${percentage}%)`;
                  },
                },
              },
            },
          },
        });
      }
    }

    // Clean up charts when component unmounts
    return () => {
      if (salesChartInstance.current) {
        salesChartInstance.current.destroy();
      }
      if (paymentChartInstance.current) {
        paymentChartInstance.current.destroy();
      }
      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
      }
    };
  }, [loading, recentSales, paymentMethods, statusBreakdown]);

  // Export daily sales to CSV
  const exportToCSV = () => {
    if (dailySales.length === 0) {
      toast.error("No sales data to export");
      return;
    }

    try {
      const headers = ["Date", "Revenue", "Order Count", "Change %"];
      const csvRows = dailySales.map((sale) => [
        sale.date,
        sale.revenue.toFixed(2),
        sale.order_count.toString(),
        `${
          sale.change_percentage > 0 ? "+" : ""
        }${sale.change_percentage.toFixed(2)}%`,
      ]);

      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `sales_by_date_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Sales data exported to CSV");
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast.error("Failed to export sales data");
    }
  };

  const toggleSortDirection = () => {
    setSortDateDirection((prevDirection) =>
      prevDirection === "desc" ? "asc" : "desc"
    );
  };

  return (
    <main className="flex flex-col gap-2 bg-secondary text-primary font-outfit h-fit min-h-screen">
      <Toaster position="top-right" />
      <NavBar />

      <div className="flex justify-between items-center px-4">
        <p className="font-michroma font-black text-3xl">DASHBOARD</p>
        <div>
          <button
            onClick={() => navigate("/order-log")}
            className="border-2 border-primary px-2 py-1 flex items-center gap-2 rounded-lg bg-primary text-secondary hover:bg-secondary hover:text-primary transition-colors"
          >
            <AiOutlineAudit />
            Order Log
          </button>
        </div>
      </div>

      {/* Top Section - Summary Cards */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Today's Revenue */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-600">
              Today's Revenue
            </h2>
            <p className="text-3xl font-bold mt-2">
              {loading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `₱ ${summary?.todayRevenue.toFixed(2) || "0.00"}`
              )}
            </p>
          </div>

          {/* Orders Completed Today */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-600">
              Orders Completed Today
            </h2>
            <p className="text-3xl font-bold mt-2 text-green-600">
              {loading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                summary?.orderCounts.completed || 0
              )}
            </p>
          </div>

          {/* Orders Pending Today */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-600">
              Orders Pending Today
            </h2>
            <p className="text-3xl font-bold mt-2 text-yellow-600">
              {loading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                summary?.orderCounts.pending || 0
              )}
            </p>
          </div>

          {/* Orders Cancelled Today */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-600">
              Orders Cancelled Today
            </h2>
            <p className="text-3xl font-bold mt-2 text-red-600">
              {loading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                summary?.orderCounts.cancelled || 0
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="px-4 py-2 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Section - Charts and Expiring Products */}
        <div className="md:col-span-2 space-y-4">
          {/* Recent Sales Chart */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4">Recent Sales</h2>
            <div className="h-64">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">Loading chart data...</p>
                </div>
              ) : (
                <canvas ref={salesChartRef}></canvas>
              )}
            </div>
          </div>

          {/* Payment Method & Status Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sales by Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
              <div className="h-64">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">Loading chart data...</p>
                  </div>
                ) : (
                  <canvas ref={paymentChartRef}></canvas>
                )}
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-bold mb-4">Order Status</h2>
              <div className="h-64">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">Loading chart data...</p>
                  </div>
                ) : (
                  <canvas ref={statusChartRef}></canvas>
                )}
              </div>
            </div>
          </div>

          {/* Soon to Expire Products */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4">Soon to Expire Products</h2>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : expiringProducts.length > 0 ? (
              <div className="overflow-auto max-h-64">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Product
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Expires In
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {expiringProducts.map((product) => (
                      <tr
                        key={product.item_id + product.expiration_date}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-2">{product.item_name}</td>
                        <td
                          className={`px-4 py-2 ${
                            product.days_remaining <= 7
                              ? "text-red-600 font-semibold"
                              : ""
                          }`}
                        >
                          {product.days_remaining} days
                        </td>
                        <td className="px-4 py-2">{product.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No products expiring soon
              </p>
            )}
          </div>
        </div>

        {/* Right Section - Low Stock Products */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4">Low Stock Products</h2>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : lowStockProducts.length > 0 ? (
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                        Product
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lowStockProducts.map((product) => (
                      <tr key={product.item_id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{product.item_name}</td>
                        <td
                          className={`px-4 py-2 text-right font-semibold ${
                            product.totalQuantity <= 3
                              ? "text-red-600"
                              : product.totalQuantity <= 5
                              ? "text-yellow-600"
                              : ""
                          }`}
                        >
                          {product.totalQuantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No low stock products
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lower Section - Sales by Date */}
      <div className="px-4 py-2 mb-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">Sales by Date</h2>
              <button
                onClick={toggleSortDirection}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1 text-sm"
                disabled={loading || dailySales.length === 0}
              >
                Sort:{" "}
                {sortDateDirection === "desc" ? "Newest First" : "Oldest First"}
                {sortDateDirection === "desc" ? (
                  <FaArrowDown className="text-gray-500" />
                ) : (
                  <FaArrowUp className="text-gray-500" />
                )}
              </button>
            </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              disabled={loading || dailySales.length === 0}
            >
              <FaFileExport /> Export to CSV
            </button>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : dailySales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                      Date
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                      Orders
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                      Revenue
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dailySales
                    .slice() // Create a copy to avoid mutating original array
                    .sort((a, b) => {
                      const dateA = new Date(a.date).getTime();
                      const dateB = new Date(b.date).getTime();
                      return sortDateDirection === "desc"
                        ? dateB - dateA // Newest first
                        : dateA - dateB; // Oldest first
                    })
                    .map((sale) => (
                      <tr key={sale.date} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {new Date(sale.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {sale.order_count}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          ₱ {sale.revenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end">
                            {sale.change_percentage !== 0 &&
                              (sale.increase ? (
                                <FaArrowUp className="text-green-600 mr-1" />
                              ) : (
                                <FaArrowDown className="text-red-600 mr-1" />
                              ))}
                            <span
                              className={`font-medium ${
                                sale.change_percentage > 0
                                  ? "text-green-600"
                                  : sale.change_percentage < 0
                                  ? "text-red-600"
                                  : ""
                              }`}
                            >
                              {sale.change_percentage > 0 ? "+" : ""}
                              {sale.change_percentage.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              No sales data available
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default DashboardPage;
