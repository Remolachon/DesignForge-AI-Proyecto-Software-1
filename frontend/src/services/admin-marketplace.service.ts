import { type MarketplaceProduct } from '@/types/marketplace';
import { getCatalogImageByType, normalizeProductType } from '@/constants/productCatalog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type AdminProductResponse = {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  productType: string;
  imageUrl?: string | null;
  inStock: boolean;
  stock: number;
  isActive: boolean;
  isPublic: boolean;
  rating: number;
  reviews: number;
  createdAt: string;
};

function toMarketplaceProduct(product: AdminProductResponse): MarketplaceProduct {
  const productType = normalizeProductType(product.productType) || 'bordado';

  return {
    id: String(product.id),
    name: product.name,
    description: product.description,
    basePrice: product.basePrice,
    productType,
    imageUrl: getCatalogImageByType(product.productType, product.imageUrl),
    inStock: product.inStock,
    stock: product.stock,
    isActive: product.isPublic,
    rating: product.rating,
    reviews: product.reviews,
    createdAt: product.createdAt,
  };
}

function getToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No autorizado');
  }
  return token;
}

export const adminMarketplaceService = {
  async getProducts(page = 1, pageSize = 20, search: string | null = null): Promise<MarketplaceProduct[]> {
    const token = getToken();
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('page_size', String(pageSize));
    if (search) params.set('search', search);

    const res = await fetch(`${API_URL}/products/admin/page?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error cargando productos de administrador');
    const data = await res.json();
    // data.items expected
    const items: AdminProductResponse[] = Array.isArray(data.items) ? data.items : data;
    return items.map(toMarketplaceProduct);
  },
};
