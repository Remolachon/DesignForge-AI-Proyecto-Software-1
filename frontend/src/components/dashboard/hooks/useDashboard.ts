'use client';

import { useEffect, useState } from 'react';
import { dashboardService } from '@/components/dashboard/services/dashboard.service';
import { BaseOrder, AdminOrder } from '@/types/order';

type Role = 'cliente' | 'funcionario';

export function useDashboard(role: Role) {
  const [orders, setOrders] = useState<(BaseOrder | AdminOrder)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await dashboardService.getOrders(role);
      setOrders(data);
      setLoading(false);
    };

    load();
  }, [role]);

  // 📊 lógica centralizada
  const stats = {
    total: orders.length,
    design: orders.filter((o) => o.status === 'En diseño').length,
    production: orders.filter((o) => o.status === 'En producción').length,
    ready: orders.filter((o) => o.status === 'Listo para entrega').length,
  };

  return {
    orders,
    stats,
    loading,
  };
}