import type { Metadata } from "next";
import { ConstructionPage } from "@/components/dashboard/construction-page";
import { getApprovedUserContext } from "@/lib/supabase/approved-user";

export const metadata: Metadata = {
  title: "Ingresos",
};

export default async function RevenuePage() {
  const { userLabel } = await getApprovedUserContext();

  return <ConstructionPage title="Ingresos" activeLabel="Ingresos" userLabel={userLabel} />;
}
