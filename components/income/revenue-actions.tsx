"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  normalizeDecimalString,
  normalizeOptionalDecimalString,
  parsePositiveInteger,
} from "@/lib/decimal";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ProductOption } from "@/lib/supabase/products";

type Tone = "danger" | "success";

type Feedback = {
  tone: Tone;
  title: string;
  text: string;
  detail?: string;
};

type RevenueActionsProps = {
  productOptions: ProductOption[];
  productsTableMissing: boolean;
};

type FormState = {
  nombre: string;
  precio: string;
  unidades: string;
  total: string;
};

type PriceSource = "product" | "manual";

function getTodayIsoDate() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function buildFeedback(title: string, text: string, detail?: string, tone: Tone = "danger") {
  return { tone, title, text, detail } satisfies Feedback;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function multiplyDecimalStringByInteger(value: string, quantity: number) {
  const normalized = normalizeOptionalDecimalString(value);

  if (normalized == null || !Number.isInteger(quantity) || quantity <= 0) {
    return null;
  }

  const result = Number(normalized) * quantity;

  if (!Number.isFinite(result)) {
    return null;
  }

  return normalizeOptionalDecimalString(String(result));
}

function getProductPriceString(product: ProductOption | null) {
  if (!product || product.precio_venta == null) {
    return "";
  }

  return normalizeOptionalDecimalString(String(product.precio_venta)) ?? String(product.precio_venta);
}

function getProductCostString(product: ProductOption | null) {
  if (!product) {
    return "0";
  }

  return (
    normalizeOptionalDecimalString(String(product.costo_unitario), { scale: 8 }) ??
    String(product.costo_unitario)
  );
}

function formatSaveError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("relation") && (normalized.includes("sales") || normalized.includes("sale_items"))) {
    return buildFeedback(
      "Tablas pendientes",
      "Faltan las tablas sales o sale_items en Supabase. Ejecuta primero el SQL de ingresos.",
      message
    );
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return buildFeedback(
      "Sin permisos",
      "Tu cuenta no tiene permisos para registrar ingresos.",
      message
    );
  }

  return buildFeedback("No se pudo guardar", "Supabase devolvio un error al guardar la venta.", message);
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

function initialForm(): FormState {
  return {
    nombre: "",
    precio: "",
    unidades: "",
    total: "",
  };
}

export function RevenueActions({ productOptions, productsTableMissing }: RevenueActionsProps) {
  const router = useRouter();
  const activeProducts = useMemo(
    () => productOptions.filter((item) => item.is_active),
    [productOptions]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [priceSource, setPriceSource] = useState<PriceSource>("product");
  const [isCalculatingTotal, setIsCalculatingTotal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deferredName = useDeferredValue(form.nombre);

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

  const selectedProduct = useMemo(() => {
    const normalized = normalizeName(form.nombre);

    if (!normalized) {
      return null;
    }

    return activeProducts.find((item) => normalizeName(item.nombre) === normalized) ?? null;
  }, [activeProducts, form.nombre]);

  const matchedProducts = useMemo(() => {
    const normalized = normalizeName(deferredName);

    if (!normalized) {
      return [] as ProductOption[];
    }

    return activeProducts
      .filter((item) => normalizeName(item.nombre).includes(normalized))
      .slice(0, 6);
  }, [activeProducts, deferredName]);

  useEffect(() => {
    if (priceSource !== "product") {
      return;
    }

    const defaultPrice = getProductPriceString(selectedProduct);

    setForm((current) => {
      if (current.precio === defaultPrice) {
        return current;
      }

      return {
        ...current,
        precio: defaultPrice,
      };
    });
  }, [priceSource, selectedProduct]);

  useEffect(() => {
    const quantity = parsePositiveInteger(form.unidades);
    const price = normalizeOptionalDecimalString(form.precio);

    if (!quantity || price == null) {
      setIsCalculatingTotal(false);
      setForm((current) => (current.total ? { ...current, total: "" } : current));
      return;
    }

    setIsCalculatingTotal(true);

    const timeoutId = window.setTimeout(() => {
      const computedTotal = multiplyDecimalStringByInteger(price, quantity) ?? "";

      setForm((current) => {
        if (current.total === computedTotal) {
          return current;
        }

        return {
          ...current,
          total: computedTotal,
        };
      });
      setIsCalculatingTotal(false);
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
      setIsCalculatingTotal(false);
    };
  }, [form.precio, form.unidades]);

  const openModal = () => {
    if (productsTableMissing) {
      setFeedback(
        buildFeedback(
          "Tabla pendiente",
          "La tabla products no existe todavia en Supabase, asi que no se pueden registrar ventas."
        )
      );
      return;
    }

    setFeedback(null);
    setForm(initialForm());
    setPriceSource("product");
    setIsNameFocused(false);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsNameFocused(false);
  };

  const handlePickProduct = (product: ProductOption) => {
    setForm((current) => ({
      ...current,
      nombre: product.nombre,
      precio: getProductPriceString(product),
    }));
    setPriceSource("product");
    setIsNameFocused(false);
  };

  const handleSubmit = () => {
    if (!selectedProduct) {
      setFeedback(
        buildFeedback(
          "Producto obligatorio",
          "Escribe y selecciona un producto valido desde las coincidencias antes de guardar."
        )
      );
      return;
    }

    const quantity = parsePositiveInteger(form.unidades);
    const price = normalizeDecimalString(form.precio, { allowZero: false });
    const total = quantity ? multiplyDecimalStringByInteger(form.precio, quantity) : null;

    if (!quantity) {
      setFeedback(buildFeedback("Unidades invalidas", "Las unidades vendidas deben ser enteros positivos."));
      return;
    }

    if (!price) {
      setFeedback(buildFeedback("Precio invalido", "Ingresa un precio por unidad valido mayor a cero."));
      return;
    }

    if (!total) {
      setFeedback(buildFeedback("Total invalido", "Completa unidades y precio para calcular el total."));
      return;
    }

    startTransition(() => {
      setFeedback(null);

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const saleInsert = await supabase
            .from("sales")
            .insert({ sale_date: getTodayIsoDate() })
            .select("id")
            .single();

          if (saleInsert.error || !saleInsert.data) {
            setFeedback(formatSaveError(saleInsert.error?.message ?? "No se pudo crear la cabecera de venta."));
            return;
          }

          const itemInsert = await supabase.from("sale_items").insert({
            sale_id: saleInsert.data.id as number,
            product_id: selectedProduct.id,
            quantity,
            unit_price_snapshot: price,
            unit_cost_snapshot: getProductCostString(selectedProduct),
            line_total: total,
          });

          if (itemInsert.error) {
            setFeedback(formatSaveError(itemInsert.error.message));
            return;
          }

          setForm(initialForm());
          closeModal();
          setFeedback(
            buildFeedback(
              "Venta registrada",
              `Se guardo ${selectedProduct.nombre} con ${quantity} unidades por ${formatCurrency(Number(total))}.`,
              undefined,
              "success"
            )
          );
          router.refresh();
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Error inesperado no identificado.";
          setFeedback(buildFeedback("Fallo el registro", "No se pudo guardar la venta.", detail));
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
          Registrar venta
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
                  Ingresos
                </p>
                <h2 className="mt-2 font-heading text-[2rem] font-bold tracking-[-0.04em] text-[color:var(--brand-dark)] sm:text-[2.3rem]">
                  Registrar venta
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
                <label className="relative block space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Producto</span>
                  <input
                    value={form.nombre}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => {
                      window.setTimeout(() => setIsNameFocused(false), 120);
                    }}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, nombre: event.target.value }));
                      setPriceSource("product");
                    }}
                    type="text"
                    placeholder="Escribe para buscar un producto"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                    autoComplete="off"
                  />

                  {isNameFocused && normalizeName(form.nombre) && matchedProducts.length > 0 ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 overflow-hidden rounded-[1.2rem] border border-[#eadcd2] bg-white shadow-[0_18px_40px_rgba(22,36,61,0.12)]">
                      {matchedProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handlePickProduct(product)}
                          className="flex w-full items-center justify-between gap-3 border-b border-[#f3e8e0] px-4 py-3 text-left transition last:border-b-0 hover:bg-[#fcf5ef]"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-[color:var(--brand-dark)]">
                              {product.nombre}
                            </span>
                            <span className="mt-1 block text-xs text-[color:var(--brand-mid)]">
                              {product.categoria} | Stock: {product.stock}
                            </span>
                          </span>
                          <span className="text-xs font-semibold text-[color:var(--brand-mid)]">
                            {product.precio_venta == null ? "Sin precio" : formatCurrency(product.precio_venta)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Unidades vendidas</span>
                  <input
                    value={form.unidades}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        unidades: event.target.value.replace(/[^0-9]/g, ""),
                      }));
                    }}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Precio</span>
                  <input
                    value={form.precio}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, precio: event.target.value }));
                      setPriceSource("manual");
                    }}
                    type="text"
                    inputMode="decimal"
                    placeholder={selectedProduct?.precio_venta == null ? "0.00" : "Precio de venta"}
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Total</span>
                  <div className="relative">
                    <input
                      value={form.total}
                      readOnly
                      type="text"
                      placeholder="0.00"
                      className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-[#fcfaf8] px-4 pr-28 text-sm font-semibold text-[color:var(--brand-dark)] outline-none"
                    />
                    {isCalculatingTotal ? (
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-2 text-xs font-semibold text-[color:var(--brand-mid)]">
                        <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-[color:var(--accent)]" />
                        Calculando...
                      </div>
                    ) : null}
                  </div>
                </label>

                <div className="md:col-span-2 rounded-[1.2rem] border border-[#efe3da] bg-[#fcfaf8] px-4 py-3 text-sm text-[color:var(--brand-mid)]">
                  <p className="font-semibold text-[color:var(--brand-dark)]">
                    {selectedProduct ? selectedProduct.nombre : "Selecciona un producto desde las coincidencias"}
                  </p>
                  <p className="mt-1">
                    {selectedProduct
                      ? selectedProduct.precio_venta == null
                        ? "Este producto no tiene precio de venta en /productos, asi que puedes escribirlo manualmente."
                        : `Precio sugerido desde /productos: ${formatCurrency(selectedProduct.precio_venta)}`
                      : "Si no escribes nada, no se mostrara ninguna sugerencia."}
                  </p>
                  <p className="mt-2 text-xs">
                    La venta se guardara directamente con la fecha de hoy.
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
                      Guardar venta
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
