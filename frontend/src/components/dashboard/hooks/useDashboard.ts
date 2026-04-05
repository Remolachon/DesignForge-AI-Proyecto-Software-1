'use client';

import { useEffect, useState } from 'react';
import { dashboardService } from '@/components/dashboard/services/dashboard.service';
import { BaseOrder, AdminOrder } from '@/types/order';

type Role = 'cliente' | 'funcionario';

export function useDashboard(role: Role) {
  const [orders, setOrders] = useState<(BaseOrder | AdminOrder)[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    design: 0,
    production: 0,
    ready: 0,
    active: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dashboardService.getDashboardData();
        setOrders(data.orders);
        setStats(data.stats);
      } catch {
        setOrders([]);
        setStats({ total: 0, design: 0, production: 0, ready: 0, active: 0 });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [role]);

  return {
    orders,
    stats,
    loading,
  };
}