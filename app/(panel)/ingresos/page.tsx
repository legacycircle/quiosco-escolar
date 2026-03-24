import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RevenueActions } from "@/components/income/revenue-actions";
import { IncomeTable } from "@/components/income/income-table";
import { getIncomeOverview, getIncomePage } from "@/lib/supabase/income";
import { getPreparedFoodOptions } from "@/lib/supabase/prepared-foods";
import { getAllProductOptions } from "@/lib/supabase/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ingresos",
};

type RevenuePageProps = {
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

export default async function RevenuePage({ searchParams }: RevenuePageProps) {
  const { page } = await searchParams;
  const currentPage = parsePage(page);
  const supabase = await createSupabaseServerClient();
  const [
    { items, totalCount, tableMissing },
    { totalSales, currentMonthSales, itemsSold, lineCount },
    { items: productOptions, tableMissing: productsTableMissing },
    { items: foodOptions, tableMissing: foodsTableMissing },
  ] = await Promise.all([
    getIncomePage(supabase, currentPage, pageSize),
    getIncomeOverview(supabase),
    getAllProductOptions(supabase),
    getPreparedFoodOptions(supabase),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (!tableMissing && totalCount > 0 && currentPage > totalPages) {
    redirect(`/ingresos?page=${totalPages}`);
  }

  const activeProducts = productOptions.filter((item) => item.is_active);
  const availableCatalog = activeProducts.length + foodOptions.length;
  const firstItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = totalCount === 0 ? 0 : firstItem + items.length - 1;

  return (
    <>
      <section className="space-y-4 lg:space-y-5">
        <div className="space-y-3 lg:flex lg:items-start lg:justify-between lg:gap-6">
          <div>
            <h1 className="font-heading text-[2.1rem] font-bold tracking-[-0.05em] text-[color:var(--brand-dark)] sm:text-[2.7rem] lg:text-[2.95rem]">
              Ingresos
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[color:var(--brand-mid)] sm:text-base">
              Registra ventas de productos o alimentos con busqueda rapida, unidades y calculo automatico del total.
            </p>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Total vendido"
            value={tableMissing ? "S/ 0.00" : formatCurrency(totalSales)}
          />
          <MetricCard
            label="Este mes"
            value={tableMissing ? "S/ 0.00" : formatCurrency(currentMonthSales)}
          />
          <MetricCard
            label="Items vendidos"
            value={String(itemsSold)}
            detail={tableMissing ? "Tablas pendientes" : undefined}
          />
          <MetricCard
            label="Ventas registradas"
            value={String(lineCount)}
            detail={tableMissing ? "Sin historial todavia" : `Pagina actual: ${currentPage}`}
          />
          <MetricCard
            label="Catalogo disponible"
            value={String(availableCatalog)}
            detail={
              productsTableMissing && foodsTableMissing
                ? "Tablas products y prepared_foods pendientes"
                : productsTableMissing
                  ? "Solo alimentos disponibles"
                  : foodsTableMissing
                    ? "Solo productos disponibles"
                    : "Productos y alimentos listos para sugerencias"
            }
          />
        </section>
      </section>

      <RevenueActions
        productOptions={productOptions}
        foodOptions={foodOptions}
        productsTableMissing={productsTableMissing}
        foodsTableMissing={foodsTableMissing}
      />

      <IncomeTable
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
