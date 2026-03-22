"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  divideDecimalStringByInteger,
  normalizeDecimalString,
  normalizeOptionalDecimalString,
  parsePositiveInteger,
} from "@/lib/decimal";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ProductOption } from "@/lib/supabase/products";

type Tone = "danger" | "success";
type CostMode = "unit" | "total";
type ModalMode = "create" | "restock" | null;

type Feedback = {
  tone: Tone;
  title: string;
  text: string;
  detail?: string;
};

type ProductActionsProps = {
  productOptions: ProductOption[];
};

type CreateFormState = {
  nombre: string;
  categoria: string;
  cantidad: string;
  costMode: CostMode;
  costValue: string;
  precioVenta: string;
  isActive: boolean;
};

type RestockFormState = {
  nombre: string;
  cantidad: string;
  costMode: CostMode;
  costValue: string;
};

const initialCreateForm: CreateFormState = {
  nombre: "",
  categoria: "",
  cantidad: "",
  costMode: "unit",
  costValue: "",
  precioVenta: "",
  isActive: true,
};

const initialRestockForm: RestockFormState = {
  nombre: "",
  cantidad: "",
  costMode: "total",
  costValue: "",
};

function buildFeedback(title: string, text: string, detail?: string, tone: Tone = "danger") {
  return { tone, title, text, detail } satisfies Feedback;
}

function formatProductError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("relation") && normalized.includes("products")) {
    return buildFeedback("Tabla pendiente", "La tabla products todavía no existe en Supabase.", message);
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return buildFeedback("Sin permisos", "Tu cuenta no tiene permisos para registrar productos.", message);
  }

  if (normalized.includes("duplicate") || normalized.includes("already exists")) {
    return buildFeedback(
      "Producto duplicado",
      "Ya existe un producto con ese nombre. Usa Agregar inventario si ya lo tenías registrado.",
      message
    );
  }

  return buildFeedback("No se pudo guardar", "Supabase devolvió un error al guardar el producto.", message);
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function getUnitCostString(quantity: number | null, costMode: CostMode, costValue: string) {
  if (quantity == null) {
    return null;
  }

  if (costMode === "unit") {
    return normalizeDecimalString(costValue);
  }

  return divideDecimalStringByInteger(costValue, quantity);
}

function formatCurrency(value: number | null) {
  if (value == null) {
    return "-";
  }

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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

function CostSwitcher({ value, onChange }: { value: CostMode; onChange: (value: CostMode) => void }) {
  return (
    <div className="inline-flex rounded-full border border-[#eadcd2] bg-[#fcfaf8] p-1">
      <button
        type="button"
        onClick={() => onChange("unit")}
        className={[
          "rounded-full px-4 py-2 text-sm font-semibold transition",
          value === "unit" ? "bg-[color:var(--brand-dark)] text-white" : "text-[color:var(--brand-mid)]",
        ].join(" ")}
      >
        Costo unitario
      </button>
      <button
        type="button"
        onClick={() => onChange("total")}
        className={[
          "rounded-full px-4 py-2 text-sm font-semibold transition",
          value === "total" ? "bg-[color:var(--brand-dark)] text-white" : "text-[color:var(--brand-mid)]",
        ].join(" ")}
      >
        Costo total
      </button>
    </div>
  );
}

export function ProductActions({ productOptions }: ProductActionsProps) {
  const router = useRouter();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [createForm, setCreateForm] = useState<CreateFormState>(initialCreateForm);
  const [restockForm, setRestockForm] = useState<RestockFormState>(initialRestockForm);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!modalMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalMode]);

  const selectedProduct = useMemo(() => {
    const normalized = normalizeName(restockForm.nombre);
    return productOptions.find((item) => normalizeName(item.nombre) === normalized) ?? null;
  }, [productOptions, restockForm.nombre]);

  const closeModal = () => setModalMode(null);
  const openCreate = () => {
    setModalMode("create");
    setFeedback(null);
  };
  const openRestock = () => {
    setModalMode("restock");
    setFeedback(null);
  };

  const submitCreate = () => {
    const nombre = createForm.nombre.trim();
    const categoria = createForm.categoria.trim();
    const cantidad = parsePositiveInteger(createForm.cantidad);
    const costoUnitario = getUnitCostString(cantidad, createForm.costMode, createForm.costValue);
    const precioVenta = normalizeOptionalDecimalString(createForm.precioVenta);

    if (!nombre || !categoria) {
      setFeedback(buildFeedback("Campos obligatorios", "Completa nombre y categoría para continuar."));
      return;
    }

    if (cantidad == null) {
      setFeedback(buildFeedback("Cantidad inválida", "Ingresa una cantidad mayor a cero."));
      return;
    }

    if (costoUnitario == null) {
      setFeedback(buildFeedback("Costo inválido", "Ingresa un costo válido para calcular el costo unitario sin redondeos peligrosos."));
      return;
    }

    if (createForm.precioVenta.trim() && precioVenta == null) {
      setFeedback(buildFeedback("Precio inválido", "El precio de venta debe ser un número válido o quedar vacío."));
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
            stock: cantidad,
            total_comprado: cantidad,
            is_active: createForm.isActive,
          });

          if (error) {
            setFeedback(formatProductError(error.message));
            return;
          }

          setCreateForm(initialCreateForm);
          closeModal();
          setFeedback(buildFeedback("Producto registrado", "El producto nuevo se guardó correctamente.", undefined, "success"));
          router.refresh();
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Error inesperado no identificado.";
          setFeedback(buildFeedback("Falló el registro", "No se pudo guardar el producto nuevo.", detail));
        }
      })();
    });
  };

  const submitRestock = () => {
    const cantidad = parsePositiveInteger(restockForm.cantidad);
    const costoUnitario = getUnitCostString(cantidad, restockForm.costMode, restockForm.costValue);

    if (!selectedProduct) {
      setFeedback(buildFeedback("Producto no encontrado", "Selecciona un producto existente para agregar inventario."));
      return;
    }

    if (cantidad == null) {
      setFeedback(buildFeedback("Cantidad inválida", "Ingresa una cantidad mayor a cero."));
      return;
    }

    if (costoUnitario == null) {
      setFeedback(buildFeedback("Costo inválido", "Ingresa un costo válido para calcular el costo unitario sin redondeos peligrosos."));
      return;
    }

    startTransition(() => {
      setFeedback(null);

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase
            .from("products")
            .update({
              stock: selectedProduct.stock + cantidad,
              total_comprado: selectedProduct.total_comprado + cantidad,
              costo_unitario: costoUnitario,
              is_active: true,
            })
            .eq("id", selectedProduct.id);

          if (error) {
            setFeedback(formatProductError(error.message));
            return;
          }

          setRestockForm(initialRestockForm);
          closeModal();
          setFeedback(buildFeedback("Inventario actualizado", `Se agregaron ${cantidad} unidades a ${selectedProduct.nombre}.`, undefined, "success"));
          router.refresh();
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Error inesperado no identificado.";
          setFeedback(buildFeedback("Falló el registro", "No se pudo actualizar el inventario.", detail));
        }
      })();
    });
  };

  const isCreate = modalMode === "create";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="button" onClick={openRestock} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#eadcd2] bg-white px-5 text-sm font-semibold text-[color:var(--brand-dark)] transition hover:border-[color:var(--brand-mid)]">
          Agregar inventario
        </button>
        <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--brand-dark)] bg-[color:var(--brand-dark)] px-5 text-sm font-semibold text-white transition hover:opacity-92">
          Registrar producto
        </button>
      </div>

      {feedback && !modalMode ? <FeedbackBanner feedback={feedback} /> : null}

      {modalMode ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(22,36,61,0.38)] p-4 sm:items-center sm:p-6">
          <div className="absolute inset-0" aria-hidden="true" onClick={closeModal} />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.9rem] border border-[#eadcd2] bg-white shadow-[0_30px_70px_rgba(22,36,61,0.2)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#efe3da] px-5 py-5 sm:px-6">
              <div>
                <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-mid)]">Inventario</p>
                <h2 className="mt-2 font-heading text-[2rem] font-bold tracking-[-0.04em] text-[color:var(--brand-dark)] sm:text-[2.3rem]">
                  {isCreate ? "Registrar producto" : "Agregar inventario"}
                </h2>
              </div>

              <button type="button" aria-label="Cerrar formulario" onClick={closeModal} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#eadcd2] bg-[#fcfaf8] text-lg font-semibold text-[color:var(--brand-dark)] transition hover:border-[#d7c5b7]">
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[color:var(--brand-dark)]">Cómo registrar el costo</p>
                  <CostSwitcher
                    value={isCreate ? createForm.costMode : restockForm.costMode}
                    onChange={(value) => {
                      if (isCreate) {
                        setCreateForm((current) => ({ ...current, costMode: value }));
                        return;
                      }
                      setRestockForm((current) => ({ ...current, costMode: value }));
                    }}
                  />
                </div>

                {isCreate ? (
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); submitCreate(); }}>
                    <label className="block space-y-2 md:col-span-2">
                      <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Nombre del producto</span>
                      <input value={createForm.nombre} onChange={(event) => setCreateForm((current) => ({ ...current, nombre: event.target.value }))} type="text" placeholder="Ej. Galleta animalitos" className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]" />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Categoría</span>
                      <input value={createForm.categoria} onChange={(event) => setCreateForm((current) => ({ ...current, categoria: event.target.value }))} type="text" placeholder="Galletas, bebidas, snacks..." className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]" />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Cantidad comprada</span>
                      <input value={createForm.cantidad} onChange={(event) => setCreateForm((current) => ({ ...current, cantidad: event.target.value }))} type="number" min="1" step="1" placeholder="15" className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]" />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-[color:var(--brand-dark)]">{createForm.costMode === "unit" ? "Costo unitario" : "Costo total de la compra"}</span>
                      <input value={createForm.costValue} onChange={(event) => setCreateForm((current) => ({ ...current, costValue: event.target.value }))} type="text" inputMode="decimal" placeholder="0.00" className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]" />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Precio de venta</span>
                      <input value={createForm.precioVenta} onChange={(event) => setCreateForm((current) => ({ ...current, precioVenta: event.target.value }))} type="text" inputMode="decimal" placeholder="Opcional" className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]" />
                    </label>

                    <div className="md:col-span-2 flex flex-col gap-4 pt-1">
                      <label className="inline-flex items-center gap-3 text-sm font-semibold text-[color:var(--brand-dark)]">
                        <input checked={createForm.isActive} onChange={(event) => setCreateForm((current) => ({ ...current, isActive: event.target.checked }))} type="checkbox" className="h-4 w-4 rounded border-[#d9ccc2] text-[color:var(--brand-dark)] focus:ring-[color:var(--accent)]" />
                        Producto activo
                      </label>

                      {feedback ? <FeedbackBanner feedback={feedback} /> : null}

                      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button type="button" onClick={closeModal} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#eadcd2] bg-white px-5 text-sm font-semibold text-[color:var(--brand-dark)] transition hover:border-[#d7c5b7]">Cancelar</button>
                        <button type="submit" disabled={isPending} aria-busy={isPending} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--brand-dark)] bg-[color:var(--brand-dark)] px-5 text-sm font-semibold text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-75">Guardar producto</button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); submitRestock(); }}>
                    <label className="block space-y-2 md:col-span-2">
                      <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Producto existente</span>
                      <input list="productos-existentes" value={restockForm.nombre} onChange={(event) => setRestockForm((current) => ({ ...current, nombre: event.target.value }))} type="text" placeholder="Escribe o selecciona un producto" className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]" />
                      <datalist id="productos-existentes">
                        {productOptions.map((product) => <option key={product.id} value={product.nombre} />)}
                      </datalist>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Cantidad comprada</span>
                      <input value={restockForm.cantidad} onChange={(event) => setRestockForm((current) => ({ ...current, cantidad: event.target.value }))} type="number" min="1" step="1" placeholder="15" className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]" />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-[color:var(--brand-dark)]">{restockForm.costMode === "unit" ? "Costo unitario" : "Costo total de la compra"}</span>
                      <input value={restockForm.costValue} onChange={(event) => setRestockForm((current) => ({ ...current, costValue: event.target.value }))} type="text" inputMode="decimal" placeholder="0.00" className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]" />
                    </label>

                    <div className="rounded-[1.25rem] border border-[#efe3da] bg-[#fcfaf8] px-4 py-3">
                      <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-mid)]">Producto detectado</p>
                      <p className="mt-2 text-sm font-semibold text-[color:var(--brand-dark)]">{selectedProduct ? selectedProduct.nombre : "Selecciona uno de la lista"}</p>
                      <p className="mt-1 text-sm text-[color:var(--brand-mid)]">
                        {selectedProduct
                          ? `${selectedProduct.categoria} · Comprado: ${selectedProduct.total_comprado} · Quedan: ${selectedProduct.stock} · Venta: ${formatCurrency(selectedProduct.precio_venta)}`
                          : "Escribe el nombre exacto o elígelo del listado sugerido."}
                      </p>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-4 pt-1">
                      {feedback ? <FeedbackBanner feedback={feedback} /> : null}

                      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button type="button" onClick={closeModal} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#eadcd2] bg-white px-5 text-sm font-semibold text-[color:var(--brand-dark)] transition hover:border-[#d7c5b7]">Cancelar</button>
                        <button type="submit" disabled={isPending} aria-busy={isPending} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--brand-dark)] bg-[color:var(--brand-dark)] px-5 text-sm font-semibold text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-75">Actualizar inventario</button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


