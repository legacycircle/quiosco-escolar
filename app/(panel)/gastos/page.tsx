import type { Metadata } from "next";
import { ConstructionPage } from "@/components/dashboard/construction-page";

export const metadata: Metadata = {
  title: "Gastos",
};

export default function ExpensesPage() {
  return <ConstructionPage title="Gastos" />;
}
