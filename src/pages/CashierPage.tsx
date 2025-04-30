import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import LaundryWeightSection from "../sections/LaundryWeightSection";
import ProductSection from "../sections/ProductSection"

function CashierPage() {
  const [laundryWeights, setLaundryWeights] = useState<{
    [name: string]: { value: number; limit: number };
  }>({});
  const [selectedServices, setSelectedServices] = useState<{
    [name: string]: number;
  }>({});
  const [orderTotal, setOrderTotal] = useState<number>(0);

  // Calculate order summary and total
  useEffect(() => {
    let total = 0;
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
    setOrderTotal(total);
  }, [laundryWeights, selectedServices]);

  return (
    <main className="flex flex-col gap-2 bg-secondary text-primary font-outfit">
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
      <main className="flex gap-1">
        <div className="flex-1 flex flex-col gap-8 min-w-fit pr-4">
          <LaundryWeightSection
            setLaundryWeights={setLaundryWeights}
            setSelectedServices={setSelectedServices}
          />
                    <ProductSection />
        </div>
        <div className=" flex-1 flex flex-col p-2 py-0">
          <div className=" mb-4 ">
            <p className="font-bold text-3xl">Order</p>
            <div className=" p-4 rounded-lg flex flex-col gap-2">
              {Object.entries(selectedServices).map(
                ([serviceName, servicePrice]) => {
                  let serviceTotal = 0;
                  const isFullService = serviceName === "Full Service";
                  return (
                    <div
                      key={serviceName}
                      className="p-2 border-2 rounded-md border-gray-300"
                    >
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
            <button className="p-3 bg-orange-400 text-xl rounded-lg w-full">
              Complete Payment
            </button>
          </div>
        </div>
      </main>
    </main>
  );
}

export default CashierPage;
