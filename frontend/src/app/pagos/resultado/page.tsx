"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function parseOrderId(referenceCode: string | null): number | null {
  if (!referenceCode) return null;
  const match = referenceCode.match(/^ORDER-(\d+)-/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePayuState(raw: string | null): string {
  const value = (raw || "").toLowerCase();

  if (value === "4" || value.includes("approved")) return "approved";
  if (value === "6" || value.includes("declined")) return "declined";
  if (value === "7" || value.includes("pending")) return "pending";
  if (value === "5" || value.includes("expired")) return "expired";

  return "unknown";
}

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const referenceCode = searchParams.get("referenceCode");
  const transactionState = searchParams.get("transactionState") || searchParams.get("state_pol");
  const message = searchParams.get("message");

  const orderId = useMemo(() => parseOrderId(referenceCode), [referenceCode]);
  const state = useMemo(() => normalizePayuState(transactionState), [transactionState]);

  useEffect(() => {
    async function syncPaymentStatus() {
      if (!referenceCode) return;

      try {
        const payload = Object.fromEntries(searchParams.entries());
        const response = await fetch(`${API_URL}/orders/payu-response`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          setSyncMessage("No fue posible confirmar el pago en segundo plano. Revisa el estado en tus pedidos.");
          return;
        }

        const data = await response.json();
        if (data?.status === "success") {
          setSyncMessage("Estado del pedido sincronizado correctamente.");
        } else if (data?.message) {
          setSyncMessage(data.message);
        }
      } catch {
        setSyncMessage("No fue posible confirmar el pago en segundo plano. Revisa el estado en tus pedidos.");
      }
    }

    syncPaymentStatus();
  }, [referenceCode, searchParams]);

  const ui = useMemo(() => {
    if (state === "approved") {
      return {
        title: "Pago aprobado",
        description: "Tu pago fue aprobado. Tu pedido ya entró al flujo de producción en estado En diseño.",
        badgeClass: "bg-green-100 text-green-800 border-green-200",
      };
    }

    if (state === "declined") {
      return {
        title: "Pago rechazado",
        description: "El pago fue rechazado. Puedes intentar nuevamente con otro método de pago.",
        badgeClass: "bg-red-100 text-red-800 border-red-200",
      };
    }

    if (state === "pending") {
      return {
        title: "Pago pendiente",
        description: "Tu pago está pendiente de confirmación. Te recomendamos revisar el estado en tus pedidos.",
        badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    }

    if (state === "expired") {
      return {
        title: "Pago expirado",
        description: "La sesión de pago expiró. Debes generar un nuevo intento de pago.",
        badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
      };
    }

    return {
      title: "Resultado de pago recibido",
      description: "Recibimos la respuesta del gateway. Verifica el estado final en el dashboard.",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    };
  }, [state]);

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white border border-border rounded-2xl shadow-sm p-6 md:p-8 space-y-5">
          <span className={`inline-flex px-3 py-1 text-sm rounded-full border ${ui.badgeClass}`}>
            {ui.title}
          </span>

          <h1 className="text-2xl md:text-3xl font-semibold text-primary">Resultado del pago</h1>
          <p className="text-muted-foreground">{ui.description}</p>

          <div className="grid gap-2 text-sm bg-muted/40 rounded-xl p-4 border border-border">
            <p>
              <strong>Referencia:</strong> {referenceCode || "No disponible"}
            </p>
            <p>
              <strong>ID de orden:</strong> {orderId || "No identificado"}
            </p>
            {message && (
              <p>
                <strong>Mensaje PayU:</strong> {message}
              </p>
            )}
            {syncMessage && (
              <p>
                <strong>Sincronización:</strong> {syncMessage}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/cliente/dashboard">
              <Button>Ir al dashboard</Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline">Volver al marketplace</Button>
            </Link>
            <Link href="/cliente/crear-pedido">
              <Button variant="outline">Crear otro pedido</Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
