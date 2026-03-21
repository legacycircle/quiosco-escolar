import type { Metadata } from "next";
import { ConstructionPage } from "@/components/dashboard/construction-page";
import { getApprovedUserContext } from "@/lib/supabase/approved-user";

export const metadata: Metadata = {
  title: "Proveedores",
};

export default async function SuppliersPage() {
  const { userLabel } = await getApprovedUserContext();

  return <ConstructionPage title="Proveedores" activeLabel="Proveedores" userLabel={userLabel} />;
}
