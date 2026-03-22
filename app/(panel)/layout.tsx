import { PanelShell } from "@/components/dashboard/panel-shell";
import { getApprovedUserContext } from "@/lib/supabase/approved-user";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { userLabel, profile } = await getApprovedUserContext();
  const roleLabel = profile?.role === "owner" ? "Owner" : "Admin";

  return <PanelShell userLabel={userLabel} roleLabel={roleLabel}>{children}</PanelShell>;
}
