'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { OrderDetailsModal } from '@/components/modals/OrderDetailsModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataPagination } from '@/components/ui/DataPagination';
import { funcionarioOrderService } from '@/services/funcionario-order.service';
import { type AdminOrder } from '@/types/order';
import { Eye, Search, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PedidosPendientesLoading } from './PedidosPendientesLoading';
import { redirectToLogin } from '@/lib/utils/authSession';

const PAGE_SIZE = 10;

export default function FuncionarioPedidosPendientesPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [pendingAcceptOrder, setPendingAcceptOrder] = useState<AdminOrder | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await funcionarioOrderService.getPendingCustomOrdersPage(
          {
            page,
            pageSize: PAGE_SIZE,
            search: debouncedSearch,
          },
          controller.signal,
        );

        if (cancelled || controller.signal.aborted) return;

        setOrders(data.items ?? []);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
        setTotalItems(data.totalItems ?? 0);
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
          redirectToLogin(window.location.pathname + window.location.search);
          return;
        }
        if (cancelled || controller.signal.aborted) return;
        toast.error((error as { message?: string })?.message || 'No se pudieron cargar los pedidos pendientes');
        setOrders([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        if (!cancelled && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, debouncedSearch]);

  const handleAccept = async (orderId: string) => {
    try {
      setAcceptingId(orderId);
      const updated = await funcionarioOrderService.acceptPendingCustomOrder(orderId);
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      setPendingAcceptOrder((prev) => (prev?.id === orderId ? null : prev));
      toast.success(`Pedido #${orderId} aceptado y asignado a ${updated.companyName || 'tu empresa'}`);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
        redirectToLogin(window.location.pathname + window.location.search);
        return;
      }
      const message = error instanceof Error ? error.message : 'No se pudo aceptar el pedido';
      toast.error(message || 'No se pudo aceptar el pedido');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleConfirmAccept = async () => {
    if (!pendingAcceptOrder) return;
    await handleAccept(pendingAcceptOrder.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Nueva bandeja
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              Pedidos pendientes
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Aquí llegan los pedidos personalizados que todavía no tienen empresa asignada. Puedes revisarlos, abrir sus detalles y aceptarlos para convertirlos en pedidos de tu empresa.
            </p>
          </div>

          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardContent className="flex items-center gap-3 px-5 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-semibold text-foreground">{totalItems}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60 bg-card/90 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Busca por pedido, cliente o shape..."
                className="w-full rounded-xl border border-border bg-transparent py-3 pl-10 pr-4 text-sm outline-none transition focus:border-accent"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Los pedidos aceptados desaparecen de esta bandeja y pasan a pendiente de pago.
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <PedidosPendientesLoading />
        ) : orders.length === 0 ? (
          <Card className="border-dashed border-border bg-card/80 shadow-sm">
            <CardContent className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">No hay pedidos pendientes</h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Cuando llegue un pedido personalizado nuevo, aparecerá aquí para que puedas revisarlo y asignarlo a tu empresa.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {orders.map((order) => (
              <Card key={order.id} className="border-border/60 bg-card/90 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-muted/30 sm:w-28 sm:flex-shrink-0">
                      {order.imageUrl ? (
                        <img src={order.imageUrl} alt={order.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold tracking-tight text-foreground">{order.title}</h3>
                          <p className="text-sm text-muted-foreground">Pedido #{order.id}</p>
                        </div>
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {order.status}
                        </span>
                      </div>

                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <p><span className="font-medium text-foreground">Cliente:</span> {order.clientName || 'Cliente'}</p>
                        <p><span className="font-medium text-foreground">Producto:</span> {order.productType || 'Personalizado'}</p>
                        <p><span className="font-medium text-foreground">Cantidad:</span> {order.quantity || 1}</p>
                        <p><span className="font-medium text-foreground">Entrega:</span> {new Date(order.deliveryDate).toLocaleDateString('es-ES')}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                        <span className="text-xl font-semibold text-primary">${order.price.toLocaleString()}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => setSelectedOrderId(order.id)}>
                            <Eye className="h-4 w-4" />
                            Ver detalles
                          </Button>
                          <Button
                            size="sm"
                            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                            onClick={() => setPendingAcceptOrder(order)}
                            disabled={acceptingId === order.id}
                          >
                            {acceptingId === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            {acceptingId === order.id ? 'Aceptando...' : 'Aceptar pedido'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <DataPagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
        )}
      </main>

      {selectedOrderId && (
        <OrderDetailsModal orderId={selectedOrderId} isOpen={true} onClose={() => setSelectedOrderId(null)} />
      )}

      <AlertDialog open={Boolean(pendingAcceptOrder)} onOpenChange={(open) => !open && setPendingAcceptOrder(null)}>
        <AlertDialogContent className="border-border bg-card text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aceptar este pedido personalizado?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Si confirmas, el pedido #{pendingAcceptOrder?.id} quedará asignado a tu empresa, el cliente recibirá aviso y después podrá continuar con el pago.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{pendingAcceptOrder?.title}</p>
            <p className="mt-1">Cliente: {pendingAcceptOrder?.clientName || 'Cliente'}</p>
            <p className="mt-1">Valor estimado: ${pendingAcceptOrder?.price.toLocaleString() || '0'}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-background text-foreground hover:bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAccept}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {acceptingId === pendingAcceptOrder?.id ? 'Aceptando...' : 'Sí, aceptar pedido'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
