import type { Metadata } from "next";
import { ConstructionPage } from "@/components/dashboard/construction-page";
import { getApprovedUserContext } from "@/lib/supabase/approved-user";

export const metadata: Metadata = {
  title: "Gastos",
};

export default async function ExpensesPage() {
  const { userLabel } = await getApprovedUserContext();

  return <ConstructionPage title="Gastos" activeLabel="Gastos" userLabel={userLabel} />;
}
