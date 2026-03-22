import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExpenseActions } from "@/components/expenses/expense-actions";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { getExpensesOverview, getExpensesPage } from "@/lib/supabase/expenses";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Gastos",
};

type ExpensesPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

const pageSize = 8;

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

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
    <article className="rounded-[1.6rem] border border-[#eadcd2] bg-white px-5 py-3.5 shadow-[0_16px_36px_rgba(22,36,61,0.06)]">
      <p className="text-[0.96rem] text-[color:var(--brand-mid)]">{label}</p>
      <p className="mt-1.5 font-heading text-[2.05rem] font-bold leading-none tracking-[-0.05em] text-[color:var(--brand-dark)]">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-sm text-[color:var(--brand-mid)]">{detail}</p>
      ) : (
        <div className="mt-2 h-[1rem]" />
      )}
    </article>
  );
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const { page } = await searchParams;
  const currentPage = parsePage(page);
  const supabase = await createSupabaseServerClient();
  const [
    { items, totalCount, tableMissing },
    { totalAmount, currentMonthAmount, operationalAmount, productionAmount, totalRecords },
  ] = await Promise.all([
    getExpensesPage(supabase, currentPage, pageSize),
    getExpensesOverview(supabase),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (!tableMissing && totalCount > 0 && currentPage > totalPages) {
    redirect(`/gastos?page=${totalPages}`);
  }

  const firstItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = totalCount === 0 ? 0 : firstItem + items.length - 1;

  return (
    <>
      <section className="space-y-4 lg:space-y-5">
        <div className="space-y-3 lg:flex lg:items-start lg:justify-between lg:gap-6">
          <div>
            <h1 className="font-heading text-[2.1rem] font-bold tracking-[-0.05em] text-[color:var(--brand-dark)] sm:text-[2.7rem] lg:text-[2.95rem]">
              Gastos
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[color:var(--brand-mid)] sm:text-base">
              Control visible de gastos operativos, insumos y costos de producción del quiosco.
            </p>
          </div>

          <div className="lg:min-w-[420px] lg:max-w-[520px] lg:flex-1">
            <ExpenseActions />
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Total gastado"
            value={tableMissing ? "S/ 0.00" : formatCurrency(totalAmount)}
          />
          <MetricCard
            label="Este mes"
            value={tableMissing ? "S/ 0.00" : formatCurrency(currentMonthAmount)}
          />
          <MetricCard
            label="Operativos"
            value={tableMissing ? "S/ 0.00" : formatCurrency(operationalAmount)}
          />
          <MetricCard
            label="Insumos y producción"
            value={tableMissing ? "S/ 0.00" : formatCurrency(productionAmount)}
          />
          <MetricCard
            label="Registros"
            value={String(totalRecords)}
            detail={tableMissing ? "Tabla pendiente" : `Items visibles: ${totalCount}`}
          />
        </section>
      </section>

      <ExpensesTable
        items={items}
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        tableMissing={tableMissing}
        totalCount={totalCount}
        firstItem={firstItem}
        lastItem={lastItem}
      />
    </>
  );
}
