import { useEffect, useState } from "react";
import { getAllLaundryType, getAllServices } from "../lib/supabase";
import {
  LaundryType,
  LaundryWeights,
  SelectedServices,
  Service,
} from "../types/laundry";

interface Props {
  setLaundryWeights: React.Dispatch<React.SetStateAction<LaundryWeights>>;
  setSelectedServices: React.Dispatch<React.SetStateAction<SelectedServices>>;
}

function LaundryWeightSection({
  setLaundryWeights,
  setSelectedServices,
}: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [laundryType, setlaundryType] = useState<LaundryType[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      const result = await getAllServices();
      if (result.success) {
        setServices(result.data || []);
      } else {
        console.error("Failed to fetch services:", result.error);
      }
    };

    const fetchLaundryType = async () => {
      const result = await getAllLaundryType();
      if (result.success) {
        setlaundryType(result.data || []);
      } else {
        console.error("Failed to fetch services:", result.error);
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
      // Create a new object with all previous non-zero values
      const updated = { ...prev, [laundryName]: { value, limit } };
      // Remove keys with falsy (zero, NaN, undefined) values
      Object.keys(updated).forEach((name) => {
        if (!updated[name]) {
          delete updated[name];
        }
      });
      return updated;
    });
  };

  const handleServiceChange = (
    serviceName: string,
    checked: boolean,
    price: number
  ) => {
    if (checked) {
      setSelectedServices((prev) => ({
        ...prev,
        [serviceName]: price,
      }));
    } else {
      setSelectedServices((prev) => {
        const updated = { ...prev };
        delete updated[serviceName];
        return updated;
      });
    }
  };

  return (
    <div className="bg-primary text-secondary p-4 rounded-lg rounded-tl-none rounded-bl-none">
      <p className="text-2xl font-bold text-accent">Laundry Weight</p>
      <div className="flex gap-4">
        {laundryType.map((type) => (
          <div key={type.type_id}>
            <p>{type.cloth_name}</p>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                className="category-input p-2 rounded-md text-primary font-bold bg-secondary"
                onChange={(e) =>
                  handleLaundryWeightChange(
                    type.cloth_name,
                    Number(e.target.value),
                    Number(type.limit)
                  )
                }
              />
            </div>
            <p>
              {type.limit} {type.weight_unit} Max Limit
            </p>
          </div>
        ))}
      </div>
      <p className="text-2xl font-bold text-accent mt-4">Services</p>
      <div className="flex">
        <form className="flex gap-4">
          {services.map((service) => (
            <div key={service.service_id}>
              <p>₱ {service.price_per_limit} per Max Limit</p>
              <div className="px-2 flex border-2 border-secondary rounded-md text-secondary p-1 gap-2">
                <input
                  className="scale-150"
                  value="Wash"
                  type="checkbox"
                  onChange={(e) => {
                    handleServiceChange(
                      service.service_name,
                      e.target.checked,
                      service.price_per_limit
                    );
                  }}
                />
                <p className="text-2xl">{service.service_name}</p>
              </div>
            </div>
          ))}
        </form>
      </div>
    </div>
  );
}

export default LaundryWeightSection;
