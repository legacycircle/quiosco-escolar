"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { normalizeDecimalString } from "@/lib/decimal";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Tone = "danger" | "success";

type Feedback = {
  tone: Tone;
  title: string;
  text: string;
  detail?: string;
};

type FoodFormState = {
  nombre: string;
  categoria: string;
  costoProduccion: string;
  precioVenta: string;
  fechaPreparacion: string;
};

const categorySuggestions = [
  "Snack",
  "Postre",
  "Bebida",
  "Entrada",
  "Plato frio",
  "Plato del dia",
  "Dulce",
  "Salado",
] as const;

function getTodayIsoDate() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const initialForm = (): FoodFormState => ({
  nombre: "",
  categoria: "",
  costoProduccion: "",
  precioVenta: "",
  fechaPreparacion: getTodayIsoDate(),
});

function buildFeedback(title: string, text: string, detail?: string, tone: Tone = "danger") {
  return {
    tone,
    title,
    text,
    detail,
  } satisfies Feedback;
}

function formatFoodError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("relation") && normalized.includes("prepared_foods")) {
    return buildFeedback(
      "Tabla pendiente",
      "La tabla prepared_foods todavia no existe en Supabase.",
      message
    );
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return buildFeedback(
      "Sin permisos",
      "Tu cuenta no tiene permisos para registrar alimentos.",
      message
    );
  }

  return buildFeedback(
    "No se pudo guardar",
    "Supabase devolvio un error al guardar el alimento.",
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

export function FoodActions() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FoodFormState>(initialForm);
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
    setForm(initialForm());
    setIsOpen(true);
  };

  const handleSubmit = () => {
    const nombre = form.nombre.trim();
    const categoria = form.categoria.trim();
    const precioVenta = normalizeDecimalString(form.precioVenta, { allowZero: false });
    const costoProduccion = form.costoProduccion.trim()
      ? normalizeDecimalString(form.costoProduccion, { allowZero: true })
      : null;

    if (!nombre || !categoria) {
      setFeedback(
        buildFeedback("Campos obligatorios", "Completa nombre y categoria para continuar.")
      );
      return;
    }

    if (!precioVenta) {
      setFeedback(
        buildFeedback("Precio invalido", "Ingresa un precio de venta valido mayor a cero.")
      );
      return;
    }

    if (form.costoProduccion.trim() && costoProduccion == null) {
      setFeedback(
        buildFeedback(
          "Costo invalido",
          "El costo de produccion debe ser un numero valido o quedar vacio."
        )
      );
      return;
    }

    if (!form.fechaPreparacion) {
      setFeedback(buildFeedback("Fecha obligatoria", "Selecciona la fecha del alimento."));
      return;
    }

    startTransition(() => {
      setFeedback(null);

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.from("prepared_foods").insert({
            nombre,
            categoria,
            costo_produccion: costoProduccion,
            precio_venta: precioVenta,
            fecha_preparacion: form.fechaPreparacion,
          });

          if (error) {
            setFeedback(formatFoodError(error.message));
            return;
          }

          setForm(initialForm());
          closeModal();
          setFeedback(
            buildFeedback(
              "Alimento registrado",
              "El alimento preparado se guardo correctamente.",
              undefined,
              "success"
            )
          );
          router.refresh();
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Error inesperado no identificado.";
          setFeedback(
            buildFeedback("Fallo el registro", "No se pudo guardar el alimento.", detail)
          );
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
          Registrar alimento
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
                  Alimentos
                </p>
                <h2 className="mt-2 font-heading text-[2rem] font-bold tracking-[-0.04em] text-[color:var(--brand-dark)] sm:text-[2.3rem]">
                  Registrar alimento
                </h2>
              </div>

              <button
                type="button"
                aria-label="Cerrar formulario"
                onClick={closeModal}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#eadcd2] bg-[#fcfaf8] text-lg font-semibold text-[color:var(--brand-dark)] transition hover:border-[#d7c5b7]"
              >
                x
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
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Nombre</span>
                  <input
                    value={form.nombre}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, nombre: event.target.value }))
                    }
                    type="text"
                    placeholder="Ej. Canchita, mazamorra morada, ceviche"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Categoria</span>
                  <input
                    list="food-categories"
                    value={form.categoria}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, categoria: event.target.value }))
                    }
                    type="text"
                    placeholder="Escribe o selecciona"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                  <datalist id="food-categories">
                    {categorySuggestions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Fecha</span>
                  <input
                    value={form.fechaPreparacion}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, fechaPreparacion: event.target.value }))
                    }
                    type="date"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">
                    Costo de produccion
                  </span>
                  <input
                    value={form.costoProduccion}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, costoProduccion: event.target.value }))
                    }
                    type="text"
                    inputMode="decimal"
                    placeholder="Opcional"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Precio de venta</span>
                  <input
                    value={form.precioVenta}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, precioVenta: event.target.value }))
                    }
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <div className="md:col-span-2 rounded-[1.2rem] border border-[#efe3da] bg-[#fcfaf8] px-4 py-3 text-sm text-[color:var(--brand-mid)]">
                  <p className="font-semibold text-[color:var(--brand-dark)]">Modulo pensado para preparados del dia</p>
                  <p className="mt-1">
                    Aqui no controlamos stock. Solo guardamos nombre, categoria, costo opcional, precio y fecha.
                  </p>
                </div>

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
                      Guardar alimento
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
