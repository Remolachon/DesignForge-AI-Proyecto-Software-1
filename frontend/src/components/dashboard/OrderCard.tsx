import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getImageUrl } from '@/lib/supabase/getImageUrl';
import { Card, CardContent } from '@/components/ui/card';
import { getStatusColor } from '@/lib/utils/statusColors';
import { BaseOrder  } from '@/types/order';

interface OrderCardProps {
  order: BaseOrder ;
}

export function OrderCard({ order }: OrderCardProps) {

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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-24 h-24 rounded-lg overflow-hidden">
            {imageUrl ? (
              <Image src={imageUrl} alt={order.title} fill sizes="(max-width: 640px) 100vw, 96px" unoptimized className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start gap-3 mb-2">
              <div>
                <h3 className="font-semibold">{order.title}</h3>
                <p className="text-sm text-muted-foreground">Pedido #{order.id}</p>
              </div>

              <span
                className={`inline-flex shrink-0 items-center px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getStatusColor(order.status)}`}
              >
                {order.status}
              </span>
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <span>
                Entrega:{' '}
                {new Date(order.deliveryDate).toLocaleDateString('es-ES')}
              </span>
              <span className="font-semibold text-primary">
                ${order.price.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}