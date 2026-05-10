'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { funcionarioOrderService, type OrderDetail } from '@/services/funcionario-order.service';
import { getImageUrl } from '@/lib/supabase/getImageUrl';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ResolvedMedia = {
  bucket: string;
  path: string;
  mediaKind?: string | null;
  mediaRole?: string | null;
  mimeType?: string | null;
  sortOrder?: number | null;
  url: string | null;
};

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
  const [resolvedMedia, setResolvedMedia] = useState<ResolvedMedia[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadOrder = async () => {
      setLoading(true);
      setError(null);
      setResolvedImageUrl(null);
      setResolvedMedia([]);

      try {
        const data = await funcionarioOrderService.getOrderDetail(orderId);

        if (!cancelled) {
          setOrder(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as { message?: string })?.message || 'Error al cargar los detalles');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [isOpen, orderId]);

  useEffect(() => {
    if (!order || !isOpen) return;

    let cancelled = false;

    const sourceMedia: ResolvedMedia[] =
      order.media && order.media.length > 0
        ? order.media.map((media) => ({ ...media, url: null }))
        : order.image?.bucket && order.image?.path
          ? [{ bucket: order.image.bucket, path: order.image.path, url: null }]
          : [];

    const resolveMedia = async () => {
      if (order.imageUrl) {
        setResolvedImageUrl(order.imageUrl);
      } else if (order.image?.bucket && order.image?.path) {
        try {
          const url = await getImageUrl(order.image.bucket, order.image.path);
          if (!cancelled) setResolvedImageUrl(url || null);
        } catch {
          if (!cancelled) setResolvedImageUrl(null);
        }
      } else {
        setResolvedImageUrl(null);
      }

      const resolved = await Promise.all(
        sourceMedia.map(async (media) => {
          try {
            const url = await getImageUrl(media.bucket, media.path);
            return { ...media, url: url || null };
          } catch {
            return { ...media, url: null };
          }
        }),
      );

      if (!cancelled) {
        setResolvedMedia(resolved);
      }
    };

    void resolveMedia();

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
            {(resolvedMedia.length > 0 || resolvedImageUrl) && (
              <div className="space-y-3">
                <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {resolvedMedia.length > 0 ? (
                    <>
                      {resolvedMedia[currentMediaIndex]?.url ? (
                        resolvedMedia[currentMediaIndex].mediaKind === 'video' || (resolvedMedia[currentMediaIndex].mimeType || '').startsWith('video/') ? (
                          <video
                            src={resolvedMedia[currentMediaIndex].url}
                            controls
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Image
                            src={resolvedMedia[currentMediaIndex].url}
                            alt={order.title}
                            fill
                            unoptimized
                            className="object-cover"
                            priority
                          />
                        )
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                          Sin vista previa
                        </div>
                      )}
                      
                      {resolvedMedia.length > 1 && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 p-0 gap-0"
                            onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + resolvedMedia.length) % resolvedMedia.length)}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 p-0 gap-0"
                            onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % resolvedMedia.length)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1">
                            <span className="text-xs text-white font-medium">
                              {currentMediaIndex + 1} / {resolvedMedia.length}
                            </span>
                          </div>
                        </>
                      )}
                    </>
                  ) : resolvedImageUrl ? (
                    <Image
                      src={resolvedImageUrl}
                      alt={order.title}
                      fill
                      unoptimized
                      className="object-cover"
                      priority
                    />
                  ) : null}
                </div>

                {resolvedMedia.length > 1 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {resolvedMedia.map((media, index) => (
                      <button
                        key={`${media.bucket}/${media.path}-${index}`}
                        onClick={() => setCurrentMediaIndex(index)}
                        className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                          currentMediaIndex === index ? 'border-primary' : 'border-border/60'
                        } bg-muted/30`}
                      >
                        {media.url ? (
                          media.mediaKind === 'video' || (media.mimeType || '').startsWith('video/') ? (
                            <>
                              <video src={media.url} className="h-full w-full object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                  <div className="w-0 h-0 border-l-3 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <Image
                              src={media.url}
                              alt={`${order.title} thumbnail ${index + 1}`}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          )
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                            Sin vista
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
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

            {order.companyName && (
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Empresa</p>
                <p className="text-sm font-medium">{order.companyName}</p>
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
