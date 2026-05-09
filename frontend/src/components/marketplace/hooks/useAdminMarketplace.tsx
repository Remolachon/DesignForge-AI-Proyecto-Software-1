'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminMarketplaceService } from '@/services/admin-marketplace.service';
import { type MarketplaceProduct } from '@/types/marketplace';

export function useAdminMarketplace() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminMarketplaceService.getProducts(page, pageSize, searchTerm || null);
        setProducts(data);
      } catch (e: any) {
        toast.error(e?.message || 'No se pudieron cargar productos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, pageSize, searchTerm]);

  const filtered = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term);
  });

  return {
    products,
    filtered,
    searchTerm,
    setSearchTerm,
    loading,
    page,
    setPage,
    pageSize,
  } as const;
}
