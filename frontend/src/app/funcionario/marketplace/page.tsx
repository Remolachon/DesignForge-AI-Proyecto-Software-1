'use client';

import { Plus } from 'lucide-react';

import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { useMarketplace } from '@/components/marketplace/hooks/useMarketplace';
import { MarketplaceStats } from '@/components/marketplace/MarketplaceStats';
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import { ProductModal } from '@/components/marketplace/modals/ProductModal';
import { DeleteModal } from '@/components/marketplace/modals/DeleteModal';
import { ConfirmActionModal } from '@/components/marketplace/modals/ConfirmActionModal';

export default function FuncionarioMarketplace() {
  const {
    filtered,
    products,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    loading,
    totalActive,
    totalInactive,
    outOfStock,
    showModal,
    setShowModal,
    modalMode,
    editingProduct,
    editInitialData,
    openCreate,
    openEdit,
    handleSave,
    pendingSave,
    setPendingSave,
    confirmSave,
    pendingVisibility,
    setPendingVisibility,
    toggleActive,
    confirmToggleActive,
    deletingProduct,
    setDeletingProduct,
    confirmDelete,
  } = useMarketplace();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-primary mb-2">
              Gestión del Marketplace
            </h1>
            <p className="text-muted-foreground">
              Agrega, edita y administra los productos disponibles
            </p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={openCreate}>
            <Plus className="w-5 h-5" />
            Agregar Producto
          </Button>
        </div>

        {/* Estadísticas rápidas */}
        <MarketplaceStats
          totalActive={totalActive}
          totalInactive={totalInactive}
          outOfStock={outOfStock}
        />

        {/* Filtros */}
        <MarketplaceFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onFilterChange={setFilterType}
        />

        {/* Grid de productos */}
        {loading ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-sm">Cargando productos...</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-sm">
                No se encontraron productos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => (
              <MarketplaceProductCard
                key={product.id}
                product={product}
                onToggleActive={toggleActive}
                onEdit={openEdit}
                onDelete={setDeletingProduct}
              />
            ))}
          </div>
        )}

        {/* Pie de página con conteo */}
        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Mostrando{' '}
            <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
            de{' '}
            <span className="font-semibold text-foreground">{products.length}</span>{' '}
            productos
          </p>
        )}
      </main>

      {/* Modal crear / editar */}
      {showModal && (
        <ProductModal
          mode={modalMode}
          initialData={editInitialData}
          initialImageUrl={editingProduct?.imageUrl}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {pendingSave && (
        <ConfirmActionModal
          title={modalMode === 'create' ? 'Confirmar nuevo producto' : 'Confirmar cambios'}
          description={
            modalMode === 'create'
              ? 'Se creará un nuevo producto en el marketplace con la información diligenciada.'
              : 'Se guardarán los cambios realizados a este producto.'
          }
          confirmLabel={modalMode === 'create' ? 'Crear producto' : 'Guardar cambios'}
          onConfirm={confirmSave}
          onCancel={() => setPendingSave(null)}
        />
      )}

      {pendingVisibility && (
        <ConfirmActionModal
          title={pendingVisibility.isActive ? 'Desactivar producto' : 'Activar producto'}
          description={
            pendingVisibility.isActive
              ? `"${pendingVisibility.name}" dejará de mostrarse en el marketplace público.`
              : `"${pendingVisibility.name}" volverá a mostrarse en el marketplace público.`
          }
          confirmLabel={pendingVisibility.isActive ? 'Desactivar' : 'Activar'}
          onConfirm={confirmToggleActive}
          onCancel={() => setPendingVisibility(null)}
        />
      )}

      {/* Modal confirmación de eliminación */}
      {deletingProduct && (
        <DeleteModal
          productName={deletingProduct.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingProduct(null)}
        />
      )}
    </div>
  );
}
