import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductActions } from "@/components/products/product-actions";
import { ProductsTable } from "@/components/products/products-table";
import {
  getAllProductOptions,
  getProductSalesInsights,
  getProductsOverview,
  getProductsPage,
} from "@/lib/supabase/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Productos",
};

type ProductsPageProps = {
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

function formatCurrency(value: number | null) {
  if (value == null) {
    return "-";
  }

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercentage(value: number) {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { page } = await searchParams;
  const currentPage = parsePage(page);
  const supabase = await createSupabaseServerClient();
  const [
    { items, totalCount, tableMissing },
    { stockTotal, activeProducts, investmentTotal, estimatedMargin },
    { items: productOptions },
    { byProduct: salesByProduct, soldInvestmentTotal, tableMissing: salesTableMissing },
  ] = await Promise.all([
    getProductsPage(supabase, currentPage, pageSize),
    getProductsOverview(supabase),
    getAllProductOptions(supabase),
    getProductSalesInsights(supabase),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (!tableMissing && totalCount > 0 && currentPage > totalPages) {
    redirect(`/productos?page=${totalPages}`);
  }

  const firstItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = totalCount === 0 ? 0 : firstItem + items.length - 1;
  const soldInvestmentBase = investmentTotal + soldInvestmentTotal;
  const soldInvestmentPercentage =
    soldInvestmentBase > 0 ? (soldInvestmentTotal / soldInvestmentBase) * 100 : 0;

  return (
    <>
      <section className="space-y-4 lg:space-y-5">
        <div className="space-y-3 lg:flex lg:items-start lg:justify-between lg:gap-6">
          <div>
            <h1 className="font-heading text-[2.1rem] font-bold tracking-[-0.05em] text-[color:var(--brand-dark)] sm:text-[2.7rem] lg:text-[2.95rem]">
              Productos
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[color:var(--brand-mid)] sm:text-base">
              Catálogo, stock y control visible de productos del quiosco.
            </p>
          </div>

          <div className="lg:min-w-[420px] lg:max-w-[520px] lg:flex-1">
            <ProductActions productOptions={productOptions} />
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Stock total" value={String(stockTotal)} />
          <MetricCard label="Productos activos" value={String(activeProducts)} />
          <MetricCard
            label="Inversión total"
            value={tableMissing ? "S/ 0.00" : formatCurrency(investmentTotal)}
          />
          <MetricCard
            label="% vendido"
            value={`${formatPercentage(soldInvestmentPercentage)}%`}
            detail={salesTableMissing ? "Sin ventas registradas" : undefined}
          />
          <MetricCard
            label="Margen estimado"
            value={tableMissing ? "S/ 0.00" : formatCurrency(estimatedMargin)}
            detail={tableMissing ? "Tabla pendiente" : `Items visibles: ${totalCount}`}
          />
        </section>
      </section>

      <ProductsTable
        items={items}
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        tableMissing={tableMissing}
        totalCount={totalCount}
        firstItem={firstItem}
        lastItem={lastItem}
        salesByProduct={salesByProduct}
      />
    </>
  );
}
