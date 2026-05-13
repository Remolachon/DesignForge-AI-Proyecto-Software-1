// /hooks/useProducts.ts
'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types/product';
import { ProductService } from '@/services/product.service';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ProductService.getProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  return { products, loading };
};