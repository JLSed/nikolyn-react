import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import NavBar from "../components/NavBar";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFilter } from "react-icons/fa6";
import { getAllOrders, updateOrderStatus } from "../lib/supabase";
import { MdSearch } from "react-icons/md";

// Define the Order type based on TBL_ORDERS structure
// Define interfaces for the nested service and product data structures
interface LaundryData {
  value: number;
  laundry_total: number;
}

interface ServiceData {
  sub_total: number;
  laundryWeights: Record<string, LaundryData>;
}

interface ProductData {
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
}

interface Order {
  order_id: string;
  order_date: string;
  status: string;
  total_amount: number;
  payment_method: string;
  products: Record<string, ProductData>;
  services: Record<string, ServiceData>;
  customer_name: string;
  created_at: string;
  updated_at: string;
}

function OrderLogPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch orders data
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const result = await getAllOrders();
      console.log("Fetched orders:", result.data);
      if (result.success) {
        setOrders(result.data || []);
      } else {
        toast.error("Failed to load orders");
        console.error("Error fetching orders:", result.error);
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  // Filter orders based on search term and status filter
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.customer_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Open modal with selected order
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Update order status to complete
  const handleCompleteOrder = async () => {
    if (!selectedOrder) return;

    setIsProcessing(true);
    const result = await updateOrderStatus(selectedOrder.order_id, "COMPLETE");

    if (result.success) {
      toast.success("Order marked as complete");
      // Update the local state
      setOrders(
        orders.map((order) =>
          order.order_id === selectedOrder.order_id
            ? {
                ...order,
                status: "COMPLETE",
                updated_at: new Date().toISOString(),
              }
            : order
        )
      );
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: "COMPLETE" } : null
      );
    } else {
      toast.error("Failed to update order status");
      console.error("Error updating order status:", result.error);
    }

    setIsProcessing(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <main className="flex flex-col gap-2 bg-secondary text-primary font-outfit h-fit min-h-screen">
      <Toaster position="top-right" />
      <NavBar />
      <div className="flex justify-between items-center">
        <p className="font-michroma font-black text-3xl">ORDER LOGS</p>
        <div className="flex gap-2 pr-2">
          <button
            onClick={() => navigate(-1)}
            className="border-2 border-primary px-2 py-1 flex items-center gap-2 rounded-lg bg-primary text-secondary hover:bg-secondary hover:text-primary transition-colors"
          >
            <FaArrowLeft />
            Go Back
          </button>
        </div>
      </div>

      <div className="px-4 py-2">
        {/* Search and Filter Controls */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name..."
              className="pl-10 p-2 w-full rounded-lg bg-white border border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <FaFilter className="text-primary" />
            <select
              className="p-2 rounded-lg bg-white border border-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETE">Complete</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-5 bg-primary text-secondary p-3 font-bold">
            <div>Order ID</div>
            <div>Customer</div>
            <div>Date</div>
            <div>Amount</div>
            <div>Status</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              // Loading state
              <div className="p-4 text-center">Loading orders...</div>
            ) : filteredOrders.length > 0 ? (
              // Orders list
              filteredOrders.map((order) => (
                <div
                  key={order.order_id}
                  onClick={() => handleOrderClick(order)}
                  className="grid grid-cols-5 p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="font-medium">
                    {order.order_id.substring(0, 8)}
                  </div>
                  <div>{order.customer_name || "Walk-in Customer"}</div>
                  <div>{formatDate(order.created_at)}</div>
                  <div>₱ {order.total_amount.toFixed(2)}</div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        order.status === "COMPLETE"
                          ? "bg-green-100 text-green-800"
                          : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              // No results state
              <div className="p-4 text-center text-gray-500">
                No orders found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-500">Order ID</p>
                  <p className="font-semibold">{selectedOrder.order_id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p
                    className={`font-semibold ${
                      selectedOrder.status === "COMPLETE"
                        ? "text-green-600"
                        : selectedOrder.status === "CANCELLED"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {selectedOrder.status}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-semibold">
                    {selectedOrder.customer_name || "Walk-in Customer"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Method</p>
                  <p className="font-semibold">
                    {selectedOrder.payment_method}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-semibold">
                    {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-semibold">
                    {formatDate(
                      selectedOrder.updated_at || selectedOrder.created_at
                    )}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Services</h3>
                {Object.keys(selectedOrder.services).length > 0 ? (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {Object.entries(selectedOrder.services).map(
                      ([serviceName, serviceData]) => (
                        <div key={serviceName} className="mb-3 border-b pb-2">
                          <div className="flex justify-between font-semibold">
                            <span>{serviceName}</span>
                            <span>₱ {serviceData.sub_total.toFixed(2)}</span>
                          </div>
                          <div className="pl-4 text-sm text-gray-600">
                            {Object.entries(serviceData.laundryWeights).map(
                              ([laundryName, laundryData]) => (
                                <div
                                  key={laundryName}
                                  className="flex justify-between"
                                >
                                  <span>
                                    {laundryName} ({laundryData.value} units)
                                  </span>
                                  <span>
                                    ₱ {laundryData.laundry_total.toFixed(2)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No services in this order</p>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Products</h3>
                {Object.keys(selectedOrder.products).length > 0 ? (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {Object.values(selectedOrder.products).map((product) => (
                      <div
                        key={product.item_id}
                        className="flex justify-between mb-2"
                      >
                        <span>
                          {product.item_name} ({product.quantity} x ₱{" "}
                          {product.price.toFixed(2)})
                        </span>
                        <span className="font-semibold">
                          ₱ {(product.price * product.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No products in this order</p>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold mb-4">
                  <span>Total Amount</span>
                  <span>₱ {selectedOrder.total_amount.toFixed(2)}</span>
                </div>

                {selectedOrder.status === "PENDING" && (
                  <button
                    onClick={handleCompleteOrder}
                    disabled={isProcessing}
                    className={`w-full p-3 rounded-lg text-white font-semibold ${
                      isProcessing
                        ? "bg-gray-400"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isProcessing ? "Processing..." : "Complete Payment"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default OrderLogPage;
