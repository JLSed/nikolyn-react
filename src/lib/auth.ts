import { ApiResponse } from "../types/api";
import { supabase } from "./supabase";

export async function login(
  email: string,
  password: string
): Promise<ApiResponse<any>> {
  try {
    // attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { success: false, error: error.message };

    // check if the user's worker account is deactivated
    const { data: workerData, error: workerError } = await supabase
      .from("TBL_WORKER")
      .select("status, email, employee_id")
      .eq("auth_id", data.user?.id)
      .single();

    if (workerError) {
      return { success: false, error: "Error fetching worker status" };
    }

    // if account is deactivated, sign out and return error
    if (workerData.status === "DEACTIVATED") {
      await supabase.auth.signOut();
      return {
        success: false,
        error:
          "Your account has been deactivated. Please contact an administrator.",
      };
    }

    return { success: true, data: workerData };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true };
}

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

    return { success: true };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function sendPasswordReset(
  email: string
): Promise<ApiResponse<any>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error("Error sending password reset:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception sending password reset:", error);
    return { success: false, error };
  }
}
