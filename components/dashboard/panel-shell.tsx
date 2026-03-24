"use client";

import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

const labelByPrefix = [
  { prefix: "/dashboard", label: "Dashboard" },
  { prefix: "/gastos", label: "Gastos" },
  { prefix: "/ingresos", label: "Ingresos" },
  { prefix: "/alimentos", label: "Alimentos" },
  { prefix: "/productos", label: "Productos" },
  { prefix: "/proveedores", label: "Proveedores" },
  { prefix: "/cuentas", label: "Cuentas" },
  { prefix: "/usuarios", label: "Usuarios" },
] as const;

type PanelShellProps = {
  children: React.ReactNode;
  userLabel: string;
  roleLabel: string;
};

function getActiveLabel(pathname: string) {
  const match = labelByPrefix.find((item) => pathname.startsWith(item.prefix));
  return match?.label ?? "";
}

export function PanelShell({ children, userLabel, roleLabel }: PanelShellProps) {
  const pathname = usePathname();
  const activeLabel = getActiveLabel(pathname);

  return (
    <main className="min-h-screen bg-[#f8f5f2] text-[color:var(--brand-dark)] lg:flex">
      <DashboardSidebar userLabel={userLabel} roleLabel={roleLabel} activeLabel={activeLabel} />

      <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-[1600px] space-y-6 lg:space-y-7">
          <div className="lg:hidden">
            <DashboardTopbar userLabel={userLabel} activeLabel={activeLabel} />
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}
