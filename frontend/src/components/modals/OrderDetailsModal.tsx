'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { funcionarioOrderService, type OrderDetail } from '@/services/funcionario-order.service';
import { ProductService } from '@/services/product.service';
import { getImageUrl } from '@/lib/supabase/getImageUrl';
import { getStatusColor } from '@/lib/utils/statusColors';

type ResolvedMedia = {
  bucket: string;
  path: string;
  mediaKind?: string | null;
  mediaRole?: string | null;
  mimeType?: string | null;
  sortOrder?: number | null;
  url: string | null;
};

function formatValue(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return 'No tiene';
  return String(value);
}

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1 rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{formatValue(value)}</p>
    </div>
  );
}

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
          setError((err as { message?: string })?.message || 'No se pudieron cargar los detalles');
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
        ? [...order.media]
          .sort((a, b) => {
            if (a.mediaRole === 'main') return -1;
            if (b.mediaRole === 'main') return 1;
            return (a.sortOrder || 0) - (b.sortOrder || 0);
          })
          .map((media) => ({ ...media, url: null }))
        : order.image?.bucket && order.image?.path
          ? [{ bucket: order.image.bucket, path: order.image.path, url: null }]
          : [];

    const resolveMedia = async () => {
      let mediaSource = sourceMedia;

      if (mediaSource.length === 0 && order.productId) {
        try {
          const product = await ProductService.getProductById(String(order.productId));
          mediaSource = (product.media || [])
            .sort((a, b) => {
              if (a.media_role === 'main') return -1;
              if (b.media_role === 'main') return 1;
              return (a.sort_order || 0) - (b.sort_order || 0);
            })
            .map((media) => ({
              bucket: media.bucket_name || 'product-catalog',
              path: media.storage_path,
              mediaKind: media.media_kind,
              mediaRole: media.media_role,
              mimeType: media.mime_type,
              sortOrder: media.sort_order,
              url: null,
            }));
        } catch {
          mediaSource = [];
        }
      }

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
        mediaSource.map(async (media) => {
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

  const primaryMedia = resolvedMedia[0] || null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-background text-foreground shadow-2xl">
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
          <div className="py-8 text-center text-red-600">{error}</div>
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
                <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                  {primaryMedia?.url ? (
                    primaryMedia.mediaKind === 'video' || (primaryMedia.mimeType || '').startsWith('video/') ? (
                      <video
                        src={primaryMedia.url}
                        controls
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={primaryMedia.url}
                        alt={order.title}
                        fill
                        unoptimized
                        className="object-cover"
                        priority
                      />
                    )
                  ) : resolvedImageUrl ? (
                    <Image
                      src={resolvedImageUrl}
                      alt={order.title}
                      fill
                      unoptimized
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      Sin vista previa
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Estado</p>
                <span
                  className={`inline-flex items-center px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(order.status)}`}
                >
                  {order.status}
                </span>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Precio</p>
                <p className="text-2xl font-bold text-primary">${order.price.toLocaleString()}</p>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <DetailField label="Cliente" value={order.clientName} />
              <DetailField label="Empresa" value={order.companyName} />
              <DetailField label="Tipo de producto" value={order.productType || 'No tiene'} />
              <DetailField label="Cantidad" value={order.quantity ?? 'No tiene'} />
              <DetailField label="Pedido ID" value={order.id} />
              <DetailField label="Atributos" value={order.attributes?.length ? `${order.attributes.length} configurados` : 'No tiene'} />
            </div>

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

            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Archivos y medios</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <DetailField label="Imagen principal" value={resolvedImageUrl ? 'Disponible' : 'No tiene'} />
                <DetailField label="Medios adjuntos" value={resolvedMedia.length ? `${resolvedMedia.length} archivo(s)` : 'No tiene'} />
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Parámetros del Pedido</h3>
              {order.attributes && order.attributes.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {order.attributes.map((attr) => (
                    <div key={attr.code} className="rounded-xl border border-border bg-background p-3">
                      <p className="text-xs text-muted-foreground">{attr.label}</p>
                      <p className="text-sm font-medium capitalize">{attr.value || 'No tiene'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tiene parámetros adicionales guardados.</p>
              )}
            </Card>

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
