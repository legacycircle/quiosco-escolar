import type { Metadata } from "next";
import { ConstructionPage } from "@/components/dashboard/construction-page";

export const metadata: Metadata = {
  title: "Ingresos",
};

export default function RevenuePage() {
  return <ConstructionPage title="Ingresos" />;
}
