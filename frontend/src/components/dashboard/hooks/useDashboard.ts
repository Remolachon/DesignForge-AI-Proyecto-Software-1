'use client';

import { useEffect, useState } from 'react';
import { dashboardService } from '@/components/dashboard/services/dashboard.service';
import { BaseOrder, AdminOrder } from '@/types/order';

type Role = 'cliente' | 'funcionario';

export function useDashboard(role: Role) {
  const [orders, setOrders] = useState<(BaseOrder | AdminOrder)[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending_payment: 0,
    design: 0,
    production: 0,
    ready: 0,
    active: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;

    const emptyStats = { total: 0, pending_payment: 0, design: 0, production: 0, ready: 0, active: 0 };

    const load = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        retryTimer = window.setTimeout(() => {
          void load();
        }, 250);
        return;
      }

      try {
        const data = await dashboardService.getDashboardData();
        if (cancelled) return;
        setOrders(data.orders);
        setStats(data.stats);
      } catch {
        if (cancelled) return;
        setOrders([]);
        setStats(emptyStats);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    const handleStorage = () => {
      if (!cancelled) {
        setLoading(true);
        void load();
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      cancelled = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, [role]);

  return {
    orders,
    stats,
    loading,
  };
}