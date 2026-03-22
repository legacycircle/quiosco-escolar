import type { Metadata } from "next";
import { ConstructionPage } from "@/components/dashboard/construction-page";

export const metadata: Metadata = {
  title: "Cuentas",
};

export default function AccountsPage() {
  return <ConstructionPage title="Cuentas" />;
}
