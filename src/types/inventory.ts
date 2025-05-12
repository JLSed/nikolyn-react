export interface ProductItem {
  item_id: string;
  item_name: string;
  category: string;
  price: number;
  weight: string;
  barcode: string;
}

export interface ProductEntry {
  entry_id: string;
  item_id: string;
  added_at: string;
  expiration_date: string;
  purchased_date: string;
  quantity: number;
  supplier: string;
  or_id: string;
  damaged_quantity: number;
  missing_quantity: number;
}

export interface ProductItemEntries extends ProductEntry {
  TBL_PRODUCT_ITEM: ProductItem;
}

export interface ProductEntryFormData {
  expiration_date: string;
  purchased_date: string;
  quantity: number;
}

export interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
  onSuccess: () => void;
}
