'use client';

import Header from '@/components/Header';
import { PedidoFilters } from '@/components/Pedidos/PedidoFilters';
import { PedidoList } from '@/components/Pedidos/PedidoList';
import { PedidosClienteLoading } from '@/components/Pedidos/PedidosClienteLoading';
import { usePedidos } from '@/components/Pedidos/hooks/usePedidos';

function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (p: number) => void;
}) {
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
        Total pedidos: <span className="font-semibold text-foreground">{totalItems}</span>
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

export default function ClientePedidosPage() {
    const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredPedidos,
    loading,
    isSearching,
    page,
    setPage,
    totalPages,
    totalItems,
  } = usePedidos();

  if (loading) {
    return <PedidosClienteLoading />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Mis Pedidos</h1>
          <p className="text-muted-foreground">Historial y seguimiento de tus pedidos</p>
        </div>

        <PedidoFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        {isSearching && (
          <p className="text-sm text-muted-foreground animate-pulse">Buscando pedidos…</p>
        )}

        <>
          <PedidoList pedidos={filteredPedidos} />

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
          />
        </>
      </div>
    </div>
  );
}