import { useEffect, useState } from "react";
import { getAllLaundryType, getAllServices } from "../lib/supabase";
import { LaundryService, Service as ServiceType } from "../types/interface";

interface Props {
  setLaundryWeights: React.Dispatch<
    React.SetStateAction<{ [name: string]: { value: number; limit: number } }>
  >;
  setSelectedServices: React.Dispatch<
    React.SetStateAction<{ [name: string]: number }>
  >;
}

function LaundryWeightSection({
  setLaundryWeights,
  setSelectedServices,
}: Props) {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [laundryType, setlaundryType] = useState<LaundryService[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      const result = await getAllServices();
      if (result && result.success) {
        setServices(
          (result.services || []).map((service) => ({
            serviceKey: service.service_id as string,
            serviceName: service.service_name as string,
            servicePrice: service.price_per_limit as number,
          }))
        );
      } else {
        console.error("Failed to fetch services:", result?.error);
      }
    };

    const fetchLaundryType = async () => {
      const result = await getAllLaundryType();
      if (result && result.success) {
        setlaundryType(
          (result.services || []).map((laundry) => ({
            laundryKey: laundry.type_id as string,
            laundryName: laundry.cloth_name as string,
            laundryLimit: laundry.limit as number,
            weightUnit: laundry.weight_unit as string,
          }))
        );
      } else {
        console.error("Failed to fetch services:", result?.error);
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
    <div className="border-2 bg-primary text-secondary p-4">
      <p className="text-2xl font-bold text-accent">Laundry Weight</p>
      <div className="flex gap-4">
        {laundryType.map((type) => (
          <div key={type.laundryKey}>
            <p>{type.laundryName}</p>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                className="category-input p-2 text-primary font-bold bg-secondary"
                onChange={(e) =>
                  handleLaundryWeightChange(
                    type.laundryName,
                    Number(e.target.value),
                    Number(type.laundryLimit)
                  )
                }
              />
            </div>
            <p>
              {type.laundryLimit} {type.weightUnit} Max Limit
            </p>
          </div>
        ))}
      </div>
      <p className="text-4xl font-bold text-accent">Services</p>
      <div className="flex">
        <form className="flex gap-4">
          {services.map((service) => (
            <div key={service.serviceKey}>
              <p>₱ {service.servicePrice} per Limit</p>
              <div className="px-2 flex border-2 border-secondary text-secondary p-1 gap-2">
                <input
                  className="scale-150"
                  value="Wash"
                  type="checkbox"
                  onChange={(e) => {
                    handleServiceChange(
                      service.serviceName,
                      e.target.checked,
                      service.servicePrice
                    );
                  }}
                />
                <p className="text-2xl">{service.serviceName}</p>
              </div>
            </div>
          ))}
        </form>
      </div>
    </div>
  );
}

export default LaundryWeightSection;
