import { createClient } from "@supabase/supabase-js";
import { Worker, WorkerRole } from "../types/interface";

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

export async function getCurrentWorker() {
  const session = await supabase.auth.getSession();
  const userId = session.data?.session?.user?.id;
  if (!userId) return { success: false };

  const { data, error } = (await supabase
    .from("TBL_WORKER")
    .select("employee_id, first_name, middle_name, last_name")
    .eq("auth_id", userId)
    .single()) as { data: Worker | null; error: any };

  if (error || !data) return { success: false, error: error };
  if (data) {
    // Get current login worker all roles
    const role_data = await getAllWorkerRoles(data.employee_id);
    if (role_data.roles) {
      return { success: true, worker: data, worker_roles: role_data.roles };
    } else {
      return { success: false, error: role_data.error };
    }
  }
}

export async function getAllWorkerRoles(employee_id: string) {
  const { data, error } = (await supabase
    .from("TBL_WORKER_ROLE")
    .select("TBL_ROLE (id, role_name)")
    .eq("employee_id", employee_id)) as { data: WorkerRole | null; error: any };

  if (error || !data) return { success: false, error: error };
  return { success: true, roles: data };
}

export async function getAllServices() {
  const { data, error } = await supabase.from("TBL_SERVICE").select("*");

  if (error || !data) return { success: false, error: error };
  return { success: true, services: data };
}

export async function getAllLaundryType() {
  const { data, error } = await supabase.from("TBL_LAUNDRY_TYPE").select("*");

  if (error || !data) return { success: false, error: error };
  return { success: true, services: data };
}

export async function getAllProducts() {
  const { data, error } = await supabase.from("TBL_PRODUCT_ENTRY").select(`
      entry_id,
      added_at,
      expiration_date,
      purchased_date,
      TBL_PRODUCT_ITEM (
        item_name,
        price,
        barcode,
        category,
        weight
      )
    `);

  if (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
  return data;
}
