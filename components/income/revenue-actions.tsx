"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  divideDecimalStringByInteger,
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

type DraftSale = {
  id: string;
  productId: number;
  nombre: string;
  fechaDisplay: string;
  fechaIso: string;
  precio: string;
  unidades: number;
  total: string;
  totalValue: number;
  unitCost: string;
};

type FormState = {
  nombre: string;
  fecha: string;
  precio: string;
  unidades: string;
  total: string;
};

type CalculationMode = "price" | "total";

type PriceSource = "product" | "manual";

function getTodayShortDate() {
  return formatDateForInput(new Date());
}

function formatDateForInput(value: Date) {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = String(value.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function parseShortDate(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const rawYear = Number(match[3]);
  const year = match[3].length === 2 ? 2000 + rawYear : rawYear;
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function toIsoDate(value: Date) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateInput(value: string) {
  const parsed = parseShortDate(value);
  return parsed ? formatDateForInput(new Date(parsed.getTime())) : value;
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

  return normalizeOptionalDecimalString(String(product.costo_unitario), { scale: 8 }) ?? String(product.costo_unitario);
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

  return buildFeedback("No se pudo guardar", "Supabase devolvio un error al guardar el cierre.", message);
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

function initialForm(date = getTodayShortDate()): FormState {
  return {
    nombre: "",
    fecha: date,
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
  const [draftSales, setDraftSales] = useState<DraftSale[]>([]);
  const [calculationMode, setCalculationMode] = useState<CalculationMode>("price");
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

  const totalUnits = draftSales.reduce((sum, item) => sum + item.unidades, 0);
  const totalAmount = draftSales.reduce((sum, item) => sum + item.totalValue, 0);

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
    if (calculationMode !== "price") {
      setIsCalculatingTotal(false);
      return;
    }

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
  }, [calculationMode, form.precio, form.unidades]);

  useEffect(() => {
    if (calculationMode !== "total") {
      return;
    }

    const quantity = parsePositiveInteger(form.unidades);
    const total = normalizeOptionalDecimalString(form.total);

    if (!quantity || total == null) {
      return;
    }

    const computedPrice = divideDecimalStringByInteger(total, quantity) ?? "";

    setForm((current) => {
      if (current.precio === computedPrice) {
        return current;
      }

      return {
        ...current,
        precio: computedPrice,
      };
    });
  }, [calculationMode, form.total, form.unidades]);

  const openModal = () => {
    setFeedback(null);
    setForm(initialForm());
    setCalculationMode("price");
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
    setCalculationMode("price");
    setIsNameFocused(false);
  };

  const handleAddDraft = () => {
    if (productsTableMissing) {
      setFeedback(
        buildFeedback(
          "Tabla pendiente",
          "La tabla products no existe todavia en Supabase, asi que no se pueden sugerir productos."
        )
      );
      return;
    }

    if (!selectedProduct) {
      setFeedback(
        buildFeedback(
          "Producto obligatorio",
          "Escribe y elige un producto valido desde las coincidencias antes de agregarlo al lote."
        )
      );
      return;
    }

    const parsedDate = parseShortDate(form.fecha);
    const quantity = parsePositiveInteger(form.unidades);
    const total = normalizeOptionalDecimalString(form.total);
    const price = normalizeOptionalDecimalString(form.precio);

    if (!parsedDate) {
      setFeedback(buildFeedback("Fecha invalida", "Usa el formato dd/mm/yy para la fecha de venta."));
      return;
    }

    if (!quantity) {
      setFeedback(buildFeedback("Unidades invalidas", "Las unidades vendidas deben ser enteros positivos."));
      return;
    }

    if (!price) {
      setFeedback(buildFeedback("Precio invalido", "Ingresa un precio por unidad valido."));
      return;
    }

    if (!total) {
      setFeedback(buildFeedback("Total invalido", "Ingresa un total valido para la venta."));
      return;
    }

    const draftSale: DraftSale = {
      id: `${Date.now()}-${selectedProduct.id}`,
      productId: selectedProduct.id,
      nombre: selectedProduct.nombre,
      fechaDisplay: formatDateForInput(new Date(parsedDate.getTime())),
      fechaIso: toIsoDate(parsedDate),
      precio: price,
      unidades: quantity,
      total,
      totalValue: Number(total),
      unitCost: getProductCostString(selectedProduct),
    };

    setDraftSales((current) => [draftSale, ...current]);
    setForm(initialForm(formatDateForInput(new Date(parsedDate.getTime()))));
    setCalculationMode("price");
    setPriceSource("product");
    setIsNameFocused(false);
    setFeedback(
      buildFeedback(
        "Venta agregada",
        `Se agrego ${draftSale.nombre} al lote del cierre con ${draftSale.unidades} unidades.`,
        undefined,
        "success"
      )
    );
    closeModal();
  };

  const handleSaveBatch = () => {
    if (draftSales.length === 0) {
      setFeedback(buildFeedback("Lote vacio", "Agrega al menos una venta antes de guardar el cierre."));
      return;
    }

    startTransition(() => {
      setFeedback(null);

      void (async () => {
        try {
          const groupedByDate = draftSales.reduce<Record<string, DraftSale[]>>((acc, item) => {
            acc[item.fechaIso] = [...(acc[item.fechaIso] ?? []), item];
            return acc;
          }, {});

          const supabase = createSupabaseBrowserClient();

          for (const [saleDate, items] of Object.entries(groupedByDate)) {
            const saleInsert = await supabase
              .from("sales")
              .insert({ sale_date: saleDate })
              .select("id")
              .single();

            if (saleInsert.error || !saleInsert.data) {
              setFeedback(formatSaveError(saleInsert.error?.message ?? "No se pudo crear la cabecera de venta."));
              return;
            }

            const saleId = saleInsert.data.id as number;
            const itemInsert = await supabase.from("sale_items").insert(
              items.map((item) => ({
                sale_id: saleId,
                product_id: item.productId,
                quantity: item.unidades,
                unit_price_snapshot: item.precio,
                unit_cost_snapshot: item.unitCost,
                line_total: item.total,
              }))
            );

            if (itemInsert.error) {
              setFeedback(formatSaveError(itemInsert.error.message));
              return;
            }
          }

          const savedCount = draftSales.length;
          setDraftSales([]);
          setFeedback(
            buildFeedback(
              "Cierre guardado",
              `Se guardaron ${savedCount} lineas de venta en Supabase.`,
              undefined,
              "success"
            )
          );
          router.refresh();
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Error inesperado no identificado.";
          setFeedback(buildFeedback("Fallo el cierre", "No se pudo guardar el lote de ingresos.", detail));
        }
      })();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={openModal}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--brand-dark)] bg-[color:var(--brand-dark)] px-5 text-sm font-semibold text-white transition hover:opacity-92"
        >
          Registrar ventas
        </button>
        <button
          type="button"
          onClick={handleSaveBatch}
          disabled={isPending || draftSales.length === 0}
          aria-busy={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#eadcd2] bg-white px-5 text-sm font-semibold text-[color:var(--brand-dark)] transition hover:border-[#d7c5b7] disabled:cursor-not-allowed disabled:opacity-65"
        >
          Guardar cierre
        </button>
      </div>

      {feedback ? <FeedbackBanner feedback={feedback} /> : null}

      <section className="rounded-[2rem] border border-[#eadcd2] bg-white p-4 shadow-[0_18px_40px_rgba(22,36,61,0.06)] sm:p-5 lg:rounded-[1.8rem]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-mid)]">
              Cierre del dia
            </p>
            <h2 className="mt-2 font-heading text-[1.9rem] font-bold tracking-[-0.04em] text-[color:var(--brand-dark)]">
              Lote en borrador
            </h2>
          </div>
          <p className="text-sm text-[color:var(--brand-mid)]">
            {draftSales.length === 0 ? "Todavia no agregaste ventas" : `${draftSales.length} lineas listas para guardar`}
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="rounded-[1.2rem] border border-[#efe3da] bg-[#fcfaf8] px-4 py-3">
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-mid)]">
              Productos cargados
            </p>
            <p className="mt-2 font-heading text-[2rem] font-bold tracking-[-0.05em] text-[color:var(--brand-dark)]">
              {draftSales.length}
            </p>
          </article>
          <article className="rounded-[1.2rem] border border-[#efe3da] bg-[#fcfaf8] px-4 py-3">
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-mid)]">
              Unidades totales
            </p>
            <p className="mt-2 font-heading text-[2rem] font-bold tracking-[-0.05em] text-[color:var(--brand-dark)]">
              {totalUnits}
            </p>
          </article>
          <article className="rounded-[1.2rem] border border-[#efe3da] bg-[#fcfaf8] px-4 py-3">
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-mid)]">
              Total del lote
            </p>
            <p className="mt-2 font-heading text-[2rem] font-bold tracking-[-0.05em] text-[color:var(--brand-dark)]">
              {formatCurrency(totalAmount)}
            </p>
          </article>
        </div>

        <div className="mt-4 overflow-hidden rounded-[1.2rem] border border-[#eadcd2] bg-[#fffdfa]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="bg-[#f6ede7] text-left text-[0.84rem] font-semibold text-[color:var(--brand-dark)]">
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2 text-right">Fecha</th>
                  <th className="px-4 py-2 text-right">Precio</th>
                  <th className="px-4 py-2 text-right">Unidades</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {draftSales.length === 0 ? (
                  <tr className="border-t border-[#f1e4db] bg-white text-[0.92rem] text-[color:var(--brand-mid)]">
                    <td className="px-4 py-4">
                      Agrega productos desde "Registrar ventas" para armar el cierre del dia.
                    </td>
                    <td className="px-4 py-4 text-right">&nbsp;</td>
                    <td className="px-4 py-4 text-right">&nbsp;</td>
                    <td className="px-4 py-4 text-right">&nbsp;</td>
                    <td className="px-4 py-4 text-right">&nbsp;</td>
                  </tr>
                ) : (
                  draftSales.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-[#f1e4db] bg-white text-[0.92rem] text-[color:var(--brand-dark)]"
                    >
                      <td className="px-4 py-2.5 font-semibold">{item.nombre}</td>
                      <td className="px-4 py-2.5 text-right">{item.fechaDisplay}</td>
                      <td className="px-4 py-2.5 text-right">S/ {item.precio}</td>
                      <td className="px-4 py-2.5 text-right">{item.unidades}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">S/ {item.total}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

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
                  Registrar ventas
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
                  handleAddDraft();
                }}
              >
                <label className="relative block space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Nombre</span>
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
                    placeholder="Escribe un producto"
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
                              {product.categoria} · Stock: {product.stock}
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
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Fecha</span>
                  <input
                    value={form.fecha}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, fecha: event.target.value }))
                    }
                    onBlur={(event) =>
                      setForm((current) => ({
                        ...current,
                        fecha: normalizeDateInput(event.target.value),
                      }))
                    }
                    type="text"
                    inputMode="numeric"
                    placeholder="dd/mm/yy"
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Precio</span>
                  <input
                    value={form.precio}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, precio: event.target.value }));
                      setCalculationMode("price");
                      setPriceSource("manual");
                    }}
                    type="text"
                    inputMode="decimal"
                    placeholder={selectedProduct?.precio_venta == null ? "Sin precio predefinido" : "0.00"}
                    className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
                  />
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
                  <span className="text-sm font-semibold text-[color:var(--brand-dark)]">Total</span>
                  <div className="relative">
                    <input
                      value={form.total}
                      onChange={(event) => {
                        setForm((current) => ({ ...current, total: event.target.value }));
                        setCalculationMode("total");
                        setPriceSource("manual");
                      }}
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      className="h-11 w-full rounded-xl border border-[#e7ddd6] bg-white px-4 pr-28 text-sm text-[color:var(--brand-dark)] outline-none transition placeholder:text-[color:var(--brand-mid)]/60 focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(209,7,84,0.12)]"
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
                      : "Si el campo nombre esta vacio, no se mostrara ninguna sugerencia."}
                  </p>
                  <p className="mt-2 text-xs">
                    Si cambias el total manualmente, recalculamos el precio por unidad dividiendo total entre unidades vendidas.
                  </p>
                </div>

                <div className="md:col-span-2 flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
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
                    Agregar al lote
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}