import type { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export type ExpenseRecord = {
  id: number;
  concepto: string;
  tipo: string;
  categoria: string;
  monto_total: number;
  fecha_gasto: string;
  notas: string | null;
  created_at: string;
};

type ExpenseQueryResult = {
  items: ExpenseRecord[];
  totalCount: number;
  tableMissing: boolean;
};

export type ExpensesOverview = {
  totalAmount: number;
  currentMonthAmount: number;
  operationalAmount: number;
  productionAmount: number;
  totalRecords: number;
  tableMissing: boolean;
};

function isMissingRelationError(code?: string | null) {
  return code === "42P01" || code === "42703" || code === "PGRST205";
}

export async function getExpensesPage(
  supabase: SupabaseClient,
  page: number,
  pageSize: number
): Promise<ExpenseQueryResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const response = await supabase
    .from("expenses")
    .select("id, concepto, tipo, categoria, monto_total, fecha_gasto, notas, created_at", {
      count: "exact",
    })
    .order("fecha_gasto", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  const typedResponse = response as PostgrestSingleResponse<ExpenseRecord[]> & {
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

export async function getExpensesOverview(
  supabase: SupabaseClient
): Promise<ExpensesOverview> {
  const response = await supabase
    .from("expenses")
    .select("tipo, monto_total, fecha_gasto");

  const typedResponse = response as PostgrestSingleResponse<
    Array<{
      tipo: string;
      monto_total: number;
      fecha_gasto: string;
    }>
  >;

  if (isMissingRelationError(typedResponse.error?.code)) {
    return {
      totalAmount: 0,
      currentMonthAmount: 0,
      operationalAmount: 0,
      productionAmount: 0,
      totalRecords: 0,
      tableMissing: true,
    };
  }

  if (typedResponse.error) {
    throw typedResponse.error;
  }

  const items = typedResponse.data ?? [];
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  return {
    totalAmount: items.reduce((total, item) => total + item.monto_total, 0),
    currentMonthAmount: items.reduce((total, item) => {
      const expenseDate = new Date(item.fecha_gasto);
      return expenseDate.getUTCFullYear() === currentYear && expenseDate.getUTCMonth() === currentMonth
        ? total + item.monto_total
        : total;
    }, 0),
    operationalAmount: items.reduce((total, item) => {
      return item.tipo === "operativo" ? total + item.monto_total : total;
    }, 0),
    productionAmount: items.reduce((total, item) => {
      return item.tipo === "insumo" || item.tipo === "produccion"
        ? total + item.monto_total
        : total;
    }, 0),
    totalRecords: items.length,
    tableMissing: false,
  };
}
