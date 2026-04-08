import { type ProductType } from '@/types/product';
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

export type MarketplaceSavePayload = {
  name: string;
  description: string;
  basePrice: number;
  productType: ProductType;
  stock: number;
  imageStoragePath?: string;
};

type UploadProductImageResponse = {
  bucket: string;
  storage_path: string;
  url: string;
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

export const funcionarioMarketplaceService = {
  async uploadProductImage(file: File): Promise<UploadProductImageResponse> {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload-product-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.detail || 'No se pudo subir la imagen');
    }

    return response.json();
  },

  async getProducts(): Promise<MarketplaceProduct[]> {
    const token = getToken();

    const response = await fetch(`${API_URL}/products/admin`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error cargando productos');
    }

    const data: AdminProductResponse[] = await response.json();
    return data.map(toMarketplaceProduct);
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
};
