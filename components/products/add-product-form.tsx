"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Tone = "danger" | "success";

type Feedback = {
  tone: Tone;
  title: string;
  text: string;
  detail?: string;
};

type AddProductFormProps = {
  buttonLabel?: string;
};

function buildFeedback(title: string, text: string, detail?: string, tone: Tone = "danger") {
  return {
    tone,
    title,
    text,
    detail,
  } satisfies Feedback;
}

function formatProductError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("relation") && normalized.includes("products")) {
    return buildFeedback(
      "Tabla pendiente",
      "La tabla products todavía no existe en Supabase.",
      message
    );
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return buildFeedback(
      "Sin permisos",
      "Tu cuenta no tiene permisos para registrar productos.",
      message
    );
  }

  return buildFeedback(
    "No se pudo guardar",
    "Supabase devolvió un error al crear el producto.",
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

export function AddProductForm({ buttonLabel = "Agregar producto" }: AddProductFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
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

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const nombre = String(formData.get("nombre") ?? "").trim();
    const categoria = String(formData.get("categoria") ?? "").trim();
    const costoUnitario = Number(formData.get("costo_unitario") ?? 0);
    const precioVenta = Number(formData.get("precio_venta") ?? 0);
    const stock = Number(formData.get("stock") ?? 0);
    const isActive = formData.get("is_active") === "on";

    if (!nombre || !categoria) {
      setFeedback(
        buildFeedback(
          "Campos obligatorios",
          "Completa nombre y categoría para continuar."
        )
      );
      return;
    }

    if (Number.isNaN(costoUnitario) || Number.isNaN(precioVenta) || Number.isNaN(stock)) {
      setFeedback(
        buildFeedback(
          "Datos inválidos",
          "Costo, precio y stock deben ser valores válidos."
        )
      );
      return;
    }

    if (costoUnitario < 0 || precioVenta < 0 || stock < 0) {
      setFeedback(
        buildFeedback(
          "Valores inválidos",
          "Costo, precio y stock no pueden ser negativos."
        )
      );
      return;
    }

    startTransition(() => {
      setFeedback(null);

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.from("products").insert({
            nombre,
            categoria,
            costo_unitario: costoUnitario,
            precio_venta: precioVenta,
            stock,
            is_active: isActive,
          });

          if (error) {
            setFeedback(formatProductError(error.message));
            return;
          }

          form.reset();
          closeModal();
          setFeedback(
            buildFeedback(
              "Producto agregado",
              "El producto se registró correctamente en Supabase.",
              undefined,
              "success"
            )
          );
          router.refresh();
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Error inesperado no identificado.";

          setFeedback(
            buildFeedback(
              "Falló el registro",
              "El sistema lanzó una excepción al intentar guardar el producto.",
              detail
            )
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
          onClick={() => {
            setIsOpen(true);
            setFeedback(null);
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--brand-dark)] bg-[color:var(--brand-dark)] px-5 text-sm font-semibold text-white transition hover:opacity-92"
        >
          {buttonLabel}
        </button>
      </div>

      {feedback && !isOpen ? <FeedbackBanner feedback={feedback} /> : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(22,36,61,0.38)] p-4 sm:items-center sm:p-6">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onClick={closeModal}
          />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.9rem] border border-[#eadcd2] bg-white shadow-[0_30px_70px_rgba(22,36,61,0.2)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#efe3da] px-5 py-5 sm:px-6">
              <div>
                <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-mid)]">
                  Inventario
                </p>
                <h2 className="mt-2 font-heading text-[2rem] font-bold tracking-[-0.04em] text-[color:var(--brand-dark)] sm:text-[2.3rem]">
                  Registrar producto
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
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <label className="block space-y-2 md:col-span-2" htmlFor="nombre">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Nombre</span>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    required
                    placeholder="Ej. Pulp durazno"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2" htmlFor="categoria">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Categoría</span>
                  <input
                    id="categoria"
                    name="categoria"
                    type="text"
                    required
                    placeholder="Bebidas"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2" htmlFor="stock">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Stock</span>
                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2" htmlFor="costo_unitario">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Costo unitario</span>
                  <input
                    id="costo_unitario"
                    name="costo_unitario"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2" htmlFor="precio_venta">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Precio de venta</span>
                  <input
                    id="precio_venta"
                    name="precio_venta"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <div className="md:col-span-2 flex flex-col gap-4 pt-1">
                  <label className="inline-flex items-center gap-3 text-sm font-semibold text-[color:var(--brand-dark)]">
                    <input
                      name="is_active"
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-[#d9ccc2] text-[color:var(--brand-dark)] focus:ring-[color:var(--accent)]"
                    />
                    Producto activo
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
                      Guardar producto
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
