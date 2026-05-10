"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { paymentService } from "@/services/payment.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type OrderDetail = {
  id: string;
  title: string;
  status: string;
  price: number;
  createdAt: string;
  imageUrl?: string | null;
};

type StoredPayload = {
  actionUrl: string;
  payload: Record<string, string>;
};

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export default function PaymentCheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [storedPayload, setStoredPayload] = useState<StoredPayload | null>(null);

  const orderNumber = useMemo(() => Number(orderId), [orderId]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        if (!orderId || Number.isNaN(orderNumber)) {
          setError("No se encontró la orden para checkout.");
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          localStorage.setItem("redirect_after_login", `/pagos/checkout?orderId=${orderId}`);
          router.push("/login");
          return;
        }

        const payloadRaw = sessionStorage.getItem(`payu_payload_${orderNumber}`);
        if (payloadRaw) {
          const parsed = JSON.parse(payloadRaw) as StoredPayload;
          setStoredPayload(parsed);
        } else {
          const regenerated = await paymentService.generatePaymentUrl(orderNumber);
          if (regenerated.payment_action_url && regenerated.payment_payload) {
            const fallbackPayload: StoredPayload = {
              actionUrl: regenerated.payment_action_url,
              payload: regenerated.payment_payload,
            };
            sessionStorage.setItem(`payu_payload_${orderNumber}`, JSON.stringify(fallbackPayload));
            setStoredPayload(fallbackPayload);
          }
        }

        const response = await fetch(`${API_URL}/orders/${orderNumber}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user_name");
          localStorage.removeItem("role");
          localStorage.setItem("redirect_after_login", `/pagos/checkout?orderId=${orderId}`);
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("No pudimos cargar el detalle de tu orden.");
        }

        const detail = await response.json();
        setOrder({
          id: detail.id,
          title: detail.title,
          status: detail.status,
          price: detail.price,
          createdAt: detail.createdAt,
          imageUrl: detail.imageUrl,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error cargando checkout";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [orderId, orderNumber, router]);

  function handlePay() {
    if (!storedPayload?.actionUrl || !storedPayload?.payload) {
      setError("No encontramos los datos de pago. Vuelve a generar el pago desde tu pedido.");
      return;
    }

    setPaying(true);
    paymentService.submitToPayU(storedPayload.actionUrl, storedPayload.payload);
  }

  const amountFromPayload = Number(storedPayload?.payload?.amount || 0);
  const taxFromPayload = Number(storedPayload?.payload?.tax || 0);
  const subtotalFromPayload = Number(storedPayload?.payload?.taxReturnBase || 0);

  const fallbackTotal = roundMoney(order?.price || 0);
  const displayTotal = amountFromPayload > 0 ? roundMoney(amountFromPayload) : fallbackTotal;
  const displaySubtotal = subtotalFromPayload > 0
    ? roundMoney(subtotalFromPayload)
    : roundMoney(displayTotal / 1.19);
  const displayTax = taxFromPayload > 0
    ? roundMoney(taxFromPayload)
    : roundMoney(displayTotal - displaySubtotal);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-5 gap-6">
          <section className="md:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-sm mb-4">
              Checkout seguro
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">Finaliza tu pago</h1>
            <p className="text-slate-600 mb-6">
              Estás a un paso de confirmar tu compra. Serás redirigido al gateway de PayU para completar el pago de forma segura.
            </p>

            {loading && <p className="text-slate-600">Cargando información del pedido...</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}

            {!loading && order && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                  <p className="text-sm text-slate-500">Pedido #{order.id}</p>
                  <p className="text-lg font-semibold text-slate-900">{order.title}</p>
                  <p className="text-sm text-slate-600 mt-1">Estado actual: {order.status}</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Subtotal del producto</span>
                    <span className="font-medium text-slate-900">{formatCOP(displaySubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>IVA (19% Colombia)</span>
                    <span className="font-medium text-slate-900">{formatCOP(displayTax)}</span>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Total a pagar</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCOP(displayTotal)}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    El precio publicado del producto es antes de impuestos. El valor final incluye IVA y es el que se envía a PayU.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handlePay} disabled={paying || !storedPayload} className="px-6">
                    {paying ? "Redirigiendo a PayU..." : "Pagar ahora con PayU"}
                  </Button>
                  <Link href="/cliente/dashboard">
                    <Button variant="outline">Pagar después</Button>
                  </Link>
                </div>
              </div>
            )}
          </section>

          <aside className="md:col-span-2 bg-slate-900 text-slate-100 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-3">Protección de compra</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Transacción procesada por PayU Sandbox.</li>
              <li>No almacenamos datos de tarjetas en la app.</li>
              <li>Confirmación automática del estado del pedido.</li>
            </ul>

            <div className="mt-6 border-t border-slate-700 pt-4 text-xs text-slate-400">
              Si cierras esta página, podrás reintentar desde tus pedidos mientras el estado sea Pendiente de pago.
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}