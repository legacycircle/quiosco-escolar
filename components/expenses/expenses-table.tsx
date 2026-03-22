"use client";

import Link from "next/link";
import type { ExpenseRecord } from "@/lib/supabase/expenses";

type ExpensesTableProps = {
  items: ExpenseRecord[];
  pageSize: number;
  currentPage: number;
  totalPages: number;
  tableMissing: boolean;
  totalCount: number;
  firstItem: number;
  lastItem: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

export function ExpensesTable({
  items,
  pageSize,
  currentPage,
  totalPages,
  tableMissing,
  totalCount,
  firstItem,
  lastItem,
}: ExpensesTableProps) {
  const emptyRows = Array.from({ length: pageSize }, (_, index) => index);

  return (
    <section className="rounded-[2rem] border border-[#eadcd2] bg-white p-4 shadow-[0_18px_40px_rgba(22,36,61,0.06)] sm:p-5 lg:rounded-[1.8rem]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-[1.9rem] font-bold tracking-[-0.04em] text-[color:var(--brand-dark)]">
          Gastos
        </h2>
        <p className="text-sm text-[color:var(--brand-mid)]">
          {tableMissing
            ? "Tabla expenses pendiente en Supabase"
            : totalCount === 0
              ? "Sin gastos registrados"
              : `${firstItem}-${lastItem} de ${totalCount}`}
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-[#eadcd2] bg-[#fffdfa]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse">
            <thead>
              <tr className="bg-[#f6ede7] text-left text-[0.88rem] font-semibold text-[color:var(--brand-dark)]">
                <th className="px-4 py-1.5">Concepto</th>
                <th className="px-4 py-1.5">Tipo</th>
                <th className="px-4 py-1.5">Categoría</th>
                <th className="px-4 py-1.5 text-right">Monto</th>
                <th className="px-4 py-1.5 text-right">Fecha</th>
                <th className="px-4 py-1.5">Notas</th>
              </tr>
            </thead>
            <tbody>
              {emptyRows.map((rowIndex) => {
                const expense = items[rowIndex];

                if (expense) {
                  return (
                    <tr
                      key={expense.id}
                      className="border-t border-[#f1e4db] bg-white text-[0.92rem] text-[color:var(--brand-dark)]"
                    >
                      <td className="px-4 py-1.5 font-semibold">{expense.concepto}</td>
                      <td className="px-4 py-1.5 capitalize">{expense.tipo}</td>
                      <td className="px-4 py-1.5">{expense.categoria}</td>
                      <td className="px-4 py-1.5 text-right font-semibold">
                        {formatCurrency(expense.monto_total)}
                      </td>
                      <td className="px-4 py-1.5 text-right">{formatShortDate(expense.fecha_gasto)}</td>
                      <td className="px-4 py-1.5 text-[color:var(--brand-mid)]">
                        {expense.notas?.trim() ? expense.notas : "-"}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={`empty-${rowIndex}`}
                    className="border-t border-[#f1e4db] bg-white text-[0.92rem] text-[color:var(--brand-mid)]"
                  >
                    <td className="px-4 py-1.5">
                      {rowIndex === 0 && items.length === 0
                        ? tableMissing
                          ? "Tabla pendiente"
                          : "Sin gastos"
                        : ""}
                    </td>
                    <td className="px-4 py-1.5">&nbsp;</td>
                    <td className="px-4 py-1.5">&nbsp;</td>
                    <td className="px-4 py-1.5 text-right">&nbsp;</td>
                    <td className="px-4 py-1.5 text-right">&nbsp;</td>
                    <td className="px-4 py-1.5">&nbsp;</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[color:var(--brand-mid)]">
          Página {currentPage} de {totalPages}
        </p>

        <div className="flex items-center gap-2.5">
          <Link
            href={currentPage > 1 ? `/gastos?page=${currentPage - 1}` : "/gastos?page=1"}
            aria-disabled={currentPage <= 1}
            className={[
              "inline-flex min-h-11 min-w-[7.6rem] items-center justify-center rounded-full border px-5 text-sm font-semibold transition",
              currentPage <= 1
                ? "pointer-events-none border-[#eadcd2] bg-transparent text-[color:var(--brand-dark)] visited:text-[color:var(--brand-dark)]"
                : "border-[#eadcd2] bg-transparent text-[color:var(--brand-dark)] visited:text-[color:var(--brand-dark)] hover:border-[color:var(--brand-mid)]",
            ].join(" ")}
          >
            <span className="font-semibold text-inherit">Anterior</span>
          </Link>
          <Link
            href={currentPage < totalPages ? `/gastos?page=${currentPage + 1}` : `/gastos?page=${totalPages}`}
            aria-disabled={currentPage >= totalPages}
            className={[
              "inline-flex min-h-11 min-w-[8.4rem] items-center justify-center rounded-full border px-5 text-sm font-semibold transition",
              currentPage >= totalPages
                ? "pointer-events-none border-[#eadcd2] bg-transparent text-[color:var(--brand-dark)] visited:text-[color:var(--brand-dark)]"
                : "border-[color:var(--brand-dark)] bg-[color:var(--brand-dark)] !text-white visited:!text-white hover:!text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:opacity-92",
            ].join(" ")}
          >
            <span className="font-semibold text-inherit">Siguiente</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
