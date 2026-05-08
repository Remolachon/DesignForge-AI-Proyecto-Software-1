"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AdminService, AdminOrdersPageResponse } from "@/services/admin.service";
import { AdminOrder } from "@/types/order";
import { STATUS_OPTIONS } from "@/components/Pedidos/funcionario/pedidos-funcionario.types";
import { getStatusColor } from "@/lib/utils/statusColors";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status || "Sin estado";
}

function OrderDetailsDialog({ order, open, onOpenChange }: { order: AdminOrder | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!order) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Pedido #{order.id}</DialogTitle>
          <DialogDescription>Vista de solo lectura para la administración.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cliente</p>
            <p className="mt-1 font-medium text-foreground">{order.clientName}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Empresa</p>
            <p className="mt-1 font-medium text-foreground">{order.companyName || "Sin empresa asociada"}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Estado</p>
            <p className="mt-1 font-medium text-foreground">{formatStatus(order.status)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Precio</p>
            <p className="mt-1 font-medium text-foreground">{formatCurrency(order.price)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Creado</p>
            <p className="mt-1 font-medium text-foreground">{formatDate(order.createdAt)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Entrega</p>
            <p className="mt-1 font-medium text-foreground">{formatDate(order.deliveryDate)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminOrdersPage() {
  const [data, setData] = useState<AdminOrdersPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await AdminService.getOrdersPage({
          page,
          pageSize: 10,
          search,
          status,
        });

        if (isMounted) {
          setData(response);
          if (response.page !== page) {
            setPage(response.page);
          }
        }
      } catch {
        if (isMounted) {
          setError("No fue posible cargar los pedidos.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [page, search, status]);

  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const items = data?.items ?? [];

  const summary = useMemo(() => {
    const activeCount = items.filter((order) => order.status !== "Pendiente de pago").length;
    return {
      visible: items.length,
      active: activeCount,
    };
  }, [items]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Pedidos
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">Pedidos visibles para administración</h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Consulta todos los pedidos, filtra por estado o búsqueda y abre el detalle para revisar la empresa asociada y el cliente sin modificar nada.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[28rem]">
              <Card className="border-border/70 bg-background/80">
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pedidos</p>
                  <p className="mt-2 text-2xl font-semibold text-primary">{totalItems}</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/80">
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Visibles</p>
                  <p className="mt-2 text-2xl font-semibold text-primary">{summary.visible}</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/80">
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Activos</p>
                  <p className="mt-2 text-2xl font-semibold text-primary">{summary.active}</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/80">
                <CardContent className="p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Página</p>
                  <p className="mt-2 text-2xl font-semibold text-primary">{page}/{totalPages}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm sm:p-8">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por pedido, cliente, correo, empresa o producto"
                className="h-11 rounded-xl border-border/70 bg-background/80 pl-10"
              />
            </div>

            <div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-xl border border-border/70 bg-background/80 px-4 text-sm text-foreground outline-none"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-border/70 bg-background/90">
            {error ? (
              <div className="px-6 py-10 text-center text-sm text-red-700">{error}</div>
            ) : loading ? (
              <div className="space-y-3 p-6">
                <div className="h-16 animate-pulse rounded-2xl bg-muted/70" />
                <div className="h-16 animate-pulse rounded-2xl bg-muted/70" />
                <div className="h-16 animate-pulse rounded-2xl bg-muted/70" />
              </div>
            ) : items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-border/70 bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-medium">Pedido</th>
                      <th className="px-6 py-4 font-medium">Cliente</th>
                      <th className="px-6 py-4 font-medium">Empresa</th>
                      <th className="px-6 py-4 font-medium">Estado</th>
                      <th className="px-6 py-4 font-medium">Entrega</th>
                      <th className="px-6 py-4 font-medium">Total</th>
                      <th className="px-6 py-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((order) => (
                      <tr key={order.id} className="border-b border-border/60 last:border-b-0">
                        <td className="px-6 py-4">
                          <div className="font-medium text-primary">#{order.id}</div>
                          <div className="text-xs text-muted-foreground">{order.title}</div>
                        </td>
                        <td className="px-6 py-4 text-foreground">{order.clientName}</td>
                        <td className="px-6 py-4 text-foreground">{order.companyName || "Sin empresa"}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={getStatusColor(order.status)}>{order.status}</Badge>
                        </td>
                        <td className="px-6 py-4 text-foreground">{formatDate(order.deliveryDate)}</td>
                        <td className="px-6 py-4 font-medium text-foreground">{formatCurrency(order.price)}</td>
                        <td className="px-6 py-4">
                          <Button variant="outline" className="rounded-xl" onClick={() => setSelectedOrder(order)}>
                            Ver detalle
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                No hay pedidos para los filtros seleccionados.
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" disabled={page <= 1 || loading} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                Anterior
              </Button>
              <Button variant="outline" className="rounded-xl" disabled={page >= totalPages || loading} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
                Siguiente
              </Button>
            </div>
          </div>
        </section>
      </main>

      <OrderDetailsDialog open={Boolean(selectedOrder)} order={selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)} />
    </div>
  );
}
