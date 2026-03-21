import type { Metadata } from "next";
import { ConstructionPage } from "@/components/dashboard/construction-page";
import { getApprovedUserContext } from "@/lib/supabase/approved-user";

export const metadata: Metadata = {
  title: "Cuentas",
};

export default async function AccountsPage() {
  const { userLabel } = await getApprovedUserContext();

  return <ConstructionPage title="Cuentas" activeLabel="Cuentas" userLabel={userLabel} />;
}
