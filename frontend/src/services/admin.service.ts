import axios from "axios";

import { CompanyAdmin } from "@/types/company";
import { AdminOrder } from "@/types/order";
import { getApiBaseUrl } from "@/lib/utils/apiBaseUrl";

const API_URL = getApiBaseUrl();

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  };
}

export interface AdminDashboardStats {
  /** SUM de t.amount de todas las transacciones (todas las empresas, todo el tiempo) */
  total_sales: number;
  /** Ganancia real (unit_price - base_price) * qty para aprobadas; fallback 30% */
  income: number;
  active_companies: number;
  total_users: number;
  pending_companies: number;
  inactive_companies: number;
  /** Campos extendidos del nuevo módulo de ventas */
  total_transacciones?: number;
  transacciones_aprobadas?: number;
  ticket_promedio?: number;
  tasa_aprobacion?: number;
}

export interface AdminDashboardResponse {
  stats: AdminDashboardStats;
  orders: AdminOrder[];
}

export interface AdminOrdersPageResponse {
  items: AdminOrder[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface CompanyCountsResponse {
  total: number;
  pending: number;
  rejected: number;
  active: number;
  inactive: number;
}

export type CompanyStatusAction = "APPROVED" | "REJECTED";

export class AdminService {
  static async getDashboard(): Promise<AdminDashboardResponse> {
    const response = await axios.get(`${API_URL}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });

    return response.data;
  }

  static async getCompanies(filter = "all"): Promise<CompanyAdmin[]> {
    const response = await axios.get(`${API_URL}/companies/admin`, {
      headers: getAuthHeaders(),
      params: { filter },
    });

    return response.data;
  }

  static async getCompanyCounts(): Promise<CompanyCountsResponse> {
    const response = await axios.get(`${API_URL}/companies/admin/counts`, {
      headers: getAuthHeaders(),
    });

    return response.data;
  }

  static async updateCompanyStatus(companyId: number, status: CompanyStatusAction): Promise<CompanyAdmin> {
    const response = await axios.patch(
      `${API_URL}/companies/${companyId}/status`,
      { status },
      { headers: getAuthHeaders() }
    );

    return response.data;
  }

  static async deleteCompany(companyId: number): Promise<CompanyAdmin> {
    const response = await axios.delete(`${API_URL}/companies/${companyId}`, {
      headers: getAuthHeaders(),
    });

    return response.data;
  }

  static async getOrdersPage(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  } = {}): Promise<AdminOrdersPageResponse> {
    const response = await axios.get(`${API_URL}/admin/orders/page`, {
      headers: getAuthHeaders(),
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 10,
        search: params.search || undefined,
        status: params.status || undefined,
      },
    });

    return response.data;
  }
}
