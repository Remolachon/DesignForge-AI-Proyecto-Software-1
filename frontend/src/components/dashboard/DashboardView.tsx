'use client';

import Header from '@/components/Header';
import Link from 'next/link';
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
  Clock,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

type Role = 'cliente' | 'funcionario';

export function DashboardView({ role }: { role: Role }) {
  const isCliente = role === 'cliente';

  const { orders, stats, loading } = useDashboard(role);

  if (loading) {
    return <div className="p-8">Cargando dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto p-8 space-y-8">

        {/* HEADER */}
        <div className="flex justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-primary mb-2">
              {isCliente ? 'Bienvenido' : 'Panel de Producción'}
            </h1>
            <p className="text-muted-foreground">
              {isCliente ? 'Gestiona tus pedidos y crea nuevos diseños personalizados' : 'Gestiona pedidos y organiza el calendario de producción'} 
            </p>
          </div>

          {isCliente ? (
            <Link href="/cliente/crear-pedido">
              <Button><Plus /> Crear Pedido</Button>
            </Link>
          ) : (
            <Link href="/funcionario/calendario">
              <Button>Ver Calendario</Button>
            </Link>
          )}
        </div>

        {/* STATS */}
        {isCliente ? (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <StatCard label="Activos" value={stats.active} icon={<Package />} colorClass="bg-blue-100" />
            <StatCard label="Pendientes" value={stats.ready} icon={<Clock />} colorClass="bg-amber-100" />
            <StatCard label="Totales" value={stats.total} icon={<TrendingUp />} colorClass="bg-green-100" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            <StatCard label="En Diseño" value={stats.design} icon={<AlertCircle />} colorClass="bg-blue-100" />
            <StatCard label="En Producción" value={stats.production} icon={<Clock />} colorClass="bg-amber-100" />
            <StatCard label="Listos" value={stats.ready} icon={<CheckCircle />} colorClass="bg-green-100" />
            <StatCard label="Total Pedidos" value={stats.total} icon={<Package />} colorClass="bg-purple-100" />
          </div>
        )}

        {/* ACCESOS RÁPIDOS */}
        <section>
        <h2 className="text-xl font-semibold mb-4">Accesos Rápidos</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isCliente ? (
            <>
                <QuickActionCard
                href="/cliente/crear-pedido"
                icon={<Plus className="w-5 h-5 text-white" />}
                iconBg="bg-gradient-to-br from-accent to-accent-magenta"
                title="Crear Pedido"
                description="Diseña un producto personalizado con IA"
                />

                <QuickActionCard
                href="/marketplace"
                icon={<ShoppingBag className="w-5 h-5 text-primary" />}
                iconBg="bg-primary/10"
                title="Marketplace"
                description="Explora productos listos"
                />

                <QuickActionCard
                href="/cliente/pedidos"
                icon={<Package className="w-5 h-5 text-primary" />}
                iconBg="bg-primary/10"
                title="Mis Pedidos"
                description="Ver historial"
                />
            </>
            ) : (
            <>
                <QuickActionCard
                href="/funcionario/pedidos"
                icon={<Package className="w-5 h-5 text-primary" />}
                iconBg="bg-primary/10"
                title="Gestionar Pedidos"
                description="Actualizar estados"
                />

                <QuickActionCard
                href="/funcionario/calendario"
                icon={<Clock className="w-5 h-5 text-white" />}
                iconBg="bg-gradient-to-br from-accent to-accent-magenta"
                title="Calendario"
                description="Organizar producción"
                />

                <QuickActionCard
                href="/funcionario/marketplace"
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
                iconBg="bg-primary/10"
                title="Gestionar Marketplace"
                description="Administrar productos"
                />
            </>
            )}
        </div>
        </section>

        {/* LISTA */}
        <section>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
            {isCliente ? 'Pedidos Recientes' : 'Pedidos Urgentes'}
            </h2>

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
            )
            )}
        </div>
        </section>
      </main>
    </div>
  );
}