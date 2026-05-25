'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { UrgentOrderCard } from '@/components/dashboard/UrgentOrderCard';
import { DashboardLoading } from '@/components/dashboard/DashboardLoading';
import { useDashboard } from '@/components/dashboard/hooks/useDashboard';
import { AdminOrder } from '@/types/order';
import {
  Package,
  Clock,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
  Users,
} from 'lucide-react';

export default function FuncionarioAdmDashboard() {
  // Reutiliza exactamente el mismo hook y los mismos datos que el dashboard de funcionario
  const { orders, stats, loading } = useDashboard('funcionario');

  if (loading) {
    return <DashboardLoading role="funcionario" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              Panel de Administración
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Gestiona pedidos, asigna solicitudes pendientes y organiza el equipo de tu empresa
            </p>
          </div>
          <Link href="/funcionario/pedidos-pendientes">
            <Button>Pedidos Pendientes</Button>
          </Link>
        </div>

        {/* ── STATS (mismo bloque que el dashboard funcionario) ── */}
        <div className="grid w-full gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="En Diseño"           value={stats.design}      icon={<AlertCircle />} colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"   />
          <StatCard label="En Producción"        value={stats.production}  icon={<Clock />}       colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"  />
          <StatCard label="Listo para entregar"  value={stats.ready}       icon={<CheckCircle />} colorClass="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"  />
          <StatCard label="Total Pedidos"        value={stats.total}       icon={<Package />}     colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400" />
        </div>

        {/* ── ACCESOS RÁPIDOS (mismo bloque que el dashboard funcionario) ── */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <QuickActionCard
              href="/funcionario/pedidos"
              icon={<Package className="h-5 w-5 text-primary" />}
              iconBg="bg-primary/10"
              title="Gestionar Pedidos"
              description="Actualizar estados"
            />
            <QuickActionCard
              href="/funcionario/marketplace"
              icon={<ShoppingBag className="h-5 w-5 text-primary" />}
              iconBg="bg-primary/10"
              title="Gestionar Marketplace"
              description="Administrar productos"
            />
            <QuickActionCard
              href="/funcionario-adm/ventas"
              icon={<TrendingUp className="h-5 w-5 text-white" />}
              iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
              title="Ventas y Finanzas"
              description="Métricas de tu empresa"
            />
            {/* Acceso rápido exclusivo: navega a gestión de staff */}
            <QuickActionCard
              href="/funcionario-adm/staff"
              icon={<Users className="h-5 w-5 text-white" />}
              iconBg="bg-gradient-to-br from-violet-500 to-purple-700"
              title="Gestión de Staff"
              description="Administrar funcionarios"
            />
          </div>
        </section>

        {/* ── PEDIDOS URGENTES (mismo bloque que el dashboard funcionario) ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pedidos Urgentes</h2>
            <Link href="/funcionario/pedidos">
              <Button variant="ghost" size="sm">Ver todos</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {orders.slice(0, 3).map((order) => (
              <UrgentOrderCard key={order.id} order={order as AdminOrder} />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
