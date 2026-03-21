import type { Metadata } from "next";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { getApprovedUserContext } from "@/lib/supabase/approved-user";

export const metadata: Metadata = {
  title: "Dashboard",
};

const summaryCards = [
  {
    eyebrow: "Resumen general",
    value: "Profit",
    meta: "S/ 1,350 neto",
  },
  {
    eyebrow: "Inversión",
    value: "S/ 1,080",
    meta: "Gastos totales",
  },
  {
    eyebrow: "Revenue",
    value: "S/ 2,430",
    meta: "Ventas totales",
  },
  {
    eyebrow: "ROI",
    value: "125%",
    meta: "Retorno sobre inversión",
  },
];

export default async function DashboardPage() {
  const { userLabel } = await getApprovedUserContext();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdfc_0%,#f7f7fa_100%)] px-4 py-4 text-[color:var(--brand-dark)] sm:px-6 sm:py-5 lg:px-8 lg:py-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <DashboardTopbar userLabel={userLabel} activeLabel="Dashboard" />

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.9rem] border border-[#eadcd2] bg-white p-5 shadow-[0_22px_55px_rgba(22,36,61,0.06)] sm:p-6">
            <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-mid)]">
              Resumen general
            </p>
            <h1 className="mt-3 font-heading text-[2.6rem] font-bold leading-[0.95] tracking-[-0.05em] text-[color:var(--brand-dark)] sm:text-[3.6rem]">
              Dashboard
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#f8f1eb] px-3 py-1 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-mid)]">
                Moneda: Soles
              </span>
              <span className="rounded-full bg-[#eef7f1] px-3 py-1 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Profit positivo
              </span>
            </div>
          </div>

          <div className="rounded-[1.9rem] border border-[#eadcd2] bg-[linear-gradient(180deg,#16243d_0%,#24395f_100%)] p-5 text-white shadow-[0_24px_60px_rgba(22,36,61,0.18)] sm:p-6">
            <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-white/65">
              Resultado
            </p>
            <p className="mt-4 font-heading text-[2.4rem] font-bold tracking-[-0.05em] sm:text-[3rem]">
              S/ 1,350
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/12 px-3 py-1 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-white/92">
                Profit
              </span>
              <span className="rounded-full bg-white/12 px-3 py-1 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-white/92">
                ROI 125%
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article
              key={card.eyebrow}
              className="rounded-[1.4rem] border border-[#eadcd2] bg-white p-4 shadow-[0_14px_35px_rgba(22,36,61,0.05)] sm:rounded-[1.7rem] sm:p-5"
            >
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-mid)] sm:text-[0.8rem] sm:tracking-[0.18em]">
                {card.eyebrow}
              </p>
              <p className="mt-2.5 font-heading text-[1.55rem] font-semibold leading-none tracking-[-0.05em] text-[color:var(--brand-dark)] sm:mt-3 sm:text-[2.2rem]">
                {card.value}
              </p>
              <p className="mt-1.5 text-[0.82rem] font-semibold text-[color:var(--brand-mid)] sm:mt-2 sm:text-sm">
                {card.meta}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
