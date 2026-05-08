import axios from "axios";

import { CompanyAdmin } from "@/types/company";
import { AdminOrder } from "@/types/order";

const API_URL = "http://localhost:8000";

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  };
}

export interface AdminDashboardStats {
  total_sales: number;
  active_companies: number;
  total_users: number;
  income: number;
  pending_companies: number;
  inactive_companies: number;
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
    const response = await axios.put(
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
