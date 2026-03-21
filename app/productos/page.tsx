import type { Metadata } from "next";
import { ConstructionPage } from "@/components/dashboard/construction-page";
import { getApprovedUserContext } from "@/lib/supabase/approved-user";

export const metadata: Metadata = {
  title: "Productos",
};

export default async function ProductsPage() {
  const { userLabel } = await getApprovedUserContext();

  return <ConstructionPage title="Productos" activeLabel="Productos" userLabel={userLabel} />;
}
