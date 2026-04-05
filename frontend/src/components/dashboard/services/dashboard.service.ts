import { BaseOrder, AdminOrder } from '@/types/order';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type DashboardStats = {
  total: number;
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
  async getDashboardData(): Promise<DashboardResponse> {
    const token = localStorage.getItem('token');

    if (!token) {
      return {
        orders: [],
        stats: { total: 0, design: 0, production: 0, ready: 0, active: 0 },
      };
    }

    const res = await fetch(`${API_URL}/orders/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Error cargando dashboard');
    }

    return res.json();
  },
};