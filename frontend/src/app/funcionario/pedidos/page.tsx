'use client';

import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { DataPagination } from '@/components/ui/DataPagination';

import { useFuncionarioPedidos } from '@/components/Pedidos/hooks/useFuncionarioPedidos';
import { OrdersFilters } from '@/components/Pedidos/funcionario/OrdersFilters';
import { OrdersTable } from '../../../components/Pedidos/funcionario/OrdersTable';
import { TableSkeleton } from '@/components/Pedidos/funcionario/TableSkeleton';
import { ConfirmStatusModal } from '@/components/Pedidos/modals/ConfirmStatusModal';

export default function FuncionarioPedidosPage() {
  const {
    inputSearch,
    handleSearchChange,
    isSearching,
    filterStatus,
    handleFilterChange,
    orders,
    loading,
    debouncedSearch,
    page,
    setPage,
    totalPages,
    totalItems,
    pendingChange,
    setPendingChange,
    handleStatusChange,
    confirmStatusChange,
  } = useFuncionarioPedidos();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-primary mb-2">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">Ver, filtrar y actualizar el estado de todos los pedidos</p>
        </div>

        <OrdersFilters
          inputSearch={inputSearch}
          onSearchChange={handleSearchChange}
          filterStatus={filterStatus}
          onFilterChange={handleFilterChange}
          isSearching={isSearching}
        />

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
            <OrdersTable
              orders={orders}
              totalItems={totalItems}
              onStatusChange={handleStatusChange}
            />
          )}
        </Card>

        {!loading && (
          <DataPagination
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