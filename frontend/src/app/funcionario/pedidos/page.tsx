'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { funcionarioOrderService } from '@/services/funcionario-order.service';
import { AdminOrder, OrderStatus } from '@/types/order';
import { getStatusColor } from '@/lib/utils/statusColors';

type ProductType = 'bordado' | 'neon-flex' | 'acrilico';
type FilterStatus = OrderStatus | 'all';

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 250;

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'En diseño', label: 'En diseño' },
  { value: 'En producción', label: 'En producción' },
  { value: 'Listo para entregar', label: 'Listo para entregar' },
  { value: 'Entregado', label: 'Entregados' },
];

const ORDER_STATUSES: OrderStatus[] = [
  'En diseño',
  'En producción',
  'Listo para entregar',
  'Entregado',
];

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getProductTypeLabel(type: ProductType): string {
  const map: Record<ProductType, string> = {
    bordado: 'Bordado',
    'neon-flex': 'Neon Flex',
    acrilico: 'Acrílico',
  };
  return map[type] ?? type;
}

function ProductTypeBadge({ type }: { type: ProductType }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
      {getProductTypeLabel(type)}
    </span>
  );
}

interface StatusSelectProps {
  orderId: string;
  currentStatus: OrderStatus;
  onChange: (id: string, newStatus: OrderStatus) => void;
}

function StatusSelect({ orderId, currentStatus, onChange }: StatusSelectProps) {
  return (
    <select
      value={currentStatus}
      onChange={(e) => onChange(orderId, e.target.value as OrderStatus)}
      className={`
        text-xs px-2 py-1.5 rounded-full border font-medium cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-accent transition-colors
        ${getStatusColor(currentStatus)}
      `}
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-white text-gray-900 font-normal">
          {s}
        </option>
      ))}
    </select>
  );
}

interface ConfirmStatusModalProps {
  orderId: string;
  nextStatus: OrderStatus;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmStatusModal({ orderId, nextStatus, onConfirm, onCancel }: ConfirmStatusModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-6 h-6 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Confirmar cambio de estado</h3>
        <p className="text-sm text-muted-foreground mb-6">
          ¿Seguro que deseas actualizar el pedido{' '}
          <span className="font-medium text-foreground">#{orderId}</span> a{' '}
          <span className="font-medium text-foreground">"{nextStatus}"</span>?
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={onConfirm}>
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3 px-6 py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-2/5" />
            <div className="h-2 bg-gray-100 rounded w-1/4" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-6 bg-gray-200 rounded-full w-28" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (p: number) => void;
}

function Pagination({ page, totalPages, totalItems, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const pages =
    totalPages <= 7
      ? range(1, totalPages)
      : page <= 4
        ? [...range(1, 5), -1, totalPages]
        : page >= totalPages - 3
          ? [1, -1, ...range(totalPages - 4, totalPages)]
          : [1, -1, ...range(page - 1, page + 1), -1, totalPages];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
      <p className="text-sm text-muted-foreground">
        Página <span className="font-semibold text-foreground">{page}</span> de{' '}
        <span className="font-semibold text-foreground">{totalPages}</span>
        {' · '}
        <span className="font-semibold text-foreground">{totalItems}</span> pedidos en total
      </p>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-border text-sm transition-colors
                     hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Anterior
        </button>

        {pages.map((p, idx) =>
          p === -1 ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`
                px-3 py-1.5 rounded-lg border text-sm transition-colors
                ${p === page ? 'bg-primary text-white border-primary font-medium' : 'border-border hover:bg-muted'}
              `}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-border text-sm transition-colors
                     hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export default function FuncionarioPedidosPage() {
  const [inputSearch, setInputSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [pendingChange, setPendingChange] = useState<{
    orderId: string;
    newStatus: OrderStatus;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isSearching = useMemo(() => {
    return normalizeText(inputSearch) !== debouncedSearch;
  }, [inputSearch, debouncedSearch]);

  const handleSearchChange = useCallback((value: string) => {
    setInputSearch(value);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setDebouncedSearch(normalizeText(value));
      setPage(1);
    }, DEBOUNCE_MS);
  }, []);

  const handleFilterChange = useCallback((value: FilterStatus) => {
    setFilterStatus(value);
    setPage(1);
  }, []);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const data = await funcionarioOrderService.getFuncionarioOrdersPage(
          {
            page,
            pageSize: PAGE_SIZE,
            search: debouncedSearch,
            status: filterStatus,
          },
          controller.signal,
        );

        if (cancelled || controller.signal.aborted) return;

        setOrders(data.items ?? []);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
        setTotalItems(data.totalItems ?? 0);
      } catch (err: any) {
        if (err?.name === 'AbortError' || cancelled || controller.signal.aborted) return;

        toast.error(err?.message || 'No se pudieron cargar los pedidos');
        setOrders([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        if (!cancelled && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, debouncedSearch, filterStatus]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleStatusChange = useCallback(
    (orderId: string, newStatus: OrderStatus) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order || order.status === newStatus) return;
      setPendingChange({ orderId, newStatus });
    },
    [orders],
  );

  const confirmStatusChange = async () => {
    if (!pendingChange) return;

    const { orderId, newStatus } = pendingChange;

    try {
      const updated = await funcionarioOrderService.updateStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      toast.success(`Pedido #${orderId} actualizado a "${updated.status}"`);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo actualizar el estado');
    } finally {
      setPendingChange(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-primary mb-2">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">Ver, filtrar y actualizar el estado de todos los pedidos</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, título, ID, tipo o estado…"
                  value={inputSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-muted/40 border border-border rounded-lg
                             text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                />
                {isSearching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">
                    buscando…
                  </span>
                )}
              </div>

              <div className="flex items-center bg-muted rounded-xl p-1 gap-1 flex-wrap">
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleFilterChange(value)}
                    className={`
                      px-3 py-1.5 text-sm rounded-lg transition-all whitespace-nowrap
                      ${filterStatus === value ? 'bg-white shadow-sm text-black font-medium' : 'text-muted-foreground hover:text-black'}
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          {loading ? (
            <TableSkeleton />
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">
                No se encontraron pedidos
                {debouncedSearch && (
                  <>
                    {' '}
                    con el término "<span className="font-medium">{debouncedSearch}</span>"
                  </>
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      {['Pedido', 'Cliente', 'Tipo', 'Estado', 'Entrega', 'Precio', 'Acciones'].map((col) => (
                        <th
                          key={col}
                          className={`px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                            col === 'Acciones' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border bg-white">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                              {order.imageUrl && (
                                <Image
                                  src={order.imageUrl}
                                  alt={order.title}
                                  fill
                                  sizes="48px"
                                  unoptimized
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-sm leading-tight">{order.title}</p>
                              <p className="text-xs text-muted-foreground">#{order.id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm">{order.clientName}</td>

                        <td className="px-6 py-4">
                          <ProductTypeBadge type={(order.productType || 'bordado') as ProductType} />
                        </td>

                        <td className="px-6 py-4">
                          <StatusSelect
                            orderId={order.id}
                            currentStatus={order.status}
                            onChange={handleStatusChange}
                          />
                        </td>

                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(order.deliveryDate).toLocaleDateString('es-ES')}
                        </td>

                        <td className="px-6 py-4 font-semibold">${order.price.toLocaleString()}</td>

                        <td className="px-6 py-4 text-right">
                          <Link href={`/funcionario/pedidos/${order.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Eye className="w-4 h-4" />
                              Ver
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-border px-6 py-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  Mostrando <span className="font-semibold text-foreground">{orders.length}</span> de{' '}
                  <span className="font-semibold text-foreground">{totalItems}</span> pedidos
                </p>
              </div>
            </>
          )}
        </Card>

        {!loading && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
          />
        )}
      </main>

      {pendingChange && (
        <ConfirmStatusModal
          orderId={pendingChange.orderId}
          nextStatus={pendingChange.newStatus}
          onConfirm={confirmStatusChange}
          onCancel={() => setPendingChange(null)}
        />
      )}
    </div>
  );
}