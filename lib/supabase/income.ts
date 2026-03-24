import type { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export type IncomeItemType = "producto" | "alimento";

export type IncomeLineRecord = {
  id: number;
  itemName: string;
  itemType: IncomeItemType;
  saleDate: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  createdAt: string;
};

type IncomeQueryResult = {
  items: IncomeLineRecord[];
  totalCount: number;
  tableMissing: boolean;
};

export type IncomeOverview = {
  totalSales: number;
  currentMonthSales: number;
  itemsSold: number;
  lineCount: number;
  tableMissing: boolean;
};

type SaleItemRow = {
  id: number;
  quantity: number | string | null;
  unit_price_snapshot: number | string | null;
  line_total: number | string | null;
  created_at: string;
  sales: { sale_date: string } | { sale_date: string }[] | null;
  products: { nombre: string } | { nombre: string }[] | null;
  prepared_foods: { nombre: string } | { nombre: string }[] | null;
};

function isMissingRelationError(code?: string | null) {
  return code === "42P01" || code === "42703" || code === "PGRST205";
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getIncomePage(
  supabase: SupabaseClient,
  page: number,
  pageSize: number
): Promise<IncomeQueryResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const response = await supabase
    .from("sale_items")
    .select(
      "id, quantity, unit_price_snapshot, line_total, created_at, sales!inner(sale_date), products(nombre), prepared_foods(nombre)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const typedResponse = response as PostgrestSingleResponse<SaleItemRow[]> & {
    count: number | null;
  };

  if (isMissingRelationError(typedResponse.error?.code)) {
    return {
      items: [],
      totalCount: 0,
      tableMissing: true,
    };
  }

  if (typedResponse.error) {
    throw typedResponse.error;
  }

  const items = (typedResponse.data ?? []).map((item) => {
    const sale = unwrapRelation(item.sales);
    const product = unwrapRelation(item.products);
    const preparedFood = unwrapRelation(item.prepared_foods);
    const resolvedType: IncomeItemType = preparedFood ? "alimento" : "producto";
    const resolvedName = preparedFood?.nombre ?? product?.nombre ?? "Item";

    return {
      id: item.id,
      itemName: resolvedName,
      itemType: resolvedType,
      saleDate: sale?.sale_date ?? "",
      unitPrice: toNumber(item.unit_price_snapshot),
      quantity: toNumber(item.quantity),
      lineTotal: toNumber(item.line_total),
      createdAt: item.created_at,
    } satisfies IncomeLineRecord;
  });

  return {
    items,
    totalCount: typedResponse.count ?? 0,
    tableMissing: false,
  };
}

export async function getIncomeOverview(
  supabase: SupabaseClient
): Promise<IncomeOverview> {
  const response = await supabase
    .from("sale_items")
    .select("quantity, line_total, sales!inner(sale_date)");

  const typedResponse = response as PostgrestSingleResponse<
    Array<{
      quantity: number | string | null;
      line_total: number | string | null;
      sales: { sale_date: string } | { sale_date: string }[] | null;
    }>
  >;

  if (isMissingRelationError(typedResponse.error?.code)) {
    return {
      totalSales: 0,
      currentMonthSales: 0,
      itemsSold: 0,
      lineCount: 0,
      tableMissing: true,
    };
  }

  if (typedResponse.error) {
    throw typedResponse.error;
  }

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const items = typedResponse.data ?? [];

  return {
    totalSales: items.reduce((sum, item) => sum + toNumber(item.line_total), 0),
    currentMonthSales: items.reduce((sum, item) => {
      const sale = unwrapRelation(item.sales);

      if (!sale?.sale_date) {
        return sum;
      }

      const saleDate = new Date(sale.sale_date);
      return saleDate.getUTCFullYear() === currentYear && saleDate.getUTCMonth() === currentMonth
        ? sum + toNumber(item.line_total)
        : sum;
    }, 0),
    itemsSold: items.reduce((sum, item) => sum + toNumber(item.quantity), 0),
    lineCount: items.length,
    tableMissing: false,
  };
}
