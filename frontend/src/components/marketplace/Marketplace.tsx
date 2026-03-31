// /components/marketplace/Marketplace.tsx
'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { ProductType } from '@/types/product';
import { Filters } from './Filters';
import { ProductCard } from './ProductCard';

export const Marketplace = () => {
  const { products } = useProducts();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all');

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === 'all' || p.productType === filterType;

    return matchesSearch && matchesFilter;
  });

  const handleBuy = () => {
    alert('Producto agregado');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold">Marketplace</h1>
        <p className="text-gray-500">
          Explora y compra productos listos para entrega
        </p>
      </div>

      <Filters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} onBuy={handleBuy} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500">
          No se encontraron productos
        </p>
      )}
    </div>
  );
};