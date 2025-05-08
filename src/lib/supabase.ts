import { createClient } from "@supabase/supabase-js";
import { ApiResponse } from "../types/api";
import { Worker, WorkerRole } from "../types/worker";
import { LaundryType, SelectedServices, Service } from "../types/laundry";
import {
  ProductEntry,
  ProductItem,
  ProductItemEntries,
} from "../types/inventory";
import { OrderProduct } from "../sections/ProductSection";
import { Order } from "../types/orderlog";

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
        item_id,
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

export async function createOrder(
  total_amount: number,
  payment_method: string,
  products: Record<string, OrderProduct>,
  services: SelectedServices
): Promise<ApiResponse<string>> {
  try {
    // 1. Insert the order
    const { data, error } = await supabase
      .from("TBL_ORDERS")
      .insert([
        {
          total_amount,
          payment_method,
          products,
          services,
        },
      ])
      .select("order_id");

    if (error) {
      console.error("Error creating order:", error);
      return { success: false, error };
    }

    const updatePromises = Object.values(products).map((product) =>
      supabase.rpc("decrease_quantity", {
        entry_id: product.entry_id,
        quantity_to_subtract: product.quantity,
      })
    );

    const updateResults = await Promise.allSettled(updatePromises);
    console.log("Update results:", updateResults);
    // Check for any failed updates
    const failedUpdates = updateResults.filter(
      (result) =>
        result.status === "rejected" ||
        (result.status === "fulfilled" && result.value.error)
    );

    if (failedUpdates.length > 0) {
      console.warn("Some inventory updates failed:", failedUpdates);
      // You might want to log these failures to address them later
    }

    return { success: true };
  } catch (error) {
    console.error("Exception creating order:", error);
    return { success: false, error };
  }
}

// Add these functions to your existing supabase.ts file

// Get all orders from TBL_ORDERS
export async function getAllOrders(): Promise<ApiResponse<Order[]>> {
  try {
    const { data, error } = (await supabase
      .from("TBL_ORDERS")
      .select("*")
      .order("created_at", { ascending: false })) as {
      data: Order[] | null;
      error: any;
    };

    if (error) {
      console.error("Error fetching orders:", error);
      return { success: false, error };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Exception fetching orders:", error);
    return { success: false, error };
  }
}

// Update the status of an order
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<ApiResponse<any>> {
  try {
    const { error } = await supabase
      .from("TBL_ORDERS")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    if (error) {
      console.error("Error updating order status:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception updating order status:", error);
    return { success: false, error };
  }
}

// Get all workers with their roles
export async function getAllWorkers(): Promise<ApiResponse<WorkerWithRoles[]>> {
  try {
    // First, get all workers
    const { data: workers, error: workersError } = await supabase
      .from("TBL_WORKER")
      .select("*")
      .order("created_at", { ascending: false });

    if (workersError) {
      throw workersError;
    }

    // For each worker, get their roles
    const workersWithRoles = await Promise.all(
      workers.map(async (worker) => {
        const { data: roles, error: rolesError } = await supabase
          .from("TBL_WORKER_ROLE")
          .select("*, TBL_ROLE(*)")
          .eq("employee_id", worker.employee_id);

        if (rolesError) {
          console.error(
            `Error fetching roles for worker ${worker.employee_id}:`,
            rolesError
          );
          return { ...worker, roles: [] };
        }

        return { ...worker, roles: roles || [] };
      })
    );

    return { success: true, data: workersWithRoles };
  } catch (error) {
    console.error("Error fetching workers:", error);
    return { success: false, error };
  }
}

// Get all available roles
export async function getAllRoles(): Promise<ApiResponse<Role[]>> {
  try {
    const { data, error } = await supabase
      .from("TBL_ROLE")
      .select("*")
      .order("role_name");

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching roles:", error);
    return { success: false, error };
  }
}

// Update worker information
export async function updateWorker(
  employee_id: string,
  updates: Partial<Worker>
): Promise<ApiResponse<Worker>> {
  try {
    const { data, error } = await supabase
      .from("TBL_WORKER")
      .update(updates)
      .eq("employee_id", employee_id)
      .select();

    if (error) {
      throw error;
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Error updating worker:", error);
    return { success: false, error };
  }
}

// Update worker roles (remove existing ones and add new ones)
export async function updateWorkerRoles(
  employee_id: string,
  role_ids: string[]
): Promise<ApiResponse<any>> {
  try {
    // Start a transaction by using RPC (this requires a custom function on your Supabase instance)
    // Alternatively, do this in sequence

    // 1. Delete existing roles
    const { error: deleteError } = await supabase
      .from("TBL_WORKER_ROLE")
      .delete()
      .eq("employee_id", employee_id);

    if (deleteError) {
      throw deleteError;
    }

    // 2. Insert new roles
    if (role_ids.length > 0) {
      const rolesToInsert = role_ids.map((role_id) => ({
        employee_id,
        role_id,
      }));

      const { error: insertError } = await supabase
        .from("TBL_WORKER_ROLE")
        .insert(rolesToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating worker roles:", error);
    return { success: false, error };
  }
}
