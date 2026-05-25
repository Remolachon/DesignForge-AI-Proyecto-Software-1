import { BaseOrder, AdminOrder } from '@/types/order';
import { getApiBaseUrl } from '@/lib/utils/apiBaseUrl';

const API_URL = getApiBaseUrl();

type DashboardRole = 'cliente' | 'funcionario';

type DashboardStats = {
  total: number;
  pending_payment: number;
  design: number;
  production: number;
  ready: number;
  active: number;
};

type DashboardResponse = {
  orders: (BaseOrder | AdminOrder)[];
  stats: DashboardStats;
};

export const dashboardService = {
  async getDashboardData(role: DashboardRole): Promise<DashboardResponse> {
    const token = localStorage.getItem('token');

    if (!token) {
      return {
        orders: [],
        stats: { total: 0, pending_payment: 0, design: 0, production: 0, ready: 0, active: 0 },
      };
    }

    const res = await fetch(`${API_URL}/orders/dashboard`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Dashboard-Role': role,
      },
    });

    if (res.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }

    if (!res.ok) {
      throw new Error('Error cargando dashboard');
    }

    return res.json();
  },
};