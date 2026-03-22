import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

const summaryCards = [
  {
    label: "Resumen general",
    value: "Profit",
    detail: "S/ 1,350 neto",
  },
  {
    label: "Inversión",
    value: "S/ 1,080",
    detail: "Gastos totales",
  },
  {
    label: "Revenue",
    value: "S/ 2,430",
    detail: "Ventas totales",
  },
  {
    label: "ROI",
    value: "125%",
    detail: "Retorno sobre inversión",
  },
  {
    label: "Productos activos",
    value: "148",
    detail: "Inventario visible",
  },
];

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="rounded-[1.6rem] border border-[#eadcd2] bg-white px-5 py-4 shadow-[0_16px_36px_rgba(22,36,61,0.06)]">
      <p className="text-[0.98rem] text-[color:var(--brand-mid)]">{label}</p>
      <p className="mt-2 font-heading text-[2.1rem] font-bold leading-none tracking-[-0.05em] text-[color:var(--brand-dark)]">
        {value}
      </p>
      {detail ? (
        <p className="mt-3 text-sm text-[color:var(--brand-mid)]">{detail}</p>
      ) : (
        <div className="mt-3 h-[1.25rem]" />
      )}
    </article>
  );
}

export default function DashboardPage() {
  return (
    <>
      <section className="space-y-5 lg:space-y-6">
        <div>
          <h1 className="font-heading text-[2.15rem] font-bold tracking-[-0.05em] text-[color:var(--brand-dark)] sm:text-[2.8rem] lg:text-[3.05rem]">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--brand-mid)] sm:text-base">
            Vista general del control financiero y operativo del quiosco.
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              detail={card.detail}
            />
          ))}
        </section>
      </section>

      <section className="rounded-[2rem] border border-[#eadcd2] bg-white p-5 shadow-[0_18px_40px_rgba(22,36,61,0.06)] sm:p-6 lg:rounded-[1.8rem]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-[2rem] font-bold tracking-[-0.04em] text-[color:var(--brand-dark)]">
            Resumen general
          </h2>
          <p className="text-sm text-[color:var(--brand-mid)]">Moneda: Soles</p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <article className="rounded-[1.35rem] border border-[#efe3da] bg-[#fcfaf8] p-5">
            <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-mid)]">
              Resultado actual
            </p>
            <p className="mt-3 font-heading text-[2.4rem] font-bold tracking-[-0.05em] text-[color:var(--brand-dark)]">
              S/ 1,350
            </p>
            <p className="mt-2 text-sm text-[color:var(--brand-mid)]">Profit positivo del periodo.</p>
          </article>

          <article className="rounded-[1.35rem] border border-[#efe3da] bg-[#fcfaf8] p-5">
            <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-mid)]">
              Ventas del día
            </p>
            <p className="mt-3 font-heading text-[2.4rem] font-bold tracking-[-0.05em] text-[color:var(--brand-dark)]">
              S/ 780
            </p>
            <p className="mt-2 text-sm text-[color:var(--brand-mid)]">Movimientos registrados hoy.</p>
          </article>

          <article className="rounded-[1.35rem] border border-[#efe3da] bg-[#fcfaf8] p-5">
            <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-mid)]">
              Estado del negocio
            </p>
            <p className="mt-3 font-heading text-[2.4rem] font-bold tracking-[-0.05em] text-[color:var(--brand-dark)]">
              Estable
            </p>
            <p className="mt-2 text-sm text-[color:var(--brand-mid)]">Buen margen y flujo controlado.</p>
          </article>
        </div>
      </section>
    </>
  );
}
