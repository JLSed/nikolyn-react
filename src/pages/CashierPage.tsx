import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import LaundryWeightSection from "../sections/LaundryWeightSection";
import ProductSection, { OrderProduct } from "../sections/ProductSection";
import { LaundryWeights, SelectedServices } from "../types/laundry";
import { toast, Toaster } from "react-hot-toast";
import { ProductItemEntries } from "../types/inventory";
import { getAllProducts } from "../lib/supabase";

function CashierPage() {
  const [selectedServices, setSelectedServices] = useState<SelectedServices>(
    {}
  );
  const [laundryWeights, setLaundryWeights] = useState<LaundryWeights>({});
  const [orderProducts, setOrderProducts] = useState<
    Record<string, OrderProduct>
  >({});
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [products, setProducts] = useState<ProductItemEntries[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const result = await getAllProducts();
      if (result.success) {
        setProducts(result.data || []);
      }
    };
    fetchProducts();
  }, []);
  // Calculate order summary and total
  useEffect(() => {
    let total = 0;

    // Calculate services total
    Object.entries(selectedServices).forEach(([serviceName, servicePrice]) => {
      if (serviceName === "Full Service") {
        total += 100; // Fixed price for Full Service
      } else {
        let serviceTotal = 0;
        Object.entries(laundryWeights).forEach(([_, data]) => {
          if (data.value > 0 && data.limit > 0) {
            const loads = Math.ceil(data.value / data.limit);
            const subTotal = loads * servicePrice;
            serviceTotal += subTotal;
          }
        });
        total += serviceTotal;
      }
    });

    // Add products total
    Object.values(orderProducts).forEach((product) => {
      total += product.price * product.quantity;
    });

    setOrderTotal(total);
  }, [laundryWeights, selectedServices, orderProducts]);

  // Remove a service from the selectedServices list
  const removeService = (serviceName: string) => {
    setSelectedServices((prev) => {
      const updated = { ...prev };
      delete updated[serviceName];
      return updated;
    });
  };

  // Remove a product from order (decrease quantity by 1)
  const removeProductFromOrder = (itemId: string) => {
    const product = orderProducts[itemId];

    if (!product) return;
    // Update the products list by increasing the quantity
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
      // Decrease quantity by 1
      setOrderProducts((prev) => ({
        ...prev,
        [itemId]: {
          ...product,
          quantity: product.quantity - 1,
        },
      }));
    } else {
      // Remove product entirely if quantity becomes 0
      setOrderProducts((prev) => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    }

    // Return the product to inventory
    toast.success(`Returned ${product.item_name} to inventory`);
  };

  return (
    <main className="flex flex-col gap-2 bg-secondary text-primary font-outfit h-fit">
      <Toaster position="top-right" />
      <NavBar />
      <div className="flex justify-between items-center">
        <p className="font-michroma font-black text-3xl">POINT OF SALES</p>
        <div className="flex gap-2 pr-2">
          <a href="" className="border-2 border-primary px-2 py-1">
            Ongoing
          </a>
          <a href="" className="border-2 border-primary px-2 py-1">
            Completed
          </a>
          <a href="" className="border-2 border-primary px-2 py-1">
            Cancelled
          </a>
        </div>
      </div>
      <main className="flex gap-1 items-start">
        <div className="flex-1 flex flex-col gap-8 min-w-fit pr-4">
          <LaundryWeightSection
            setLaundryWeights={setLaundryWeights}
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
              {/* Services Section */}
              {Object.entries(selectedServices).map(
                ([serviceName, servicePrice]) => {
                  let serviceTotal = 0;
                  const isFullService = serviceName === "Full Service";
                  return (
                    <div
                      key={serviceName}
                      className="relative p-2 border-2 rounded-md border-gray-300"
                    >
                      {/* Remove Button */}
                      <button
                        className="absolute top-0 left-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        onClick={() => removeService(serviceName)}
                      >
                        X
                      </button>
                      <div className="flex justify-between items-center text-lg font-bold">
                        <p>{serviceName}</p>
                        <p>
                          TOTAL{" "}
                          {isFullService
                            ? 100
                            : Object.entries(laundryWeights).reduce(
                                (sum, [_, data]) => {
                                  if (data.value > 0 && data.limit > 0) {
                                    const loads = Math.ceil(
                                      data.value / data.limit
                                    );
                                    const subTotal = loads * servicePrice;
                                    serviceTotal += subTotal;
                                    return sum + subTotal;
                                  }
                                  return sum;
                                },
                                0
                              )}
                        </p>
                      </div>
                      <ul>
                        {isFullService ? (
                          <li className="flex justify-between">
                            - Fixed Price <span>100</span>
                          </li>
                        ) : (
                          Object.entries(laundryWeights).map(
                            ([laundryName, data]) => {
                              if (data.value > 0 && data.limit > 0) {
                                const loads = Math.ceil(
                                  data.value / data.limit
                                );
                                const subTotal = loads * servicePrice;
                                return (
                                  <li
                                    key={laundryName}
                                    className="flex justify-between"
                                  >
                                    - {laundryName} <span>{subTotal}</span>
                                  </li>
                                );
                              }
                              return null;
                            }
                          )
                        )}
                      </ul>
                    </div>
                  );
                }
              )}

              {/* Products Section */}
              {Object.values(orderProducts).map((product) => (
                <div
                  key={product.item_id}
                  className="relative p-2 border-2 rounded-md border-gray-300"
                >
                  {/* Remove Button */}
                  <button
                    className="absolute top-0 left-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    onClick={() => removeProductFromOrder(product.item_id)}
                  >
                    X
                  </button>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <p>{product.item_name}</p>
                    <p>TOTAL {product.price * product.quantity}</p>
                  </div>
                  <ul>
                    <li className="flex justify-between">
                      - {product.quantity} x ₱{product.price}{" "}
                      <span>₱{product.price * product.quantity}</span>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="">
            <p className="font-bold text-3xl">Summary</p>
            <div className="my-2 bg-gray-300 p-4 rounded-lg flex flex-col">
              <div className="flex justify-between">
                <p className="text-2xl">Total </p>
                <p className="text-2xl">PHP {orderTotal}</p>
              </div>
            </div>
            <button className="p-3 bg-accent3 text-xl rounded-lg w-full">
              Complete Payment
            </button>
          </div>
        </div>
      </main>
    </main>
  );
}

export default CashierPage;
