'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminOrder, OrderStatus } from '@/types/order';
import { ProductTypeBadge } from './ProductTypeBadge';
import { StatusSelect } from './StatusSelect';
import { type ProductType } from './pedidos-funcionario.types';
import { OrderDetailsModal } from '@/components/modals/OrderDetailsModal';

interface OrdersTableProps {
  orders: AdminOrder[];
  totalItems: number;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

export function OrdersTable({ orders, totalItems, onStatusChange }: OrdersTableProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              {['Pedido', 'Cliente', 'Tipo', 'Estado', 'Entrega', 'Precio', 'Acciones'].map((col) => (
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
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {order.imageUrl && (
                        <Image
                          src={order.imageUrl}
                          alt={order.title}
                          fill
                          sizes="48px"
                          unoptimized
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{order.title}</p>
                      <p className="text-xs text-muted-foreground">#{order.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{order.clientName}</td>
                <td className="px-6 py-4">
                  <ProductTypeBadge type={(order.productType || 'bordado') as ProductType} />
                </td>
                <td className="px-6 py-4">
                  <StatusSelect
                    orderId={order.id}
                    currentStatus={order.status}
                    onChange={onStatusChange}
                  />
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(order.deliveryDate).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4 font-semibold">${order.price.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <Button
                    onClick={() => setSelectedOrderId(order.id)}
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-6 py-3 bg-muted/20">
        <p className="text-xs text-muted-foreground">
          Mostrando <span className="font-semibold text-foreground">{orders.length}</span> de{' '}
          <span className="font-semibold text-foreground">{totalItems}</span> pedidos
        </p>
      </div>

      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          isOpen={true}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </>
  );
}
