import type {
  PostgrestSingleResponse,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AppRole = "owner" | "admin";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function getCurrentUserProfile(
  supabase: SupabaseClient,
  userId: string
) {
  const response = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, is_approved, approved_at, approved_by, created_at, updated_at"
    )
    .eq("id", userId)
    .maybeSingle();

  return response as PostgrestSingleResponse<UserProfile | null>;
}

export async function syncProfileFromUser(user: User) {
  const adminClient = createSupabaseAdminClient();

  return adminClient.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name:
        typeof user.user_metadata.full_name === "string"
          ? user.user_metadata.full_name
          : null,
    },
    {
      onConflict: "id",
      ignoreDuplicates: false,
    }
  );
}

export function isProfilesTableMissing(error: { code?: string } | null) {
  return error?.code === "42P01";
}
