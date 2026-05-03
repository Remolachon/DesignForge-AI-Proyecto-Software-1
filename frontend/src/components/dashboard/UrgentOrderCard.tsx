import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getImageUrl } from '@/lib/supabase/getImageUrl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getStatusColor } from '@/lib/utils/statusColors';
import { AdminOrder } from '@/types/order';

export function UrgentOrderCard({ order }: { order: AdminOrder }) {

  const [imageUrl, setImageUrl] = useState('');
  
    useEffect(() => {
      let cancelled = false;

      if (order.imageUrl) {
        setImageUrl(order.imageUrl);
        return;
      }

      if (!order.image?.bucket || !order.image?.path) {
        setImageUrl('');
        return;
      }

      getImageUrl(order.image.bucket, order.image.path).then((url) => {
        if (cancelled) return;
        if (url) {
          setImageUrl(url);
        } else {
          setImageUrl(''); // fallback
        }
      });

      return () => {
        cancelled = true;
      };
    }, [order.imageUrl, order.image?.bucket, order.image?.path]);

  return (
    <Card className="border-border/60 bg-card/90 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative h-24 w-full overflow-hidden rounded-xl sm:w-24 sm:flex-shrink-0">
            {imageUrl ? (
              <Image src={imageUrl} alt={order.title} fill sizes="(max-width: 640px) 100vw, 96px" unoptimized className="object-cover" />
            ) : (
              <div className="h-full w-full bg-muted/70" />
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="font-semibold tracking-tight text-foreground">{order.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Cliente: {order.clientName}
                </p>
              </div>

              <span
                className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(order.status)}`}
              >
                {order.status}
              </span>
            </div>

            <Link href={`/funcionario/pedidos/${order.id}`}>
              <Button variant="ghost" size="sm" className="px-0 text-primary hover:bg-transparent hover:text-primary/80">
                Ver detalles
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}