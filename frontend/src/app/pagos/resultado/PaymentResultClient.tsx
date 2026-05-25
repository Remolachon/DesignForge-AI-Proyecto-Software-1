"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/utils/apiBaseUrl";

const API_URL = getApiBaseUrl();

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
  if (value === "6" || value.includes("declined")) return "pending";
  if (value === "7" || value.includes("pending")) return "pending";
  if (value === "5" || value.includes("expired")) return "pending";

  return "unknown";
}

export default function PaymentResultClient() {
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
        badgeClass: "bg-green-100 text-green-900 border-green-300 dark:bg-green-900/35 dark:text-green-200 dark:border-green-700",
      };
    }

    if (state === "pending") {
      return {
        title: "Pago pendiente",
        description: "Tu pago no se confirmó todavía. El pedido seguirá en Pendiente de pago hasta que PayU lo apruebe.",
        badgeClass: "bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900/35 dark:text-yellow-200 dark:border-yellow-700",
      };
    }

    if (state === "expired") {
      return {
        title: "Pago expirado",
        description: "La sesión de pago expiró. Debes generar un nuevo intento de pago.",
        badgeClass: "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/35 dark:text-orange-200 dark:border-orange-700",
      };
    }

    return {
      title: "Resultado de pago recibido",
      description: "Recibimos la respuesta del gateway. Verifica el estado final en el dashboard.",
      badgeClass: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800/60 dark:text-slate-100 dark:border-slate-600",
    };
  }, [state]);

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8 space-y-5 text-foreground">
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