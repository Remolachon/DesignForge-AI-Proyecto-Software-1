'use client';

import { Plus } from 'lucide-react';

import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { useAdminMarketplace } from '@/components/marketplace/hooks/useAdminMarketplace';
import { MarketplaceStats } from '@/components/marketplace/MarketplaceStats';
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import { ProductModal } from '@/components/marketplace/modals/ProductModal';
import { DeleteModal } from '@/components/marketplace/modals/DeleteModal';
import { ConfirmActionModal } from '@/components/marketplace/modals/ConfirmActionModal';

export default function AdminMarketplace() {
  const {
    filtered,
    products,
    searchTerm,
    setSearchTerm,
    loading,
  } = useAdminMarketplace();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-primary mb-2">Marketplace (Administrador)</h1>
            <p className="text-muted-foreground">Vista del marketplace para administradores (todos los productos).</p>
          </div>
        </div>

        <MarketplaceStats totalActive={products.filter(p=>p.isActive).length} totalInactive={products.filter(p=>!p.isActive).length} outOfStock={products.filter(p=>!p.inStock).length} />

        <MarketplaceFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} filterType={'all'} onFilterChange={()=>{}} />

        {loading ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-sm">Cargando productos...</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-sm">No se encontraron productos</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product, idx) => (
              <MarketplaceProductCard
                key={product.id}
                product={product}
                onToggleActive={()=>{}}
                onEdit={()=>{}}
                onDelete={()=>{}}
                imageLoading={idx === 0 ? 'eager' : 'lazy'}
              />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Mostrando <span className="font-semibold text-foreground">{filtered.length}</span> de <span className="font-semibold text-foreground">{products.length}</span> productos
          </p>
        )}
      </main>
    </div>
  );
}
