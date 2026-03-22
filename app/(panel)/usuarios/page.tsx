import type { Metadata } from "next";
import { ConstructionPage } from "@/components/dashboard/construction-page";

export const metadata: Metadata = {
  title: "Usuarios",
};

export default function UsersPage() {
  return <ConstructionPage title="Usuarios" />;
}
