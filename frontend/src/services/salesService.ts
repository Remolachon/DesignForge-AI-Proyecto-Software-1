import axios from "axios";
import { getApiBaseUrl } from "@/lib/utils/apiBaseUrl";

const API_URL = getApiBaseUrl();

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  };
}

// ─── TypeScript Types ───────────────────────────────────────────────────────

export type TimeFilter = "day" | "week" | "month" | "year";

export interface SalesSummary {
  total_ventas: number;
  total_ganancias: number;
  total_transacciones: number;
  transacciones_aprobadas: number;
  ticket_promedio: number;
  tasa_aprobacion: number;
}

export interface ChartDataPoint {
  label: string;
  ventas: number;
  ganancias: number;
  transacciones: number;
}

export interface SalesChart {
  filter: TimeFilter;
  data: ChartDataPoint[];
}

export interface TransactionItem {
  id: number;
  order_id: number;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: string;
  payment_method: string;
  transaction_date: string | null;
  approved_at: string | null;
  payu_reference: string | null;
  items_count: number;
}

export interface TransactionsList {
  total: number;
  items: TransactionItem[];
}

// ─── Service Functions ───────────────────────────────────────────────────────

export async function fetchSalesSummary(filter: TimeFilter): Promise<SalesSummary> {
  const response = await axios.get(`${API_URL}/admin/sales/summary`, {
    headers: getAuthHeaders(),
    params: { filter },
  });
  return response.data;
}

export async function fetchSalesChart(filter: TimeFilter): Promise<SalesChart> {
  const response = await axios.get(`${API_URL}/admin/sales/chart`, {
    headers: getAuthHeaders(),
    params: { filter },
  });
  return response.data;
}

export async function fetchTransactions(params: {
  filter: TimeFilter;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<TransactionsList> {
  const response = await axios.get(`${API_URL}/admin/sales/transactions`, {
    headers: getAuthHeaders(),
    params: {
      filter: params.filter,
      status: params.status || undefined,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  });
  return response.data;
}

// ─── Funcionario: mismos tipos, endpoints /funcionario/sales/* ────────────────

export async function fetchCompanySalesSummary(filter: TimeFilter): Promise<SalesSummary> {
  const response = await axios.get(`${API_URL}/funcionario/sales/summary`, {
    headers: getAuthHeaders(),
    params: { filter },
  });
  return response.data;
}

export async function fetchCompanySalesChart(filter: TimeFilter): Promise<SalesChart> {
  const response = await axios.get(`${API_URL}/funcionario/sales/chart`, {
    headers: getAuthHeaders(),
    params: { filter },
  });
  return response.data;
}

export async function fetchCompanyTransactions(params: {
  filter: TimeFilter;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<TransactionsList> {
  const response = await axios.get(`${API_URL}/funcionario/sales/transactions`, {
    headers: getAuthHeaders(),
    params: {
      filter: params.filter,
      status: params.status || undefined,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  });
  return response.data;
}
