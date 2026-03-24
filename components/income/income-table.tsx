import type { IncomeLineRecord } from "@/lib/supabase/income";

type IncomeTableProps = {
  items: IncomeLineRecord[];
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
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function IncomeTable({
  items,
  pageSize,
  currentPage,
  totalPages,
  tableMissing,
  totalCount,
  firstItem,
  lastItem,
}: IncomeTableProps) {
  const emptyRows = Array.from({ length: pageSize }, (_, index) => index);

  return (
    <section className="rounded-[2rem] border border-[#eadcd2] bg-white p-4 shadow-[0_18px_40px_rgba(22,36,61,0.06)] sm:p-5 lg:rounded-[1.8rem]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-[1.9rem] font-bold tracking-[-0.04em] text-[color:var(--brand-dark)]">
          Ingresos registrados
        </h2>
        <p className="text-sm text-[color:var(--brand-mid)]">
          {tableMissing
            ? "Tablas sales/sale_items pendientes en Supabase"
            : totalCount === 0
              ? "Sin ingresos registrados"
              : `${firstItem}-${lastItem} de ${totalCount}`}
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-[#eadcd2] bg-[#fffdfa]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse">
            <thead>
              <tr className="bg-[#f6ede7] text-left text-[0.88rem] font-semibold text-[color:var(--brand-dark)]">
                <th className="px-4 py-1.5">Nombre</th>
                <th className="px-4 py-1.5">Tipo</th>
                <th className="px-4 py-1.5 text-right">Fecha</th>
                <th className="px-4 py-1.5 text-right">Precio</th>
                <th className="px-4 py-1.5 text-right">Unidades</th>
                <th className="px-4 py-1.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {emptyRows.map((rowIndex) => {
                const item = items[rowIndex];

                if (item) {
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-[#f1e4db] bg-white text-[0.92rem] text-[color:var(--brand-dark)]"
                    >
                      <td className="px-4 py-1.5 font-semibold">{item.itemName}</td>
                      <td className="px-4 py-1.5 capitalize">{item.itemType}</td>
                      <td className="px-4 py-1.5 text-right">{formatShortDate(item.saleDate)}</td>
                      <td className="px-4 py-1.5 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-1.5 text-right">{item.quantity}</td>
                      <td className="px-4 py-1.5 text-right font-semibold">{formatCurrency(item.lineTotal)}</td>
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
                          : "Sin ingresos"
                        : ""}
                    </td>
                    <td className="px-4 py-1.5">&nbsp;</td>
                    <td className="px-4 py-1.5 text-right">&nbsp;</td>
                    <td className="px-4 py-1.5 text-right">&nbsp;</td>
                    <td className="px-4 py-1.5 text-right">&nbsp;</td>
                    <td className="px-4 py-1.5 text-right">&nbsp;</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-[color:var(--brand-mid)]">
          Pagina {currentPage} de {totalPages}
        </p>
      </div>
    </section>
  );
}
