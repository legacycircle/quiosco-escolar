import { redirect } from "next/navigation";
import {
  getCurrentUserProfile,
  isProfilesTableMissing,
} from "@/lib/supabase/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildUserLabel(fullName: string | null, email: string | undefined) {
  if (fullName?.trim()) {
    return fullName.trim();
  }

  if (email) {
    return email.split("@")[0] ?? "Usuario";
  }

  return "Usuario";
}

export async function getApprovedUserContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile, error } = await getCurrentUserProfile(supabase, user.id);
  const needsSetup = isProfilesTableMissing(error);
  const isApproved = Boolean(profile?.is_approved);

  if (needsSetup || !isApproved) {
    redirect("/wait");
  }

  return {
    user,
    profile,
    userLabel: buildUserLabel(profile?.full_name ?? null, user.email),
  };
}
