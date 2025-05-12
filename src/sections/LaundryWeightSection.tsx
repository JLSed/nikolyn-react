import { useEffect, useState } from "react";
import { getAllLaundryType, getAllServices } from "../lib/supabase";
import {
  LaundryType,
  LaundryWeight,
  SelectedServices,
  Service,
} from "../types/laundry";

interface Props {
  selectedServices: SelectedServices;
  setSelectedServices: React.Dispatch<React.SetStateAction<SelectedServices>>;
}

function LaundryWeightSection({
  selectedServices,
  setSelectedServices,
}: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [laundryType, setLaundryType] = useState<LaundryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // New state for laundry weights
  const [laundryWeights, setLaundryWeights] = useState<
    Record<string, { value: number; limit: number }>
  >({});

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      const result = await getAllServices();
      if (result.success) {
        setServices(result.data || []);
      } else {
        console.error("Failed to fetch services:", result.error);
      }
      setIsLoading(false);
    };

    const fetchLaundryType = async () => {
      const result = await getAllLaundryType();
      if (result.success) {
        setLaundryType(result.data || []);
      } else {
        console.error("Failed to fetch laundry types:", result.error);
      }
    };

    fetchLaundryType();
    fetchServices();
  }, []);

  const handleLaundryWeightChange = (
    laundryName: string,
    value: number,
    limit: number
  ) => {
    setLaundryWeights((prev) => {
      const updated = { ...prev };

      if (value > 0) {
        updated[laundryName] = { value, limit };
      } else {
        // Remove if value is 0 or negative
        delete updated[laundryName];
      }

      return updated;
    });
  };

  useEffect(() => {
    if (
      Object.keys(selectedServices).length === 0 ||
      Object.keys(laundryWeights).length === 0
    ) {
      return;
    }

    const serviceNames = Object.keys(selectedServices);

    const updatedServices: SelectedServices = {};

    serviceNames.forEach((serviceName) => {
      const price =
        services.find((s) => s.service_name === serviceName)?.price_per_limit ||
        0;
      const newLaundryWeights: Record<string, LaundryWeight> = {};
      let sub_total = 0;
      if (serviceName === "Full Service") {
        sub_total = price;
      } else {
        Object.entries(laundryWeights).forEach(([name, { value, limit }]) => {
          newLaundryWeights[name] = {
            value,
            limit,
            laundry_total: calculateLaundryTotal(price, value, limit),
          };
        });
        sub_total = calculateSubTotal(price, newLaundryWeights);
      }

      updatedServices[serviceName] = {
        laundryWeights: newLaundryWeights,
        sub_total,
        service_price: price,
      };
    });

    setSelectedServices(updatedServices);
  }, [laundryWeights, services]);

  const handleServiceChange = (
    serviceName: string,
    checked: boolean,
    price: number
  ) => {
    if (checked) {
      setSelectedServices((prev) => {
        const newLaundryWeights: Record<string, LaundryWeight> = {};
        if (serviceName === "Full Service") {
          return {
            ...prev,
            [serviceName]: {
              sub_total: price, // Fixed price for full service
              service_price: price,
              laundryWeights: {},
            },
          };
        }
        Object.entries(laundryWeights).forEach(([name, { value, limit }]) => {
          newLaundryWeights[name] = {
            value,
            limit,
            laundry_total: calculateLaundryTotal(price, value, limit),
          };
        });

        return {
          ...prev,
          [serviceName]: {
            sub_total: calculateSubTotal(price, newLaundryWeights),
            service_price: price,
            laundryWeights: newLaundryWeights,
          },
        };
      });
    } else {
      setSelectedServices((prev) => {
        const updated = { ...prev };
        delete updated[serviceName];
        return updated;
      });
    }
  };

  function calculateLaundryTotal(
    price: number,
    value: number,
    limit: number
  ): number {
    if (value > 0 && limit > 0) {
      const loads = Math.ceil(value / limit);
      return loads * price;
    }
    return 0;
  }

  function calculateSubTotal(
    price: number,
    laundryWeights: Record<string, { value: number; limit: number }>
  ) {
    let sub_total = 0;
    Object.values(laundryWeights).forEach((data) => {
      sub_total += calculateLaundryTotal(price, data.value, data.limit);
    });
    return sub_total;
  }

  return (
    <div className="flex flex-col bg-primary text-secondary p-4 rounded-lg rounded-tl-none rounded-bl-none">
      <p className="text-2xl font-bold text-accent3">Laundry Weight</p>
      <div className="grid grid-cols-3 gap-4 w-full py-3">
        {laundryType.map((type) => (
          <div key={type.type_id} className="flex flex-col rounded-md">
            <p className="font-medium mb-1">{type.cloth_name}</p>
            <div className="flex gap-2 items-center mb-1">
              <input
                type="number"
                className="category-input p-2 w-full rounded-md text-primary font-bold bg-secondary"
                value={laundryWeights[type.cloth_name]?.value || ""}
                onChange={(e) =>
                  handleLaundryWeightChange(
                    type.cloth_name,
                    Number(e.target.value),
                    Number(type.limit)
                  )
                }
              />
            </div>
            <p className="text-sm text-secondary/80">
              {type.limit} {type.weight_unit} Max Load
            </p>
          </div>
        ))}
      </div>
      <p className="text-2xl font-bold text-accent3 mt-4">Services</p>
      <div className="flex">
        <form className="flex gap-4">
          {services.map((service) => (
            <div key={service.service_id}>
              <p>₱ {service.price_per_limit} per Max Load</p>
              <div className="px-2 flex border-2 border-secondary rounded-md text-secondary p-1 gap-2">
                <input
                  className="scale-150"
                  value="Wash"
                  type="checkbox"
                  checked={!!selectedServices[service.service_name]}
                  onChange={(e) => {
                    handleServiceChange(
                      service.service_name,
                      e.target.checked,
                      service.price_per_limit
                    );
                  }}
                />
                {isLoading ? (
                  <div className="w-full relative overflow-hidden p-4 mx-2 bg-gray-400/40 rounded-md">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent shimmer"></div>
                  </div>
                ) : (
                  <p className="text-2xl">{service.service_name}</p>
                )}
              </div>
            </div>
          ))}
        </form>
      </div>
    </div>
  );
}

export default LaundryWeightSection;
