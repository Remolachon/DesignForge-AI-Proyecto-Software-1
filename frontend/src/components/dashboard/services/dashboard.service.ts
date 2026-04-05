import { BaseOrder, AdminOrder } from '@/types/order';
import { mockPedidos } from '@/features/mockPedidos';
import { mockOrdersAdmin } from '@/features/Mockordersadmin';

const USE_MOCK = true;

export const dashboardService = {
  async getOrders(role: 'cliente' | 'funcionario'): Promise<(BaseOrder | AdminOrder)[]> {
    if (USE_MOCK) {
      return role === 'cliente' ? mockPedidos : mockOrdersAdmin;
    }

    // 🔥 FUTURO: backend Python
    const res = await fetch(`/api/orders?role=${role}`);
    return res.json();
  },
};