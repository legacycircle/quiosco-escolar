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
