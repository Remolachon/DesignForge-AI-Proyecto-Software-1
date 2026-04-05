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
      if (order.imageUrl) {
        setImageUrl(order.imageUrl);
        return;
      }

      if (!order.image?.bucket || !order.image?.path) {
        setImageUrl('');
        return;
      }

      getImageUrl(order.image.bucket, order.image.path).then((url) => {
        if (url) {
          setImageUrl(url);
        } else {
          setImageUrl(''); // fallback
        }
      });
    }, [order]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-24 h-24 rounded-lg overflow-hidden">
            {imageUrl ? (
              <Image src={imageUrl} alt={order.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <div>
                <h3 className="font-semibold">{order.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Cliente: {order.clientName}
                </p>
              </div>

              <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            <Link href={`/funcionario/pedidos/${order.id}`}>
              <Button variant="ghost" size="sm">
                Ver detalles
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}