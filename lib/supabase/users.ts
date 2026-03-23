import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/supabase/profiles";

export type ManagedUserRecord = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  is_approved: boolean;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getAllManagedUsers() {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, email, full_name, role, is_approved, approved_at, created_at, updated_at")
    .order("role", { ascending: true })
    .order("full_name", { ascending: true })
    .order("email", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ManagedUserRecord[];
}

export async function getManagedUserById(userId: string) {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, email, full_name, role, is_approved, approved_at, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ManagedUserRecord | null;
}

export async function deleteManagedUser(userId: string) {
  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    throw error;
  }
}
