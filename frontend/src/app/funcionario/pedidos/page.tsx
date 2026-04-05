'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Eye } from 'lucide-react';
import { toast } from 'sonner';

import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import {
  mockOrdersAdmin,
  type AdminOrder,
  type OrderStatus,
  type ProductType,
  getProductTypeLabel,
} from '@/features/Mockordersadmin';
import { getStatusColor } from '@/lib/utils/statusColors';

// ─── Tipos locales ────────────────────────────────────────────────────────────
type FilterStatus = OrderStatus | 'all';

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all',                 label: 'Todos' },
  { value: 'En diseño',          label: 'En diseño' },
  { value: 'En producción',      label: 'En producción' },
  { value: 'Listo para entrega', label: 'Listos' },
  { value: 'Entregado',          label: 'Entregados' },
];

const ORDER_STATUSES: OrderStatus[] = [
  'En diseño',
  'En producción',
  'Listo para entrega',
  'Entregado',
];

// ─── Sub-componente: selector de estado ───────────────────────────────────────
interface StatusSelectProps {
  orderId: string;
  currentStatus: OrderStatus;
  onChange: (id: string, newStatus: OrderStatus) => void;
}

function StatusSelect({ orderId, currentStatus, onChange }: StatusSelectProps) {
  return (
    <select
      value={currentStatus}
      onChange={(e) => onChange(orderId, e.target.value as OrderStatus)}
      className={`
        text-xs px-2 py-1.5 rounded-full border font-medium cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-accent transition-colors
        ${getStatusColor(currentStatus)}
      `}
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-white text-gray-900 font-normal">
          {s}
        </option>
      ))}
    </select>
  );
}

// ─── Sub-componente: badge de tipo de producto ────────────────────────────────
function ProductTypeBadge({ type }: { type: ProductType }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
      {getProductTypeLabel(type)}
    </span>
  );
}

// ─── Sub-componente: estado vacío ─────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-muted-foreground text-sm">No se encontraron pedidos</p>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function FuncionarioPedidos() {
  // Estado local de pedidos para reflejar cambios de status sin backend
  const [orders, setOrders] = useState<AdminOrder[]>(mockOrdersAdmin);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Filtrado
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      order.title.toLowerCase().includes(term) ||
      order.clientName.toLowerCase().includes(term) ||
      order.id.includes(searchTerm);
    const matchesFilter =
      filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Actualización optimista del estado del pedido
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    toast.success(`Pedido #${orderId} actualizado a "${newStatus}"`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Encabezado */}
        <div>
          <h1 className="text-3xl font-semibold text-primary mb-2">
            Gestión de Pedidos
          </h1>
          <p className="text-muted-foreground">
            Ver, filtrar y actualizar el estado de todos los pedidos
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Buscador */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, título o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-lg
                             text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                />
              </div>

              {/* Botones de filtro */}
              <div className="flex items-center bg-muted rounded-xl p-1 gap-1 flex-wrap">
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilterStatus(value)}
                    className={`
                      px-3 py-1.5 text-sm rounded-lg transition-all whitespace-nowrap
                      ${filterStatus === value
                        ? 'bg-white shadow-sm text-black font-medium'
                        : 'text-muted-foreground hover:text-black'}
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de pedidos */}
        {filteredOrders.length === 0 ? (
          <Card>
            <EmptyState />
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    {[
                      'Pedido',
                      'Cliente',
                      'Tipo',
                      'Estado',
                      'Entrega',
                      'Precio',
                      'Acciones',
                    ].map((col) => (
                      <th
                        key={col}
                        className={`px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                          col === 'Acciones' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border bg-white">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* Pedido */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={order.imageUrl}
                              alt={order.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-sm leading-tight">
                              {order.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              #{order.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="px-6 py-4 text-sm">{order.clientName}</td>

                      {/* Tipo */}
                      <td className="px-6 py-4">
                        <ProductTypeBadge type={order.productType} />
                      </td>

                      {/* Estado (editable) */}
                      <td className="px-6 py-4">
                        <StatusSelect
                          orderId={order.id}
                          currentStatus={order.status}
                          onChange={handleStatusChange}
                        />
                      </td>

                      {/* Fecha de entrega */}
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(order.deliveryDate).toLocaleDateString('es-ES')}
                      </td>

                      {/* Precio */}
                      <td className="px-6 py-4">
                        <span className="font-semibold">
                          ${order.price.toLocaleString()}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <Link href={`/funcionario/pedidos/${order.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="w-4 h-4" />
                            Ver
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pie de tabla con conteo */}
            <div className="border-t border-border px-6 py-3 bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Mostrando{' '}
                <span className="font-semibold text-foreground">
                  {filteredOrders.length}
                </span>{' '}
                de{' '}
                <span className="font-semibold text-foreground">
                  {orders.length}
                </span>{' '}
                pedidos
              </p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}