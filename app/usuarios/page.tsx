import type { Metadata } from "next";
import { ConstructionPage } from "@/components/dashboard/construction-page";
import { getApprovedUserContext } from "@/lib/supabase/approved-user";

export const metadata: Metadata = {
  title: "Usuarios",
};

export default async function UsersPage() {
  const { userLabel } = await getApprovedUserContext();

  return <ConstructionPage title="Usuarios" activeLabel="Usuarios" userLabel={userLabel} />;
}
