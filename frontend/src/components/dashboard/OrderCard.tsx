import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getImageUrl } from '@/lib/supabase/getImageUrl';
import { Card, CardContent } from '@/components/ui/card';
import { getStatusColor } from '@/lib/utils/statusColors';
import { BaseOrder  } from '@/types/order';
import { Eye, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderDetailsModal } from '@/components/modals/OrderDetailsModal';
import { paymentService } from '@/services/payment.service';

interface OrderCardProps {
  order: BaseOrder ;
}

export function OrderCard({ order }: OrderCardProps) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    try {
      setPaying(true);
      
      const payloadRaw = sessionStorage.getItem(`payu_payload_${order.id}`);
      let actionUrl;
      let payload;

      if (payloadRaw) {
        const parsed = JSON.parse(payloadRaw);
        actionUrl = parsed.actionUrl;
        payload = parsed.payload;
      } else {
        const regenerated = await paymentService.generatePaymentUrl(Number(order.id));
        if (regenerated.payment_action_url && regenerated.payment_payload) {
          actionUrl = regenerated.payment_action_url;
          payload = regenerated.payment_payload;
          
          sessionStorage.setItem(`payu_payload_${order.id}`, JSON.stringify({
            actionUrl,
            payload
          }));
        }
      }

      if (!actionUrl || !payload) {
        alert("No encontramos los datos de pago.");
        setPaying(false);
        return;
      }

      paymentService.submitToPayU(actionUrl, payload);
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      alert("Error al procesar el pago");
      setPaying(false);
    }
  };

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
    <>
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
                <p className="text-sm text-muted-foreground">Pedido #{order.id}</p>
              </div>

              <span
                className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(order.status)}`}
              >
                {order.status}
              </span>
            </div>

              <div className="flex justify-between items-center mt-2">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span>
                    Entrega:{' '}
                    {new Date(order.deliveryDate).toLocaleDateString('es-ES')}
                  </span>
                  <span className="font-semibold text-primary">
                    ${order.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  {order.status === 'Pendiente de pago' && (
                    <Button
                      onClick={handlePay}
                      disabled={paying}
                      size="sm"
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CreditCard className="w-4 h-4" />
                      {paying ? "Procesando..." : "Pagar"}
                    </Button>
                  )}
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
          </div>
        </CardContent>
      </Card>

      <OrderDetailsModal
        orderId={order.id}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
  );
}