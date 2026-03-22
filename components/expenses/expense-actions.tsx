"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { normalizeDecimalString } from "@/lib/decimal";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Tone = "danger" | "success";

type Feedback = {
  tone: Tone;
  title: string;
  text: string;
  detail?: string;
};

type ExpenseFormState = {
  concepto: string;
  tipo: string;
  categoria: string;
  montoTotal: string;
  fechaGasto: string;
  notas: string;
};

const expenseTypeOptions = [
  { value: "operativo", label: "Operativo" },
  { value: "insumo", label: "Insumo" },
  { value: "produccion", label: "Producción" },
  { value: "otro", label: "Otro" },
] as const;

const categorySuggestions = [
  "Transporte",
  "Embalaje",
  "Vasos",
  "Platos descartables",
  "Insumos",
  "Ingredientes",
  "Gas",
  "Limpieza",
  "Otros",
] as const;

const initialForm = (): ExpenseFormState => ({
  concepto: "",
  tipo: "operativo",
  categoria: "",
  montoTotal: "",
  fechaGasto: new Date().toISOString().slice(0, 10),
  notas: "",
});

function buildFeedback(title: string, text: string, detail?: string, tone: Tone = "danger") {
  return {
    tone,
    title,
    text,
    detail,
  } satisfies Feedback;
}

function formatExpenseError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("relation") && normalized.includes("expenses")) {
    return buildFeedback(
      "Tabla pendiente",
      "La tabla expenses todavía no existe en Supabase.",
      message
    );
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return buildFeedback(
      "Sin permisos",
      "Tu cuenta no tiene permisos para registrar gastos.",
      message
    );
  }

  return buildFeedback(
    "No se pudo guardar",
    "Supabase devolvió un error al guardar el gasto.",
    message
  );
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

export function ExpenseActions() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>(initialForm);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const closeModal = () => setIsOpen(false);

  const openModal = () => {
    setFeedback(null);
    setIsOpen(true);
  };

  const handleSubmit = () => {
    const concepto = form.concepto.trim();
    const categoria = form.categoria.trim();
    const montoTotal = normalizeDecimalString(form.montoTotal, { allowZero: false });

    if (!concepto || !categoria) {
      setFeedback(
        buildFeedback("Campos obligatorios", "Completa concepto y categoría para continuar.")
      );
      return;
    }

    if (!montoTotal) {
      setFeedback(
        buildFeedback("Monto inválido", "Ingresa un monto válido mayor a cero.")
      );
      return;
    }

    if (!form.fechaGasto) {
      setFeedback(buildFeedback("Fecha obligatoria", "Selecciona la fecha del gasto."));
      return;
    }

    startTransition(() => {
      setFeedback(null);

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.from("expenses").insert({
            concepto,
            tipo: form.tipo,
            categoria,
            monto_total: montoTotal,
            fecha_gasto: form.fechaGasto,
            notas: form.notas.trim() ? form.notas.trim() : null,
          });

          if (error) {
            setFeedback(formatExpenseError(error.message));
            return;
          }

          setForm(initialForm());
          closeModal();
          setFeedback(
            buildFeedback(
              "Gasto registrado",
              "El gasto se guardó correctamente.",
              undefined,
              "success"
            )
          );
          router.refresh();
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Error inesperado no identificado.";
          setFeedback(buildFeedback("Falló el registro", "No se pudo guardar el gasto.", detail));
        }
      })();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={openModal}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--brand-dark)] bg-[color:var(--brand-dark)] px-5 text-sm font-semibold text-white transition hover:opacity-92"
        >
          Registrar gasto
        </button>
      </div>

      {feedback && !isOpen ? <FeedbackBanner feedback={feedback} /> : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(22,36,61,0.38)] p-4 sm:items-center sm:p-6">
          <div className="absolute inset-0" aria-hidden="true" onClick={closeModal} />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.9rem] border border-[#eadcd2] bg-white shadow-[0_30px_70px_rgba(22,36,61,0.2)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#efe3da] px-5 py-5 sm:px-6">
              <div>
                <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-mid)]">
                  Gastos
                </p>
                <h2 className="mt-2 font-heading text-[2rem] font-bold tracking-[-0.04em] text-[color:var(--brand-dark)] sm:text-[2.3rem]">
                  Registrar gasto
                </h2>
              </div>

              <button
                type="button"
                aria-label="Cerrar formulario"
                onClick={closeModal}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#eadcd2] bg-[#fcfaf8] text-lg font-semibold text-[color:var(--brand-dark)] transition hover:border-[#d7c5b7]"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSubmit();
                }}
              >
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Concepto</span>
                  <input
                    value={form.concepto}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, concepto: event.target.value }))
                    }
                    type="text"
                    placeholder="Ej. Compra de vasos, transporte al mercado"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Tipo</span>
                  <select
                    value={form.tipo}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, tipo: event.target.value }))
                    }
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  >
                    {expenseTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Categoría</span>
                  <input
                    list="expense-categories"
                    value={form.categoria}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, categoria: event.target.value }))
                    }
                    type="text"
                    placeholder="Escribe o selecciona"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                  <datalist id="expense-categories">
                    {categorySuggestions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Monto total</span>
                  <input
                    value={form.montoTotal}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, montoTotal: event.target.value }))
                    }
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Fecha del gasto</span>
                  <input
                    value={form.fechaGasto}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, fechaGasto: event.target.value }))
                    }
                    type="date"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Notas</span>
                  <textarea
                    value={form.notas}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, notas: event.target.value }))
                    }
                    rows={3}
                    placeholder="Opcional"
                    className="w-full rounded-xl border border-[#e7ddd6] bg-white px-4 py-3 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <div className="md:col-span-2 flex flex-col gap-4 pt-1">
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
                      Guardar gasto
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
