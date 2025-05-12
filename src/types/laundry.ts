export interface Service {
  service_id: string;
  service_name: string;
  price_per_limit: number;
}

export interface LaundryType {
  type_id: string;
  cloth_name: string;
  limit: number;
  weight_unit: string;
}
export interface LaundryWeight {
  value: number;
  limit: number;
  laundry_total: number;
}

export type SelectedServices = Record<
  string,
  {
    sub_total: number;
    service_price: number;
    laundryWeights: Record<string, LaundryWeight>;
  }
>;

export type SelectedProducts = Record<
  string,
  {
    item_name: string;
    quantity: number;
    price: number;
    sub_total: number;
  }
>;
