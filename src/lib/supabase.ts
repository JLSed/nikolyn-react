import { createClient } from "@supabase/supabase-js";
import { ApiResponse, AuditLog, AuditLogWithActor } from "../types/api";
import {
  Worker,
  WorkerRole,
  WorkerWithRoles,
  CreateWorkerRequest,
} from "../types/worker";
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
    .select("*")
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
    data: { TBL_ROLE: WorkerRole }[] | null;
    error: any;
  };

  if (error || !data) return { success: false, error: error };
  const transformedData = data.map((item) => ({
    ...item.TBL_ROLE,
  }));
  return { success: true, data: transformedData };
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
      supplier,
      or_id,
      damaged_quantity,
      missing_quantity,
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
  services: SelectedServices,
  customer_name: string,
  receipt_id: string
): Promise<ApiResponse<string>> {
  try {
    const { error } = await supabase
      .from("TBL_ORDERS")
      .insert([
        {
          total_amount,
          payment_method,
          products,
          services,
          customer_name,
          receipt_id,
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
    const failedUpdates = updateResults.filter(
      (result) =>
        result.status === "rejected" ||
        (result.status === "fulfilled" && result.value.error)
    );

    if (failedUpdates.length > 0) {
      console.warn("Some inventory updates failed:", failedUpdates);
    }

    return { success: true };
  } catch (error) {
    console.error("Exception creating order:", error);
    return { success: false, error };
  }
}

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

export async function getAllWorkers(): Promise<ApiResponse<WorkerWithRoles[]>> {
  try {
    const { data: workers, error: workersError } = (await supabase
      .from("TBL_WORKER")
      .select("*")
      .order("created_at", { ascending: false })) as {
      data: Worker[] | null;
      error: any;
    };

    if (workersError) {
      throw workersError;
    }
    if (workers !== null) {
      const workersWithRoles = await Promise.all(
        workers.map(async (worker) => {
          const { data: rolesData, error: rolesError } = (await supabase
            .from("TBL_WORKER_ROLE")
            .select("TBL_ROLE(*)")
            .eq("employee_id", worker.employee_id)) as {
            data: { TBL_ROLE: WorkerRole }[] | null;
            error: any;
          };
          const roles = rolesData
            ? rolesData.map((item) => item.TBL_ROLE)
            : null;
          if (rolesError) {
            console.error(
              `Error fetching roles for worker ${worker.employee_id}:`,
              rolesError
            );
            return { worker, worker_roles: [] };
          }

          return { worker, worker_roles: roles || [] };
        })
      );
      return { success: true, data: workersWithRoles };
    }
  } catch (error) {
    console.error("Error fetching workers:", error);
    return { success: false, error };
  }
  return { success: false, error: "No workers found" };
}

export async function getAllRoles(): Promise<ApiResponse<WorkerRole[]>> {
  const { data, error } = (await supabase
    .from("TBL_ROLE")
    .select("*")
    .order("role_name")) as {
    data: WorkerRole[] | null;
    error: any;
  };
  if (error) {
    throw error;
  }

  if (error || !data) return { success: false, error: error };
  return { success: true, data: data };
}

export async function updateWorker(
  employee_id: string,
  updates: Partial<Worker>
): Promise<ApiResponse<string[]>> {
  const { data, error } = (await supabase
    .from("TBL_WORKER")
    .update(updates)
    .eq("employee_id", employee_id)
    .select()) as {
    data: string[] | null;
    error: any;
  };

  if (error || !data) return { success: false, error: error };
  return { success: true, data: data };
}

export async function updateWorkerRoles(
  employee_id: string,
  role_ids: string[]
): Promise<ApiResponse<any>> {
  try {
    const { error: deleteError } = await supabase
      .from("TBL_WORKER_ROLE")
      .delete()
      .eq("employee_id", employee_id);

    if (deleteError) {
      throw deleteError;
    }

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

export async function createWorker(
  request: CreateWorkerRequest
): Promise<ApiResponse<Worker>> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: request.email,
      password: request.password,
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return { success: false, error: authError };
    }

    const { data: workerData, error: workerError } = (await supabase
      .from("TBL_WORKER")
      .insert([
        {
          first_name: request.first_name,
          middle_name: request.middle_name,
          last_name: request.last_name,
          email: request.email,
          contact_number: request.contact_number,
          address: request.address,
          auth_id: authData?.user?.id,
          status: "PENDING",
        },
      ])
      .select()
      .single()) as {
      data: Worker | null;
      error: any;
    };

    if (workerError) {
      console.error("Error creating worker:", workerError);
      return { success: false, error: workerError };
    }

    if (request.role_ids.length > 0) {
      const rolesToInsert = request.role_ids.map((role_id) => ({
        employee_id: workerData?.employee_id,
        role_id,
      }));

      const { error: rolesError } = await supabase
        .from("TBL_WORKER_ROLE")
        .insert(rolesToInsert);

      if (rolesError) {
        console.error("Error assigning roles:", rolesError);
      }
    }

    return { success: true, data: workerData as Worker };
  } catch (error) {
    console.error("Exception creating worker:", error);
    return { success: false, error };
  }
}

export async function deleteLaundryType(
  typeId: string
): Promise<ApiResponse<any>> {
  try {
    const { error } = await supabase
      .from("TBL_LAUNDRY_TYPE")
      .delete()
      .eq("type_id", typeId);

    if (error) {
      console.error("Error deleting laundry type:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception deleting laundry type:", error);
    return { success: false, error };
  }
}

export async function updateLaundryType(
  typeId: string,
  updates: Partial<LaundryType>
): Promise<ApiResponse<any>> {
  try {
    const { error } = await supabase
      .from("TBL_LAUNDRY_TYPE")
      .update(updates)
      .eq("type_id", typeId);

    if (error) {
      console.error("Error updating laundry type:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception updating laundry type:", error);
    return { success: false, error };
  }
}

export async function addLaundryType(
  laundryType: Omit<LaundryType, "type_id">
): Promise<ApiResponse<LaundryType>> {
  const { data, error } = (await supabase
    .from("TBL_LAUNDRY_TYPE")
    .insert([laundryType])
    .select()) as {
    data: LaundryType[] | null;
    error: any;
  };

  if (error) {
    console.error("Error adding laundry type:", error);
    return { success: false, error };
  }

  if (error || !data) return { success: false, error: error };
  return { success: true, data: data[0] };
}

export async function deleteService(
  serviceId: string
): Promise<ApiResponse<any>> {
  try {
    const { error } = await supabase
      .from("TBL_SERVICE")
      .delete()
      .eq("service_id", serviceId);

    if (error) {
      console.error("Error deleting service:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception deleting service:", error);
    return { success: false, error };
  }
}

export async function updateService(
  serviceId: string,
  updates: Partial<Service>
): Promise<ApiResponse<any>> {
  try {
    const { error } = await supabase
      .from("TBL_SERVICE")
      .update(updates)
      .eq("service_id", serviceId);

    if (error) {
      console.error("Error updating service:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception updating service:", error);
    return { success: false, error };
  }
}

export async function addService(
  service: Omit<Service, "service_id">
): Promise<ApiResponse<Service>> {
  const { data, error } = (await supabase
    .from("TBL_SERVICE")
    .insert([service])
    .select()) as {
    data: Service[] | null;
    error: any;
  };

  if (error) {
    console.error("Error adding service:", error);
    return { success: false, error };
  }

  if (error || !data) return { success: false, error: error };
  return { success: true, data: data[0] };
}

export async function checkEmailExists(
  email: string
): Promise<ApiResponse<boolean>> {
  try {
    const { data, error, count } = await supabase
      .from("TBL_WORKER")
      .select("email", { count: "exact" })
      .eq("email", email);

    if (error) {
      console.error("Error checking email:", error);
      return { success: false, error };
    }

    return {
      success: true,
      data: count ? count > 0 : data && data.length > 0,
    };
  } catch (error) {
    console.error("Exception checking email:", error);
    return { success: false, error };
  }
}

export async function createAuditLog(params: {
  employee_id: string;
  email: string;
  action_type: string;
  details: string;
  on_page: string;
}): Promise<ApiResponse<AuditLog>> {
  const { error } = (await supabase.from("TBL_AUDIT_LOG").insert(params)) as {
    data: AuditLog | null;
    error: any;
  };

  if (error) {
    console.error("Error adding product entry:", error);
    return { success: false, error };
  }
  return { success: true };
}

export async function getAllAuditLogs(): Promise<
  ApiResponse<AuditLogWithActor[]>
> {
  try {
    const { data, error } = (await supabase
      .from("TBL_AUDIT_LOG")
      .select("*")
      .order("timestamp", { ascending: false })) as {
      data: AuditLogWithActor[] | null;
      error: any;
    };

    if (error) {
      console.error("Error fetching audit logs:", error);
      return { success: false, error };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Exception fetching audit logs:", error);
    return { success: false, error };
  }
}

/**
 * Get worker details by employee_id
 */
export async function getWorkerByEmployeeId(
  employee_id: string
): Promise<ApiResponse<Worker>> {
  try {
    const { data, error } = (await supabase
      .from("TBL_WORKER")
      .select("*")
      .eq("employee_id", employee_id)
      .single()) as {
      data: Worker | null;
      error: any;
    };

    if (error) {
      console.error("Error fetching worker:", error);
      return { success: false, error };
    }

    return { success: true, data: data as Worker };
  } catch (error) {
    console.error("Exception fetching worker:", error);
    return { success: false, error };
  }
}

export async function updateProductEntry(
  entryId: string,
  updates: Partial<ProductEntry>
): Promise<ApiResponse<any>> {
  try {
    const { error } = await supabase
      .from("TBL_PRODUCT_ENTRY")
      .update(updates)
      .eq("entry_id", entryId);

    if (error) {
      console.error("Error updating product entry:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception updating product entry:", error);
    return { success: false, error };
  }
}

export async function deleteProductItem(
  itemId: string
): Promise<ApiResponse<any>> {
  try {
    const { error: itemError } = await supabase
      .from("TBL_PRODUCT_ITEM")
      .delete()
      .eq("item_id", itemId);

    if (itemError) {
      console.error("Error deleting product item:", itemError);
      return {
        success: false,
        error: "Failed to delete product item",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception deleting product item:", error);
    return {
      success: false,
      error: "An unexpected error occurred while deleting the product",
    };
  }
}

export async function updateProductItem(
  itemId: string,
  updates: {
    item_name: string;
    category: string;
    price: number;
    weight: string;
    barcode: string;
  }
): Promise<ApiResponse<any>> {
  try {
    const { error } = await supabase
      .from("TBL_PRODUCT_ITEM")
      .update(updates)
      .eq("item_id", itemId);

    if (error) {
      console.error("Error updating product item:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception updating product item:", error);
    return { success: false, error };
  }
}
