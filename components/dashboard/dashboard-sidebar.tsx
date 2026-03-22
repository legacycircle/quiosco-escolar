import Link from "next/link";

type DashboardSidebarProps = {
  userLabel: string;
  roleLabel: string;
  activeLabel: string;
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
  href: string;
  icon: IconName;
};

const menuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Gastos", href: "/gastos", icon: "gastos" },
  { label: "Ingresos", href: "/ingresos", icon: "ingresos" },
  { label: "Productos", href: "/productos", icon: "productos" },
  { label: "Proveedores", href: "/proveedores", icon: "proveedores" },
  { label: "Cuentas", href: "/cuentas", icon: "bancos" },
  { label: "Usuarios", href: "/usuarios", icon: "usuarios" },
];

function SidebarIcon({ name }: { name: IconName }) {
  const commonProps = {
    className: "h-[1.02rem] w-[1.02rem] shrink-0",
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

function AccountArrow() {
  return (
    <svg
      className="h-[1.02rem] w-[1.02rem] shrink-0 text-[color:var(--brand-mid)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function DashboardSidebar({ userLabel, roleLabel, activeLabel }: DashboardSidebarProps) {
  const initial = userLabel.charAt(0).toUpperCase() || "Q";

  return (
    <aside className="hidden w-[228px] shrink-0 border-r border-[#eadcd2] bg-white lg:flex lg:min-h-screen">
      <div className="flex h-screen w-full flex-col px-3 py-6">
        <div className="px-5 pt-0.5">
          <Link href="/dashboard" className="block">
            <div className="font-heading text-[1.55rem] font-semibold leading-none tracking-[0.14em] text-[color:var(--brand-dark)]">
              QUIOSCO
            </div>
          </Link>
          <p className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-mid)]">
            Principal
          </p>
        </div>

        <nav className="mt-3 space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = item.label === activeLabel;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[1rem] font-medium transition",
                  isActive
                    ? "bg-[#f1e4db] text-[color:var(--brand-dark)]"
                    : "text-[color:var(--brand-dark)] hover:bg-[#faf6f2]",
                ].join(" ")}
              >
                <SidebarIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[#eadcd2] px-4 pt-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-mid)]">
            Cuenta
          </p>

          <Link
            href="/mi-cuenta"
            className="mt-3 flex items-center justify-between gap-3 rounded-[1.1rem] border border-[#eadcd2] bg-[#fcf8f5] px-3 py-3 transition hover:border-[#dbc8bb]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edd8cc] text-sm font-bold text-[color:var(--brand-dark)]">
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

            <AccountArrow />
          </Link>
        </div>
      </div>
    </aside>
  );
}
