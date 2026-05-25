'use client';

import { useEffect, useState } from 'react';
import { redirectToLogin } from '@/lib/utils/authSession';
import { BaseOrder, AdminOrder } from '@/types/order';
import { dashboardService } from '@/components/dashboard/services/dashboard.service';

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
    let authRetries = 0;
    let requestRetries = 0;

    const emptyStats = { total: 0, pending_payment: 0, design: 0, production: 0, ready: 0, active: 0 };

    const load = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        authRetries += 1;
        if (authRetries <= 8) {
          retryTimer = window.setTimeout(() => {
            void load();
          }, 250);
          return;
        }

        if (!cancelled) {
          setOrders([]);
          setStats(emptyStats);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await dashboardService.getDashboardData(role);
        if (cancelled) return;
        setOrders(data.orders);
        setStats(data.stats);
        requestRetries = 0;
      } catch (error) {
        if (cancelled) return;

        if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
          redirectToLogin(window.location.pathname + window.location.search);
          return;
        }

        if (requestRetries < 1) {
          requestRetries += 1;
          retryTimer = window.setTimeout(() => {
            void load();
          }, 450);
          return;
        }

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
        authRetries = 0;
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