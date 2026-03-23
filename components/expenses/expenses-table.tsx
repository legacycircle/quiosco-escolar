"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { normalizeDecimalString } from "@/lib/decimal";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ExpenseRecord } from "@/lib/supabase/expenses";

type Tone = "danger" | "success";

type Feedback = {
  tone: Tone;
  title: string;
  text: string;
  detail?: string;
};

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

type EditState = {
  id: number;
  concepto: string;
  montoTotal: string;
} | null;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function buildFeedback(title: string, text: string, detail?: string, tone: Tone = "danger") {
  return { tone, title, text, detail } satisfies Feedback;
}

function formatSaveError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("relation") && normalized.includes("expenses")) {
    return buildFeedback("Tabla pendiente", "La tabla expenses todavía no existe en Supabase.", message);
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return buildFeedback("Sin permisos", "Tu cuenta no tiene permisos para editar gastos.", message);
  }

  return buildFeedback("No se pudo guardar", "Supabase devolvió un error al actualizar el gasto.", message);
}

function formatDeleteError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("relation") && normalized.includes("expenses")) {
    return buildFeedback("Tabla pendiente", "La tabla expenses todavía no existe en Supabase.", message);
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return buildFeedback("Sin permisos", "Tu cuenta no tiene permisos para borrar gastos.", message);
  }

  return buildFeedback("No se pudo borrar", "Supabase devolvió un error al eliminar el gasto.", message);
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateOnly(value: Date) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayUtcMidnight() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getExpenseAgeInDays(value: string) {
  const expenseDate = parseDateOnly(value);
  const today = getTodayUtcMidnight();
  return Math.floor((today.getTime() - expenseDate.getTime()) / DAY_IN_MS);
}

function canDeleteExpense(value: string) {
  const ageInDays = getExpenseAgeInDays(value);
  return ageInDays >= 0 && ageInDays < 2;
}

function getDeleteWindow() {
  const today = getTodayUtcMidnight();
  const oldestAllowed = new Date(today);
  oldestAllowed.setUTCDate(oldestAllowed.getUTCDate() - 1);

  return {
    oldestAllowed: formatDateOnly(oldestAllowed),
    newestAllowed: formatDateOnly(today),
  };
}

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
    timeZone: "UTC",
  }).format(parseDateOnly(value));
}

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  return (
    <div
      className={[
        "rounded-2xl border px-4 py-4 text-sm leading-6",
        feedback.tone === "success"
          ? "border-[color:var(--accent-soft)] bg-[color:var(--accent-soft)]/30 text-[color:var(--brand-dark)]"
          : "border-[color:var(--accent)]/22 bg-[color:var(--accent-soft)]/42 text-[color:var(--brand-dark)]",
      ].join(" ")}
    >
      <p className="font-semibold text-[color:var(--brand-dark)]">{feedback.title}</p>
      <p className="mt-1">{feedback.text}</p>
      {feedback.detail ? (
        <p className="mt-2 break-words rounded-xl bg-white/70 px-3 py-2 text-xs leading-5 text-[color:var(--brand-mid)]">
          {feedback.detail}
        </p>
      ) : null}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4.8c0-.44.36-.8.8-.8h6.4c.44 0 .8.36.8.8V6" />
      <path d="M6.8 6l.73 11.03A2 2 0 0 0 9.52 19h4.96a2 2 0 0 0 1.99-1.97L17.2 6" />
      <path d="M10 10.25v5.5" />
      <path d="M14 10.25v5.5" />
    </svg>
  );
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
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [editState, setEditState] = useState<EditState>(null);
  const [isPending, startTransition] = useTransition();
  const emptyRows = Array.from({ length: pageSize }, (_, index) => index);

  useEffect(() => {
    if (!editState) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editState]);

  const closeModal = () => setEditState(null);

  const openEdit = (expense: ExpenseRecord) => {
    setFeedback(null);
    setEditState({
      id: expense.id,
      concepto: expense.concepto,
      montoTotal: String(expense.monto_total),
    });
  };

  const handleSave = () => {
    if (!editState) {
      return;
    }

    const concepto = editState.concepto.trim();
    const montoTotal = normalizeDecimalString(editState.montoTotal, { allowZero: false });

    if (!concepto) {
      setFeedback(buildFeedback("Nombre obligatorio", "Ingresa el nombre del gasto para guardar los cambios."));
      return;
    }

    if (!montoTotal) {
      setFeedback(buildFeedback("Monto inválido", "Ingresa un monto válido mayor a cero."));
      return;
    }

    startTransition(() => {
      setFeedback(null);

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase
            .from("expenses")
            .update({ concepto, monto_total: montoTotal })
            .eq("id", editState.id);

          if (error) {
            setFeedback(formatSaveError(error.message));
            return;
          }

          closeModal();
          setFeedback(buildFeedback("Gasto actualizado", "Los cambios se guardaron correctamente.", undefined, "success"));
          router.refresh();
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Error inesperado no identificado.";
          setFeedback(buildFeedback("Falló la edición", "No se pudo actualizar el gasto.", detail));
        }
      })();
    });
  };

  const handleRemove = (expense: ExpenseRecord) => {
    if (!canDeleteExpense(expense.fecha_gasto)) {
      setFeedback(
        buildFeedback(
          "Borrado bloqueado",
          "Solo puedes borrar gastos cuya fecha registrada sea menor a 2 días."
        )
      );
      return;
    }

    startTransition(() => {
      setFeedback(null);

      void (async () => {
        try {
          if (!window.confirm(`¿Deseas borrar ${expense.concepto}? Esta acción eliminará todo el registro.`)) {
            return;
          }

          const { oldestAllowed, newestAllowed } = getDeleteWindow();
          const supabase = createSupabaseBrowserClient();
          const { data, error } = await supabase
            .from("expenses")
            .delete()
            .eq("id", expense.id)
            .gte("fecha_gasto", oldestAllowed)
            .lte("fecha_gasto", newestAllowed)
            .select("id");

          if (error) {
            setFeedback(formatDeleteError(error.message));
            return;
          }

          if (!data || data.length === 0) {
            setFeedback(
              buildFeedback(
                "No se pudo borrar",
                "El gasto ya no cumple la regla de menos de 2 días o ya fue eliminado."
              )
            );
            return;
          }

          setFeedback(buildFeedback("Gasto eliminado", "El gasto se eliminó correctamente.", undefined, "success"));
          router.refresh();
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Error inesperado no identificado.";
          setFeedback(buildFeedback("No se pudo borrar", "No se pudo eliminar el gasto.", detail));
        }
      })();
    });
  };

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

      {feedback && !editState ? (
        <div className="mt-4">
          <FeedbackBanner feedback={feedback} />
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-[#eadcd2] bg-[#fffdfa]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1240px] border-collapse">
            <thead>
              <tr className="bg-[#f6ede7] text-left text-[0.88rem] font-semibold text-[color:var(--brand-dark)]">
                <th className="px-4 py-1.5">Concepto</th>
                <th className="px-4 py-1.5">Tipo</th>
                <th className="px-4 py-1.5">Categoría</th>
                <th className="px-4 py-1.5 text-right">Monto</th>
                <th className="px-4 py-1.5 text-right">Fecha</th>
                <th className="px-4 py-1.5">Notas</th>
                <th className="px-4 py-1.5 text-right">Editar</th>
                <th className="px-4 py-1.5 text-right">Borrar</th>
              </tr>
            </thead>
            <tbody>
              {emptyRows.map((rowIndex) => {
                const expense = items[rowIndex];

                if (expense) {
                  const canDelete = canDeleteExpense(expense.fecha_gasto);

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
                      <td className="px-4 py-1.5 text-right">
                        <button
                          type="button"
                          aria-label={`Editar ${expense.concepto}`}
                          onClick={() => openEdit(expense)}
                          disabled={isPending}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#eadcd2] bg-white text-[color:var(--brand-dark)] transition hover:border-[color:var(--brand-mid)] hover:text-[color:var(--brand-mid)] disabled:cursor-not-allowed disabled:opacity-65"
                        >
                          <PencilIcon />
                        </button>
                      </td>
                      <td className="px-4 py-1.5 text-right">
                        <button
                          type="button"
                          aria-label={`Borrar ${expense.concepto}`}
                          onClick={() => handleRemove(expense)}
                          disabled={isPending}
                          title={canDelete ? "Borrar gasto" : "Solo se puede borrar si la fecha registrada es menor a 2 días."}
                          className={[
                            "inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white transition disabled:cursor-not-allowed disabled:opacity-65",
                            canDelete
                              ? "border-[#eadcd2] text-[color:var(--brand-dark)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                              : "border-[#efe3da] text-[color:var(--brand-mid)] opacity-55",
                          ].join(" ")}
                        >
                          <TrashIcon />
                        </button>
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
                    <td className="px-4 py-1.5 text-right">&nbsp;</td>
                    <td className="px-4 py-1.5 text-right">&nbsp;</td>
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

      {editState ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(22,36,61,0.38)] p-4 sm:items-center sm:p-6">
          <div className="absolute inset-0" aria-hidden="true" onClick={closeModal} />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-[1.9rem] border border-[#eadcd2] bg-white shadow-[0_30px_70px_rgba(22,36,61,0.2)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#efe3da] px-5 py-5 sm:px-6">
              <div>
                <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-mid)]">
                  Gasto
                </p>
                <h2 className="mt-2 font-heading text-[2rem] font-bold tracking-[-0.04em] text-[color:var(--brand-dark)]">
                  Editar gasto
                </h2>
              </div>

              <button
                type="button"
                aria-label="Cerrar edición"
                onClick={closeModal}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#eadcd2] bg-[#fcfaf8] text-lg font-semibold text-[color:var(--brand-dark)] transition hover:border-[#d7c5b7]"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSave();
                }}
              >
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Nombre</span>
                  <input
                    value={editState.concepto}
                    onChange={(event) =>
                      setEditState((current) => current ? { ...current, concepto: event.target.value } : current)
                    }
                    type="text"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Monto</span>
                  <input
                    value={editState.montoTotal}
                    onChange={(event) =>
                      setEditState((current) => current ? { ...current, montoTotal: event.target.value } : current)
                    }
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                {feedback ? <FeedbackBanner feedback={feedback} /> : null}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#eadcd2] bg-white px-5 text-sm font-semibold text-[color:var(--brand-dark)] transition hover:border-[#d7c5b7]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    aria-busy={isPending}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--brand-dark)] bg-[color:var(--brand-dark)] px-5 text-sm font-semibold text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
