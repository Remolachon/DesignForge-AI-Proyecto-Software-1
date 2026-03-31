// /services/product.service.ts
import { Product } from '@/types/product';
import { mockProducts } from '@/features/mockProducts';

export const ProductService = {
  async getProducts(): Promise<Product[]> {
    // 🔥 HOY (mock)
    return mockProducts;

    // 🔥 MAÑANA (Backend Python) le tocara a didier xd
    // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
    // return res.json();

    // 🔥 OPCIÓN SUPABASE
    // const { data } = await supabase.from('products').select('*');
    // return data;
  },
};