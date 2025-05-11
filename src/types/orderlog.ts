import { SelectedServices } from "./laundry";

export interface Order {
  order_id: string;
  order_date: string;
  status: string;
  total_amount: number;
  payment_method: string;
  products: Record<string, any>;
  services: SelectedServices;
  customer_name: string;
  created_at: string;
  updated_at: string;
  receipt_id: string;
}
