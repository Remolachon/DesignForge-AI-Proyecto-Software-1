'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { mockOrdersAdmin, type AdminOrder } from '@/features/Mockordersadmin';
import { getStatusColor } from '@/lib/utils/statusColors';

// ─── Sub-componente: tarjeta de estadística ───────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
}

function StatCard({ label, value, icon, colorClass }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-semibold">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sub-componente: acceso rápido ────────────────────────────────────────────
interface QuickActionCardProps {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

function QuickActionCard({ href, icon, iconBg, title, description }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              {icon}
            </div>
            <div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Sub-componente: fila de pedido urgente ───────────────────────────────────
function UrgentOrderCard({ order }: { order: AdminOrder }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
            <Image
              src={order.imageUrl}
              alt={order.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="font-semibold mb-1">{order.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Cliente: {order.clientName} · Pedido #{order.id}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getStatusColor(order.status)}`}
              >
                {order.status}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
              <span className="text-muted-foreground">
                Entrega:{' '}
                {new Date(order.deliveryDate).toLocaleDateString('es-ES')}
              </span>
              <Link href={`/funcionario/pedidos/${order.id}`}>
                <Button variant="ghost" size="sm">
                  Ver detalles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function FuncionarioDashboard() {
  const urgentOrders = mockOrdersAdmin
    .filter((o) => o.status === 'En producción')
    .slice(0, 3);

  const pendingDesign = mockOrdersAdmin.filter(
    (o) => o.status === 'En diseño',
  ).length;
  const inProduction = mockOrdersAdmin.filter(
    (o) => o.status === 'En producción',
  ).length;
  const readyForDelivery = mockOrdersAdmin.filter(
    (o) => o.status === 'Listo para entrega',
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-primary mb-2">
              Panel de Producción
            </h1>
            <p className="text-muted-foreground">
              Gestiona pedidos y organiza el calendario de producción
            </p>
          </div>
          <Link href="/funcionario/calendario">
            <Button className="w-full sm:w-auto">Ver Calendario</Button>
          </Link>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="En Diseño"
            value={pendingDesign}
            icon={<AlertCircle className="w-6 h-6 text-blue-600" />}
            colorClass="bg-blue-100"
          />
          <StatCard
            label="En Producción"
            value={inProduction}
            icon={<Clock className="w-6 h-6 text-amber-600" />}
            colorClass="bg-amber-100"
          />
          <StatCard
            label="Listos"
            value={readyForDelivery}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            colorClass="bg-green-100"
          />
          <StatCard
            label="Total Pedidos"
            value={mockOrdersAdmin.length}
            icon={<Package className="w-6 h-6 text-purple-600" />}
            colorClass="bg-purple-100"
          />
        </div>

        {/* Accesos rápidos */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickActionCard
              href="/funcionario/pedidos"
              icon={<Package className="w-5 h-5 text-primary" />}
              iconBg="bg-primary/10"
              title="Gestionar Pedidos"
              description="Ver y actualizar estado de pedidos"
            />
            <QuickActionCard
              href="/funcionario/calendario"
              icon={<Clock className="w-5 h-5 text-white" />}
              iconBg="bg-gradient-to-br from-accent to-accent-magenta"
              title="Calendario"
              description="Organizar horarios de producción"
            />
            <QuickActionCard
              href="/funcionario/marketplace"
              icon={<TrendingUp className="w-5 h-5 text-primary" />}
              iconBg="bg-primary/10"
              title="Gestionar Marketplace"
              description="Agregar y editar productos"
            />
          </div>
        </section>

        {/* Pedidos urgentes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pedidos Urgentes</h2>
            <Link href="/funcionario/pedidos">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </div>

          {urgentOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground">
                  No hay pedidos urgentes en este momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {urgentOrders.map((order) => (
                <UrgentOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}