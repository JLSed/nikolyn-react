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
}

export type LaundryWeights = Record<string, LaundryWeight>;
export type SelectedServices = Record<string, number>;
