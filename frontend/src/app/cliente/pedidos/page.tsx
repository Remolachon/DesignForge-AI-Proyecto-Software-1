'use client';

import Header from '@/components/Header';
import { PedidoFilters } from '@/components/Pedidos/PedidoFilters';
import { PedidoList } from '@/components/Pedidos/PedidoList';
import { usePedidos } from '@/components/Pedidos/hooks/usePedidos';

export default function ClientePedidosPage() {
  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredPedidos,
    loading,
    page,
    setPage,
    totalPages,
    totalItems,
  } = usePedidos();

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Mis Pedidos</h1>
          <p className="text-muted-foreground">
            Historial y seguimiento de tus pedidos
          </p>
        </div>

        <PedidoFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Cargando pedidos...
          </div>
        ) : (
          <>
            <PedidoList pedidos={filteredPedidos} />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Total pedidos: <span className="font-semibold text-foreground">{totalItems}</span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-50"
                >
                  Anterior
                </button>

                <div className="flex items-center gap-1">
                  {pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg border text-sm ${
                        p === page
                          ? 'bg-primary text-white border-primary'
                          : 'border-border'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}