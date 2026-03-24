import type { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export type PreparedFoodRecord = {
  id: number;
  nombre: string;
  categoria: string;
  costo_produccion: number | null;
  precio_venta: number;
  fecha_preparacion: string;
  created_at: string;
};

export type PreparedFoodOption = {
  id: number;
  nombre: string;
  categoria: string;
  costo_produccion: number | null;
  precio_venta: number;
  fecha_preparacion: string;
};

export type PreparedFoodSalesSummary = {
  quantitySold: number;
  totalRevenue: number;
};

export type PreparedFoodSalesMap = Record<number, PreparedFoodSalesSummary>;

type PreparedFoodsQueryResult = {
  items: PreparedFoodRecord[];
  totalCount: number;
  tableMissing: boolean;
};

export type PreparedFoodsOverview = {
  totalRecords: number;
  todayRecords: number;
  withCostCount: number;
  withoutCostCount: number;
  averageSalePrice: number;
  tableMissing: boolean;
};

export type PreparedFoodSalesInsights = {
  byFood: PreparedFoodSalesMap;
  totalUnitsSold: number;
  totalRevenue: number;
  tableMissing: boolean;
};

type SaleItemAggregate = {
  prepared_food_id: number | null;
  quantity: number | string | null;
  line_total: number | string | null;
};

function isMissingRelationError(code?: string | null) {
  return code === "42P01" || code === "42703" || code === "PGRST205";
}

function getTodayDateString() {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export async function getPreparedFoodsPage(
  supabase: SupabaseClient,
  page: number,
  pageSize: number
): Promise<PreparedFoodsQueryResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const response = await supabase
    .from("prepared_foods")
    .select(
      "id, nombre, categoria, costo_produccion, precio_venta, fecha_preparacion, created_at",
      {
        count: "exact",
      }
    )
    .order("fecha_preparacion", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  const typedResponse = response as PostgrestSingleResponse<PreparedFoodRecord[]> & {
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

  return {
    items: typedResponse.data ?? [],
    totalCount: typedResponse.count ?? 0,
    tableMissing: false,
  };
}

export async function getPreparedFoodsOverview(
  supabase: SupabaseClient
): Promise<PreparedFoodsOverview> {
  const response = await supabase
    .from("prepared_foods")
    .select("costo_produccion, precio_venta, fecha_preparacion");

  const typedResponse = response as PostgrestSingleResponse<
    Array<{
      costo_produccion: number | null;
      precio_venta: number;
      fecha_preparacion: string;
    }>
  >;

  if (isMissingRelationError(typedResponse.error?.code)) {
    return {
      totalRecords: 0,
      todayRecords: 0,
      withCostCount: 0,
      withoutCostCount: 0,
      averageSalePrice: 0,
      tableMissing: true,
    };
  }

  if (typedResponse.error) {
    throw typedResponse.error;
  }

  const items = typedResponse.data ?? [];
  const today = getTodayDateString();

  return {
    totalRecords: items.length,
    todayRecords: items.filter((item) => item.fecha_preparacion === today).length,
    withCostCount: items.filter((item) => item.costo_produccion != null).length,
    withoutCostCount: items.filter((item) => item.costo_produccion == null).length,
    averageSalePrice:
      items.length > 0
        ? items.reduce((total, item) => total + item.precio_venta, 0) / items.length
        : 0,
    tableMissing: false,
  };
}

export async function getPreparedFoodOptions(
  supabase: SupabaseClient
): Promise<{ items: PreparedFoodOption[]; tableMissing: boolean }> {
  const response = await supabase
    .from("prepared_foods")
    .select("id, nombre, categoria, costo_produccion, precio_venta, fecha_preparacion")
    .order("fecha_preparacion", { ascending: false })
    .order("nombre", { ascending: true });

  const typedResponse = response as PostgrestSingleResponse<PreparedFoodOption[]>;

  if (isMissingRelationError(typedResponse.error?.code)) {
    return {
      items: [],
      tableMissing: true,
    };
  }

  if (typedResponse.error) {
    throw typedResponse.error;
  }

  return {
    items: typedResponse.data ?? [],
    tableMissing: false,
  };
}

export async function getPreparedFoodSalesInsights(
  supabase: SupabaseClient
): Promise<PreparedFoodSalesInsights> {
  const response = await supabase
    .from("sale_items")
    .select("prepared_food_id, quantity, line_total")
    .not("prepared_food_id", "is", null);

  const typedResponse = response as PostgrestSingleResponse<SaleItemAggregate[]>;

  if (isMissingRelationError(typedResponse.error?.code)) {
    return {
      byFood: {},
      totalUnitsSold: 0,
      totalRevenue: 0,
      tableMissing: true,
    };
  }

  if (typedResponse.error) {
    throw typedResponse.error;
  }

  const byFood: PreparedFoodSalesMap = {};
  let totalUnitsSold = 0;
  let totalRevenue = 0;

  for (const item of typedResponse.data ?? []) {
    if (item.prepared_food_id == null) {
      continue;
    }

    const quantitySold = toNumber(item.quantity);
    const revenue = toNumber(item.line_total);
    const current = byFood[item.prepared_food_id] ?? {
      quantitySold: 0,
      totalRevenue: 0,
    };

    byFood[item.prepared_food_id] = {
      quantitySold: current.quantitySold + quantitySold,
      totalRevenue: current.totalRevenue + revenue,
    };

    totalUnitsSold += quantitySold;
    totalRevenue += revenue;
  }

  return {
    byFood,
    totalUnitsSold,
    totalRevenue,
    tableMissing: false,
  };
}
