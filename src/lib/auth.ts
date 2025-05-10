import { ApiResponse } from "../types/api";
import { supabase } from "./supabase";

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { success: false, message: error.message };
  return { success: true, user: data.user };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true };
}

// Update user's password
export async function updatePassword(
  newPassword: string
): Promise<ApiResponse<any>> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Error updating password:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception updating password:", error);
    return { success: false, error };
  }
}

// Update worker status
export async function updateWorkerStatus(
  employeeId: string,
  status: string
): Promise<ApiResponse<any>> {
  try {
    const { error } = await supabase
      .from("TBL_WORKER")
      .update({ status })
      .eq("employee_id", employeeId);

    if (error) {
      console.error("Error updating worker status:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception updating worker status:", error);
    return { success: false, error };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return { success: false, message: error.message };
    }

    // Always return success even if the email doesn't exist (for security reasons)
    return { success: true };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
