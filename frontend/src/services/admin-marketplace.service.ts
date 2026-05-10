import { type MarketplaceProduct } from '@/types/marketplace';
import { type ProductType } from '@/types/product';
import { getCatalogImageByType, normalizeProductType } from '@/constants/productCatalog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type MarketplaceSavePayload = {
  name: string;
  description: string;
  basePrice: number;
  productType: ProductType;
  stock: number;
};

type AdminProductResponse = {
  id: number;
  companyId?: number;
  name: string;
  description: string;
  basePrice: number;
  productType: string;
  imageUrl?: string | null;
  media?: any[];
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
    companyId: product.companyId,
    name: product.name,
    description: product.description,
    basePrice: product.basePrice,
    productType,
    imageUrl: getCatalogImageByType(product.productType, product.imageUrl),
    media: product.media || [],
    inStock: product.inStock,
    stock: product.stock,
    isActive: product.isActive,
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

  async createProduct(payload: MarketplaceSavePayload): Promise<MarketplaceProduct> {
    const token = getToken();

    const response = await fetch(`${API_URL}/products/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.detail || 'No se pudo crear el producto');
    }

    const data: AdminProductResponse = await response.json();
    return toMarketplaceProduct(data);
  },

  async updateProduct(productId: string, payload: MarketplaceSavePayload): Promise<MarketplaceProduct> {
    const token = getToken();

    const response = await fetch(`${API_URL}/products/admin/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.detail || 'No se pudo actualizar el producto');
    }

    const data: AdminProductResponse = await response.json();
    return toMarketplaceProduct(data);
  },

  async setVisibility(productId: string, isPublic: boolean): Promise<MarketplaceProduct> {
    const token = getToken();

    const response = await fetch(`${API_URL}/products/admin/${productId}/visibility`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_public: isPublic }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.detail || 'No se pudo cambiar visibilidad');
    }

    const data: AdminProductResponse = await response.json();
    return toMarketplaceProduct(data);
  },

  async deleteProduct(productId: string): Promise<void> {
    const token = getToken();

    const response = await fetch(`${API_URL}/products/admin/${productId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.detail || 'No se pudo eliminar el producto');
    }
  },

  async uploadProductMedia(
    productId: number,
    companyId: number,
    mediaKind: string,
    mediaRole: string,
    sortOrder: number,
    file: File
  ): Promise<any> {
    const token = getToken();
    const formData = new FormData();
    formData.append('company_id', String(companyId));
    formData.append('media_kind', mediaKind);
    formData.append('media_role', mediaRole);
    formData.append('sort_order', String(sortOrder));
    formData.append('file', file);

    const response = await fetch(`${API_URL}/products/admin/${productId}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.detail || 'No se pudo subir el archivo multimedia');
    }

    return response.json();
  },
};
