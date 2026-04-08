'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Pedido } from '@/components/Pedidos/types/pedido';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OrderDetailsModal } from '@/components/modals/OrderDetailsModal';

interface Props {
  pedido: Pedido;
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'En diseño':
      return 'bg-blue-100 text-blue-700';
    case 'En producción':
      return 'bg-yellow-100 text-yellow-700';
    case 'Listo para entregar':
      return 'bg-green-100 text-green-700';
    case 'Entregado':
      return 'bg-emerald-600 text-white';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function PedidoCard({ pedido }: Props) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  return (
    <>
      <Card className="p-5 rounded-2xl border border-border bg-white shadow-sm hover:shadow-md transition-all min-h-[180px] flex">
        <div className="flex gap-5 w-full">
          <div className="shrink-0">
            {pedido.imageUrl ? (
              <Image
                src={pedido.imageUrl}
                alt={pedido.title}
                width={180}
                height={140}
                unoptimized
                className="object-cover rounded-xl w-[180px] h-[140px]"
              />
            ) : (
              <div className="w-[180px] h-[140px] rounded-xl bg-gray-100" />
            )}
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold">{pedido.title}</h3>
                <p className="text-sm text-muted-foreground">Pedido #{pedido.id}</p>
              </div>

              <span
                className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusStyles(
                  pedido.status,
                )}`}
              >
                {pedido.status}
              </span>
            </div>

            {pedido.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{pedido.description}</p>
            )}

            <div className="mb-4 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Creado: {new Date(pedido.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <span>Entrega: {new Date(pedido.deliveryDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-xl font-semibold text-primary">${pedido.price.toLocaleString()}</span>

              <Button
                onClick={() => setShowDetailsModal(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Ver Detalles
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <OrderDetailsModal
        orderId={pedido.id}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
  );
}
