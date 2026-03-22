import type { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export type ProductRecord = {
  id: number;
  nombre: string;
  categoria: string;
  costo_unitario: number;
  precio_venta: number | null;
  stock: number;
  is_active: boolean;
  created_at: string;
};

export type ProductOption = {
  id: number;
  nombre: string;
  categoria: string;
  precio_venta: number | null;
  stock: number;
  is_active: boolean;
};

export type ProductSalesSummary = {
  quantitySold: number;
  totalSales: number;
  soldInvestment: number;
};

export type ProductSalesMap = Record<number, ProductSalesSummary>;

type ProductQueryResult = {
  items: ProductRecord[];
  totalCount: number;
  tableMissing: boolean;
};

export type ProductsOverview = {
  stockTotal: number;
  activeProducts: number;
  investmentTotal: number;
  estimatedMargin: number;
  tableMissing: boolean;
};

export type ProductSalesInsights = {
  byProduct: ProductSalesMap;
  soldInvestmentTotal: number;
  tableMissing: boolean;
};

type SaleItemAggregate = {
  product_id: number | null;
  quantity: number | string | null;
  line_total: number | string | null;
  unit_cost_snapshot: number | string | null;
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

export async function getProductsPage(
  supabase: SupabaseClient,
  page: number,
  pageSize: number
): Promise<ProductQueryResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const response = await supabase
    .from("products")
    .select(
      "id, nombre, categoria, costo_unitario, precio_venta, stock, is_active, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const typedResponse = response as PostgrestSingleResponse<ProductRecord[]> & {
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

export async function getProductsOverview(
  supabase: SupabaseClient
): Promise<ProductsOverview> {
  const response = await supabase
    .from("products")
    .select("stock, is_active, costo_unitario, precio_venta");

  const typedResponse = response as PostgrestSingleResponse<
    Array<{
      stock: number;
      is_active: boolean;
      costo_unitario: number;
      precio_venta: number | null;
    }>
  >;

  if (isMissingRelationError(typedResponse.error?.code)) {
    return {
      stockTotal: 0,
      activeProducts: 0,
      investmentTotal: 0,
      estimatedMargin: 0,
      tableMissing: true,
    };
  }

  if (typedResponse.error) {
    throw typedResponse.error;
  }

  const items = typedResponse.data ?? [];

  return {
    stockTotal: items.reduce((total, item) => total + item.stock, 0),
    activeProducts: items.filter((item) => item.is_active).length,
    investmentTotal: items.reduce(
      (total, item) => total + item.stock * item.costo_unitario,
      0
    ),
    estimatedMargin: items.reduce((total, item) => {
      if (item.precio_venta == null) {
        return total;
      }

      return total + (item.precio_venta - item.costo_unitario) * item.stock;
    }, 0),
    tableMissing: false,
  };
}

export async function getProductSalesInsights(
  supabase: SupabaseClient
): Promise<ProductSalesInsights> {
  const response = await supabase
    .from("sale_items")
    .select("product_id, quantity, line_total, unit_cost_snapshot");

  const typedResponse = response as PostgrestSingleResponse<SaleItemAggregate[]>;

  if (isMissingRelationError(typedResponse.error?.code)) {
    return {
      byProduct: {},
      soldInvestmentTotal: 0,
      tableMissing: true,
    };
  }

  if (typedResponse.error) {
    throw typedResponse.error;
  }

  const byProduct: ProductSalesMap = {};
  let soldInvestmentTotal = 0;

  for (const item of typedResponse.data ?? []) {
    if (item.product_id == null) {
      continue;
    }

    const quantitySold = toNumber(item.quantity);
    const totalSales = toNumber(item.line_total);
    const soldInvestment = quantitySold * toNumber(item.unit_cost_snapshot);

    const current = byProduct[item.product_id] ?? {
      quantitySold: 0,
      totalSales: 0,
      soldInvestment: 0,
    };

    byProduct[item.product_id] = {
      quantitySold: current.quantitySold + quantitySold,
      totalSales: current.totalSales + totalSales,
      soldInvestment: current.soldInvestment + soldInvestment,
    };

    soldInvestmentTotal += soldInvestment;
  }

  return {
    byProduct,
    soldInvestmentTotal,
    tableMissing: false,
  };
}

export async function getAllProductOptions(
  supabase: SupabaseClient
): Promise<{ items: ProductOption[]; tableMissing: boolean }> {
  const response = await supabase
    .from("products")
    .select("id, nombre, categoria, precio_venta, stock, is_active")
    .order("nombre", { ascending: true });

  const typedResponse = response as PostgrestSingleResponse<ProductOption[]>;

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
