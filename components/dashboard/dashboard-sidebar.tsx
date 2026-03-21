import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

type DashboardSidebarProps = {
  userLabel: string;
  roleLabel: string;
};

type IconName =
  | "dashboard"
  | "gastos"
  | "ingresos"
  | "productos"
  | "proveedores"
  | "bancos"
  | "usuarios";

type MenuItem = {
  label: string;
  icon: IconName;
  active?: boolean;
};

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: "dashboard", active: true },
  { label: "Gastos", icon: "gastos" },
  { label: "Ingresos", icon: "ingresos" },
  { label: "Productos", icon: "productos" },
  { label: "Proveedores", icon: "proveedores" },
  { label: "Cuentas bancarias", icon: "bancos" },
  { label: "Usuarios", icon: "usuarios" },
];

function SidebarIcon({ name }: { name: IconName }) {
  const commonProps = {
    className: "h-[1.05rem] w-[1.05rem] shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    viewBox: "0 0 24 24",
  } as const;

  switch (name) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <path d="M4 4h7v7H4z" />
          <path d="M13 4h7v4h-7z" />
          <path d="M13 10h7v10h-7z" />
          <path d="M4 13h7v7H4z" />
        </svg>
      );
    case "gastos":
      return (
        <svg {...commonProps}>
          <path d="M7 3v3" />
          <path d="M17 3v3" />
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 9h16" />
        </svg>
      );
    case "ingresos":
      return (
        <svg {...commonProps}>
          <path d="M4 18h16" />
          <path d="m6 15 4-4 3 3 5-6" />
        </svg>
      );
    case "productos":
      return (
        <svg {...commonProps}>
          <path d="m12 3 8 4.5-8 4.5L4 7.5 12 3Z" />
          <path d="M4 7.5V16.5L12 21l8-4.5V7.5" />
        </svg>
      );
    case "proveedores":
      return (
        <svg {...commonProps}>
          <path d="M5 10.5 12 4l7 6.5V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8.5Z" />
          <path d="M9 20v-5h6v5" />
        </svg>
      );
    case "bancos":
      return (
        <svg {...commonProps}>
          <path d="m3 10 9-6 9 6" />
          <path d="M5 10v8" />
          <path d="M10 10v8" />
          <path d="M14 10v8" />
          <path d="M19 10v8" />
          <path d="M3 20h18" />
        </svg>
      );
    case "usuarios":
      return (
        <svg {...commonProps}>
          <path d="M16 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
          <circle cx="10" cy="8" r="3" />
          <path d="M20 21v-1a4 4 0 0 0-3-3.87" />
          <path d="M16 5.13A3 3 0 0 1 16 11" />
        </svg>
      );
  }
}

export function DashboardSidebar({ userLabel, roleLabel }: DashboardSidebarProps) {
  const initial = userLabel.charAt(0).toUpperCase() || "Q";

  return (
    <aside className="border-b border-[color:var(--line)] bg-white lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-6 p-4 sm:p-5 lg:p-6">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="font-logo text-[2.7rem] leading-none tracking-[0.08em] text-[color:var(--brand-dark)]">
              QUIOSCO
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-mid)]">
              Principal
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {menuItems.map((item) => {
              const itemClassName = item.active
                ? "border-transparent bg-[#f2e5dc] text-[color:var(--brand-dark)] shadow-[0_8px_20px_rgba(22,36,61,0.05)]"
                : "border-transparent bg-transparent text-[color:var(--brand-mid)] hover:bg-[#faf6f2]";

              const content = (
                <span
                  className={[
                    "flex min-h-12 items-center gap-3 rounded-2xl border px-3.5 py-3 text-[0.98rem] font-semibold transition",
                    itemClassName,
                  ].join(" ")}
                >
                  <SidebarIcon name={item.icon} />
                  <span>{item.label}</span>
                </span>
              );

              return item.active ? (
                <Link key={item.label} href="/dashboard">
                  {content}
                </Link>
              ) : (
                <div key={item.label}>{content}</div>
              );
            })}
          </nav>
        </div>

        <div className="mt-1 border-t border-[color:var(--line)] pt-5 lg:mt-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-mid)]">
            Cuenta
          </p>
          <div className="mt-3 space-y-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[#fcf8f5] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edd8cc] text-sm font-bold text-[color:var(--brand-dark)]">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[color:var(--brand-dark)]">
                  {userLabel}
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-mid)]">
                  {roleLabel}
                </p>
              </div>
            </div>
            <SignOutButton fullWidth />
          </div>
        </div>
      </div>
    </aside>
  );
}
