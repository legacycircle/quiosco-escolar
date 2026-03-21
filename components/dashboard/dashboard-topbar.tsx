import Link from "next/link";

type DashboardTopbarProps = {
  userLabel: string;
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
  active?: boolean;
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

function MenuIcon({ name }: { name: IconName }) {
  const commonProps = {
    className: "h-[1rem] w-[1rem] shrink-0",
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

function MenuChip({ label, active, href, icon }: MenuItem) {
  const classes = active
    ? "border-[color:var(--brand-dark)] bg-[color:var(--brand-dark)] text-white"
    : "border-[#e8ddd5] bg-white text-[color:var(--brand-dark)]";

  return (
    <Link href={href}>
      <span
        className={[
          "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
          classes,
        ].join(" ")}
      >
        <MenuIcon name={icon} />
        <span>{label}</span>
      </span>
    </Link>
  );
}

export function DashboardTopbar({ userLabel, activeLabel }: DashboardTopbarProps) {
  const resolvedMenuItems = menuItems.map((item) => ({
    ...item,
    active: item.label === activeLabel,
  }));
  const initial = userLabel.trim().charAt(0).toUpperCase() || "Q";

  return (
    <div className="space-y-3 sm:space-y-4">
      <header className="sticky top-0 z-20 -mx-4 border-b border-[#ece4dd] bg-white/96 px-4 py-3 shadow-[0_10px_18px_rgba(22,36,61,0.14)] backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-heading text-[1.24rem] font-bold tracking-[0.14em] text-[color:var(--brand-dark)] sm:text-[1.42rem]">
              QUIOSCO
            </p>
            <p className="mt-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-[color:var(--brand-mid)] sm:text-[0.68rem]">
              Gestión escolar
            </p>
          </div>

          <Link
            href="/mi-cuenta"
            aria-label={`Ir a mi cuenta de ${userLabel}`}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e7ddd6] bg-[#fcf7f3] text-sm font-bold text-[color:var(--brand-dark)] shadow-[0_4px_14px_rgba(22,36,61,0.06)] transition hover:border-[color:var(--brand-mid)]"
          >
            {initial}
          </Link>
        </div>
      </header>

      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2 pr-4 sm:gap-3">
          {resolvedMenuItems.map((item) => (
            <MenuChip key={item.label} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
