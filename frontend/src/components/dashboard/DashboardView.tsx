'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { StatCard } from './StatCard';
import { QuickActionCard } from './QuickActionCard';
import { OrderCard } from '@/components/dashboard/OrderCard';
import { UrgentOrderCard } from './UrgentOrderCard';
import { BaseOrder, AdminOrder } from '@/types/order';
import { useDashboard } from '@/components/dashboard/hooks/useDashboard';
import {
  Plus,
  Package,
  Store,
  Clock,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { DashboardLoading } from './DashboardLoading';

type Role = 'cliente' | 'funcionario';

export function DashboardView({ role }: { role: Role }) {
  const isCliente = role === 'cliente';
  const [globalRole, setGlobalRole] = useState<string | null>(null);

  useEffect(() => {
    setGlobalRole(localStorage.getItem('role'));
  }, []);

  const hasCompany =
    globalRole === 'funcionario' || globalRole === 'administrador' || globalRole === 'funcionario_adm';

  const { orders, stats, loading } = useDashboard(role);

  if (loading) {
    return <DashboardLoading role={role} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              {isCliente ? 'Bienvenido' : 'Panel de Producción'}
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              {isCliente
                ? 'Gestiona tus pedidos y crea nuevos diseños personalizados'
                : 'Gestiona pedidos, asigna solicitudes pendientes y organiza la producción'}
            </p>
          </div>

          {isCliente ? (
            <Link href="/cliente/crear-pedido">
              <Button>
                <Plus /> Crear Pedido
              </Button>
            </Link>
          ) : (
            <Link href="/funcionario/calendario">
              <Button>Ver calendario</Button>
            </Link>
          )}
        </div>

        <section className="rounded-3xl border border-border/60 bg-card/90 p-5 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:p-6">
          {isCliente ? (
            <div className="grid w-full gap-6 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Pendientes de pago"
                value={stats.pending_payment}
                icon={<Clock />}
                colorClass="bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
              />
              <StatCard
                label="Activos"
                value={stats.active}
                icon={<Package />}
                colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
              />
              <StatCard
                label="Pendientes de entrega"
                value={stats.ready}
                icon={<CheckCircle />}
                colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
              />
              <StatCard
                label="Totales"
                value={stats.total}
                icon={<TrendingUp />}
                colorClass="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
              />
            </div>
          ) : (
            <div className="grid w-full gap-6 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="En Diseño"
                value={stats.design}
                icon={<AlertCircle />}
                colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
              />
              <StatCard
                label="En Producción"
                value={stats.production}
                icon={<Clock />}
                colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
              />
              <StatCard
                label="Listo para entregar"
                value={stats.ready}
                icon={<CheckCircle />}
                colorClass="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
              />
              <StatCard
                label="Total Pedidos"
                value={stats.total}
                icon={<Package />}
                colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
              />
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border/60 bg-card/90 p-5 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:p-6">
          <h2 className="mb-4 text-xl font-semibold">Accesos Rápidos</h2>

          <div className={`grid w-full grid-cols-1 gap-4 sm:grid-cols-2 ${isCliente ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
            {isCliente ? (
              <>
                <QuickActionCard
                  href="/cliente/crear-pedido"
                  icon={<Plus className="h-5 w-5 text-primary" />}
                  iconBg="bg-primary/10"
                  title="Crear Pedido"
                  description="Diseña un producto personalizado con IA"
                />

                <QuickActionCard
                  href="/marketplace"
                  icon={<ShoppingBag className="h-5 w-5 text-primary" />}
                  iconBg="bg-primary/10"
                  title="Marketplace"
                  description="Explora productos listos"
                />

                <QuickActionCard
                  href="/cliente/pedidos"
                  icon={<Package className="h-5 w-5 text-primary" />}
                  iconBg="bg-primary/10"
                  title="Mis Pedidos"
                  description="Ver historial"
                />

                {!hasCompany && (
                  <QuickActionCard
                    href="/crear-empresa"
                    icon={<Store className="h-5 w-5 text-primary" />}
                    iconBg="bg-primary/10"
                    title="Vende tus productos"
                    description="Registra tu empresa y empieza a vender"
                  />
                )}
              </>
            ) : (
              <>
                <QuickActionCard
                  href="/funcionario/pedidos"
                  icon={<Package className="h-5 w-5 text-primary" />}
                  iconBg="bg-primary/10"
                  title="Gestionar Pedidos"
                  description="Actualizar estados"
                />

                <QuickActionCard
                  href="/funcionario/pedidos-pendientes"
                  icon={<Clock className="h-5 w-5 text-primary" />}
                  iconBg="bg-primary/10"
                  title="Pedidos Pendientes"
                  description="Asignar pedidos personalizados"
                />

                <QuickActionCard
                  href="/funcionario/marketplace"
                  icon={<ShoppingBag className="h-5 w-5 text-primary" />}
                  iconBg="bg-primary/10"
                  title="Gestionar Marketplace"
                  description="Administrar productos"
                />
              </>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-border/60 bg-card/90 p-5 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{isCliente ? 'Pedidos Recientes' : 'Pedidos Urgentes'}</h2>

            <Link href={isCliente ? '/cliente/pedidos' : '/funcionario/pedidos'}>
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {orders.slice(0, 3).map((order) =>
              isCliente ? (
                <OrderCard key={order.id} order={order as BaseOrder} />
              ) : (
                <UrgentOrderCard key={order.id} order={order as AdminOrder} />
              ),
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
