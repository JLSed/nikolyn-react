import { createClient } from "@supabase/supabase-js";
import { ApiResponse } from "../types/api";
import { Worker, WorkerRole } from "../types/worker";
import { LaundryType, Service } from "../types/laundry";
import {
  ProductEntry,
  ProductItem,
  ProductItemEntries,
} from "../types/inventory";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
})();

export async function getCurrentWorker(): Promise<
  ApiResponse<{ worker: Worker; roles: WorkerRole[] }>
> {
  const session = await supabase.auth.getSession();
  const userId = session.data?.session?.user?.id;
  if (!userId) return { success: false, error: "Not authenticated" };

  const { data: workerData, error } = (await supabase
    .from("TBL_WORKER")
    .select("employee_id, first_name, middle_name, last_name")
    .eq("auth_id", userId)
    .single()) as { data: Worker | null; error: any };

  if (error || !workerData) return { success: false, error: error };
  const rolesResponse = await getAllWorkerRoles(workerData.employee_id);
  if (!rolesResponse.success) {
    return { success: false, error: rolesResponse.error };
  }
  return {
    success: true,
    data: {
      worker: workerData,
      roles: rolesResponse.data as WorkerRole[],
    },
  };
}

export async function getAllWorkerRoles(
  employee_id: string
): Promise<ApiResponse<WorkerRole[]>> {
  const { data, error } = (await supabase
    .from("TBL_WORKER_ROLE")
    .select("TBL_ROLE (*)")
    .eq("employee_id", employee_id)) as {
    data: WorkerRole[] | null;
    error: any;
  };

  if (error || !data) return { success: false, error: error };
  return { success: true, data: data };
}

export async function getAllServices(): Promise<ApiResponse<Service[]>> {
  const { data, error } = (await supabase.from("TBL_SERVICE").select("*")) as {
    data: Service[] | null;
    error: any;
  };

  if (error || !data) return { success: false, error: error };
  return { success: true, data: data };
}

export async function getAllLaundryType(): Promise<ApiResponse<LaundryType[]>> {
  const { data, error } = (await supabase
    .from("TBL_LAUNDRY_TYPE")
    .select("*")) as {
    data: LaundryType[] | null;
    error: any;
  };

  if (error || !data) return { success: false, error: error };
  return { success: true, data: data };
}

export async function getAllProducts(): Promise<
  ApiResponse<ProductItemEntries[]>
> {
  const { data, error } = (await supabase.from("TBL_PRODUCT_ENTRY").select(`
      entry_id,
      added_at,
      expiration_date,
      purchased_date,
      quantity,
      TBL_PRODUCT_ITEM (
        item_name,
        price,
        barcode,
        category,
        weight
      )
    `)) as {
    data: ProductItemEntries[] | null;
    error: any;
  };
  if (error || !data) return { success: false, error: error };
  return { success: true, data: data };
}

export async function getAllProductItems(): Promise<
  ApiResponse<ProductItem[]>
> {
  const { data, error } = (await supabase
    .from("TBL_PRODUCT_ITEM")
    .select("*")
    .order("item_name")) as { data: ProductItem[] | null; error: any };

  if (error || !data) return { success: false, error: error };
  return { success: true, data: data };
}

export async function addProductEntry(
  entry: Omit<ProductEntry, "entry_id" | "added_at">
): Promise<ApiResponse<ProductEntry>> {
  const { data, error } = (await supabase
    .from("TBL_PRODUCT_ENTRY")
    .insert([entry])
    .select()) as {
    data: ProductEntry[];
    error: any;
  };

  if (error) {
    console.error("Error adding product entry:", error);
    return { success: false, error };
  }
  return { success: true, data: data[0] };
}

export async function getProductCategories(): Promise<ApiResponse<string[]>> {
  // Use distinct to get unique categories
  const { data, error } = (await supabase.rpc("get_categories")) as {
    data: string[] | null;
    error: any;
  };
  if (error || !data) return { success: false, error: error };
  return { success: true, data: data };
}

export async function addProductItem(
  item: Omit<ProductItem, "item_id">
): Promise<ApiResponse<ProductItem>> {
  const { data, error } = (await supabase
    .from("TBL_PRODUCT_ITEM")
    .insert([item])
    .select()) as {
    data: ProductItem[];
    error: any;
  };

  if (error) {
    console.error("Error adding product item:", error);
    return { success: false, error };
  }
  return { success: true, data: data[0] };
}
