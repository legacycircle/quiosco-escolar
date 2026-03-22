import type { Metadata } from "next";
import { ConstructionPage } from "@/components/dashboard/construction-page";

export const metadata: Metadata = {
  title: "Proveedores",
};

export default function SuppliersPage() {
  return <ConstructionPage title="Proveedores" />;
}
