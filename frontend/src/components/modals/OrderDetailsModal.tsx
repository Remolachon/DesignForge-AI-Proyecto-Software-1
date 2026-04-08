'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { funcionarioOrderService, type OrderDetail } from '@/services/funcionario-order.service';
import { getImageUrl } from '@/lib/supabase/getImageUrl';

interface OrderDetailsModalProps {
  orderId: string | number;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailsModal({ orderId, isOpen, onClose }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);
    setResolvedImageUrl(null);

    funcionarioOrderService
      .getOrderDetail(orderId)
      .then((data) => {
        setOrder(data);
      })
      .catch((err) => {
        setError(err?.message || 'Error al cargar los detalles');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, orderId]);

  useEffect(() => {
    if (!order || !isOpen) return;

    if (order.imageUrl) {
      setResolvedImageUrl(order.imageUrl);
      return;
    }

    if (!order.image?.bucket || !order.image?.path) {
      setResolvedImageUrl(null);
      return;
    }

    let cancelled = false;
    getImageUrl(order.image.bucket, order.image.path)
      .then((url) => {
        if (!cancelled) setResolvedImageUrl(url || null);
      })
      .catch(() => {
        if (!cancelled) setResolvedImageUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [order, isOpen]);

  const getStatusColor = (status: string) => {
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Accesibilidad: Radix requiere título y descripción siempre presentes */}
        <DialogTitle className="sr-only">
          {order ? `Detalle del pedido ${order.title}` : 'Detalle del pedido'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Modal con información detallada del pedido, estado, fechas, producto y parámetros.
        </DialogDescription>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : order ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold">{order.title}</h2>
              <p className="text-sm text-muted-foreground">ID: {order.id}</p>
            </div>

            {/* Imagen */}
            {resolvedImageUrl && (
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={resolvedImageUrl}
                  alt={order.title}
                  fill
                  unoptimized
                  className="object-cover"
                  priority
                  onError={(e) => {
                    // Fallback si la imagen falla
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Estado y Precio */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Estado</p>
                <span
                  className={`inline-flex items-center px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(
                    order.status,
                  )}`}
                >
                  {order.status}
                </span>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Precio</p>
                <p className="text-2xl font-bold text-primary">${order.price.toLocaleString()}</p>
              </Card>
            </div>

            {/* Fechas */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Fechas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Creado</p>
                  <p className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entrega</p>
                  <p className="text-sm font-medium">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>

            {/* Información del Producto */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Información del Producto</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="text-sm font-medium capitalize">{order.productType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cantidad</p>
                  <p className="text-sm font-medium">{order.quantity}</p>
                </div>
              </div>
            </Card>

            {/* Parámetros del Pedido */}
            {order.parameters && (
              <Card className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">Parámetros del Pedido</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Largo (cm)</p>
                    <p className="text-sm font-medium">{order.parameters.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ancho (cm)</p>
                    <p className="text-sm font-medium">{order.parameters.width}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Alto (cm)</p>
                    <p className="text-sm font-medium">{order.parameters.height}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Material</p>
                    <p className="text-sm font-medium capitalize">{order.parameters.material}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Cliente (solo para funcionario) */}
            {order.clientName && (
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Cliente</p>
                <p className="text-sm font-medium">{order.clientName}</p>
              </Card>
            )}

            {/* Botón de cierre */}
            <Button onClick={onClose} className="w-full" variant="outline">
              Cerrar
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
