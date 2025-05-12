import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import LaundryWeightSection from "../sections/LaundryWeightSection";
import ProductSection, { OrderProduct } from "../sections/ProductSection";
import { SelectedServices } from "../types/laundry";
import { toast, Toaster } from "react-hot-toast";
import { ProductItemEntries } from "../types/inventory";
import { getAllProducts, createOrder, createAuditLog } from "../lib/supabase";
import { BsCash } from "react-icons/bs";
import { IMAGE } from "../constants/images";
import { AiOutlineAudit } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "../components/ConfirmDialog"; // Import the confirm dialog hook

function CashierPage() {
  const navigate = useNavigate();
  const { confirm } = useConfirm(); // Add the confirm hook
  const [selectedServices, setSelectedServices] = useState<SelectedServices>(
    {}
  );
  const [orderProducts, setOrderProducts] = useState<
    Record<string, OrderProduct>
  >({});
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [products, setProducts] = useState<ProductItemEntries[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      const result = await getAllProducts();
      if (result.success) {
        setProducts(result.data || []);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let total = 0;

    // Calculate services total
    Object.entries(selectedServices).forEach(([serviceName, data]) => {
      if (serviceName === "Full Service") {
        total += data.service_price;
      } else {
        total += data.sub_total;
      }
    });

    Object.values(orderProducts).forEach((product) => {
      total += product.price * product.quantity;
    });

    setOrderTotal(total);
  }, [selectedServices, orderProducts]);

  const removeService = (serviceName: string) => {
    setSelectedServices((prev) => {
      const updated = { ...prev };
      delete updated[serviceName];
      return updated;
    });
  };

  const removeProductFromOrder = (itemId: string) => {
    const product = orderProducts[itemId];

    if (!product) return;
    setProducts((prevProducts) => {
      return prevProducts.map((p) => {
        if (
          p.TBL_PRODUCT_ITEM.item_id === itemId &&
          p.entry_id === product.entry_id
        ) {
          return {
            ...p,
            quantity: (p.quantity || 0) + 1,
          };
        }
        return p;
      });
    });

    if (product.quantity > 1) {
      setOrderProducts((prev) => ({
        ...prev,
        [itemId]: {
          ...product,
          quantity: product.quantity - 1,
        },
      }));
    } else {
      setOrderProducts((prev) => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    }
  };

  const processOrder = async () => {
    setIsProcessing(true);
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();
    const dateString = `${month}${day}${year}`;

    const randomNum = Math.floor(Math.random() * 9999999) + 1;
    const increment = String(randomNum).padStart(3, "0");

    const receiptId = `RID-${dateString}-${increment}`;

    try {
      const result = await createOrder(
        orderTotal,
        paymentMethod,
        orderProducts,
        selectedServices,
        customerName,
        receiptId
      );

      if (result.success) {
        toast.success("Order completed successfully!");

        const currentWorker = JSON.parse(
          localStorage.getItem("currentWorker") || "{}"
        );
        await createAuditLog({
          employee_id: currentWorker.data?.worker?.employee_id || "",
          email: currentWorker.data?.worker?.email || "",
          action_type: "CREATE ORDER",
          details: `Created Order ${receiptId}`,
          on_page: "Point of Sales",
        });
        // Reset order state
        setSelectedServices({});
        setOrderProducts({});
        setOrderTotal(0);
        setCustomerName("");

        // Refresh product inventory
        const productsResult = await getAllProducts();
        if (productsResult.success) {
          setProducts(productsResult.data || []);
        }
      } else {
        toast.error("Failed to process payment. Please try again.");
        console.error("Error creating order:", result.error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Exception in payment processing:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompletePayment = async () => {
    if (
      Object.keys(selectedServices).length === 0 &&
      Object.keys(orderProducts).length === 0
    ) {
      toast.error("Please add services or products to your order");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }

    // Check if order total exceeds ₱10,000
    if (orderTotal > 10000) {
      confirm({
        title: "High Value Order",
        message: `This order total is ₱${orderTotal.toFixed(
          2
        )}, which exceeds ₱10,000. Are you sure you want to proceed with this high-value order?`,
        confirmText: "Yes, Process Order",
        cancelText: "Cancel",
        onConfirm: processOrder,
      });
    } else {
      // If order is below threshold, process normally
      processOrder();
    }
  };

  return (
    <main className="flex flex-col gap-2 bg-secondary text-primary font-outfit h-fit">
      <Toaster position="top-right" />
      <NavBar />
      <div className="flex justify-between items-center">
        <p className="font-michroma font-black text-3xl">POINT OF SALES</p>
        <div className="flex gap-2 pr-2">
          <button
            onClick={() => navigate("/order-log")}
            className="border-2 border-primary px-2 py-1 flex items-center gap-2 rounded-lg bg-primary text-secondary hover:bg-secondary hover:text-primary transition-colors"
          >
            <AiOutlineAudit />
            Order Log
          </button>
        </div>
      </div>
      <main className="flex gap-1 items-start">
        <div className="flex-1 flex flex-col gap-8 min-w-fit pr-4">
          <LaundryWeightSection
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
          />
          <ProductSection
            products={products}
            setProducts={setProducts}
            orderProducts={orderProducts}
            setOrderProducts={setOrderProducts}
          />
        </div>
        <div className="flex-1 flex flex-col p-2 py-0">
          <div className="mb-4">
            <p className="font-bold text-3xl">Order</p>
            <div className="p-4 rounded-lg flex flex-col gap-2">
              {Object.entries(selectedServices).map(([serviceName]) => {
                const isFullService = serviceName === "Full Service";
                return (
                  <div key={serviceName} className="flex relative group">
                    <button
                      className="absolute -left-6 z-10 top-0 bottom-0 bg-primary text-white flex items-center justify-center rounded-tl-lg rounded-bl-lg px-2 opacity-0 group-hover:opacity-100 transform translate-x-full group-hover:translate-x-0 transition-all duration-200"
                      onClick={() => removeService(serviceName)}
                    >
                      X
                    </button>
                    <div className="relative p-2 border-2 rounded-md border-gray-300 select-none w-full">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <p>{serviceName}</p>
                        <p>
                          TOTAL{" "}
                          {selectedServices[serviceName].sub_total.toFixed(2)}
                        </p>
                      </div>
                      <ul key={serviceName}>
                        {isFullService ? (
                          <li className="flex justify-between">
                            - Fixed Price{" "}
                            <span>
                              {selectedServices[serviceName].sub_total}
                            </span>
                          </li>
                        ) : (
                          Object.entries(
                            selectedServices[serviceName].laundryWeights
                          ).map(([laundryName, data]) => (
                            <li key={laundryName}>
                              <span>
                                {laundryName} - {data.laundry_total}
                              </span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })}

              {Object.values(orderProducts).map((product) => (
                <div key={product.item_id} className="flex relative group">
                  <button
                    className="absolute -left-6 z-10 top-0 bottom-0 bg-primary text-white flex items-center justify-center rounded-tl-lg rounded-bl-lg px-2 opacity-0 group-hover:opacity-100 transform translate-x-full group-hover:translate-x-0 transition-all duration-200"
                    onClick={() => removeProductFromOrder(product.item_id)}
                  >
                    X
                  </button>
                  <div className="relative p-2 border-2 rounded-md border-gray-300 select-none w-full">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <p>{product.item_name}</p>
                      <p>TOTAL {product.price * product.quantity}</p>
                    </div>
                    <ul>
                      <li className="flex justify-between">
                        - {product.quantity} x ₱ {product.price.toFixed(2)}{" "}
                        <span>
                          ₱ {(product.price * product.quantity).toFixed(2)}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              ))}

              {Object.keys(selectedServices).length === 0 &&
                Object.keys(orderProducts).length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    No items in order. Add services or products to proceed.
                  </div>
                )}
            </div>
          </div>
          <div className="">
            <p className="font-bold text-3xl">Summary</p>
            <div className="my-2 bg-gray-300 p-4 rounded-lg flex flex-col">
              <div className="flex justify-between">
                <p className="text-2xl">Total </p>
                <p className="text-2xl">PHP {orderTotal.toFixed(2)}</p>
              </div>
            </div>
            <p className="font-bold text-xl">Payment Method</p>
            <div className="flex justify-between gap-4">
              <label
                className={`my-2 p-4 rounded-lg flex-1 flex items-center justify-center gap-2 text-2xl cursor-pointer ${
                  paymentMethod === "Cash"
                    ? "bg-accent text-secondary"
                    : "bg-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash"
                  checked={paymentMethod === "Cash"}
                  onChange={() => setPaymentMethod("Cash")}
                  className="hidden"
                />
                <BsCash />
                <p className="font-bold">Cash</p>
              </label>

              <label
                className={`my-2 p-4 rounded-lg flex-1 flex items-center justify-center cursor-pointer ${
                  paymentMethod === "GCash"
                    ? "bg-accent text-secondary"
                    : "bg-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="GCash"
                  checked={paymentMethod === "GCash"}
                  onChange={() => setPaymentMethod("GCash")}
                  className="hidden"
                />
                <img src={IMAGE.GcashLogo} alt="GCash" />
              </label>
            </div>
            <div className="w-full py-2 pb-4 ">
              <label className="font-bold text-xl">Customer Name</label>

              <input
                onChange={(e) => setCustomerName(e.target.value)}
                type="text"
                value={customerName}
                placeholder="e.g Juan Cruz"
                className="p-2 w-full rounded-lg"
              />
            </div>
            <button
              className={`p-3 text-xl rounded-lg w-full ${
                isProcessing
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-accent3 hover:bg-orange-500 transition-colors"
              }`}
              onClick={handleCompletePayment}
              disabled={isProcessing || orderTotal <= 0}
            >
              {isProcessing ? "Processing..." : "Complete Order"}
            </button>
          </div>
        </div>
      </main>
    </main>
  );
}

export default CashierPage;
