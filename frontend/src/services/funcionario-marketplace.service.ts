import { type FileAsset, type ProductAttribute, type ProductType } from '@/types/product';
import { type MarketplaceProduct } from '@/types/marketplace';
import { normalizeProductType } from '@/constants/productCatalog';
import { getApiBaseUrl } from '@/lib/utils/apiBaseUrl';
import { cachedRequest, invalidateRequestCache } from '@/services/requestCache';

const API_URL = getApiBaseUrl();

type AdminProductResponse = {
  id: number;
  companyId?: number;
  name: string;
  description: string;
  basePrice: number;
  productType: string;
  productShape?: string | null;
  productShapeId?: number | null;
  imageUrl?: string | null;
  media?: MarketplaceMediaResponse[];
  inStock: boolean;
  stock: number;
  isActive: boolean;
  isPublic: boolean;
  rating: number;
  reviews: number;
  createdAt: string;
  attributes?: MarketplaceAttributeResponse[];
};

type MarketplaceMediaResponse = {
  id?: number;
  storage_path: string;
  media_kind: 'image' | 'video';
  media_role?: string | null;
  sort_order?: number | null;
};

type MarketplaceAttributeResponse = {
  id?: number;
  code?: string;
  label?: string | null;
  input_type?: 'text' | 'number' | 'color' | 'select' | string;
  required?: boolean;
  placeholder?: string | null;
  default_value?: string | null;
  sort_order?: number | null;
  [key: string]: unknown;
};

function toFileAsset(media: MarketplaceMediaResponse): FileAsset {
  return {
    id: media.id,
    storage_path: media.storage_path,
    media_kind: media.media_kind,
    media_role: media.media_role === 'main' ? 'main' : media.media_role === 'preview' ? 'preview' : media.media_role === 'attachment' ? 'attachment' : 'gallery',
    sort_order: media.sort_order ?? 0,
  };
}

function toProductAttribute(attribute: MarketplaceAttributeResponse): ProductAttribute {
  return {
    id: attribute.id ?? 0,
    code: attribute.code || '',
    label: attribute.label || attribute.code || '',
    input_type: attribute.input_type === 'number' || attribute.input_type === 'color' || attribute.input_type === 'select'
      ? attribute.input_type
      : 'text',
    required: Boolean(attribute.required),
    placeholder: attribute.placeholder ?? null,
    default_value: attribute.default_value ?? null,
    sort_order: attribute.sort_order ?? 0,
  };
}

export type MarketplaceSavePayload = {
  name: string;
  description: string;
  basePrice: number;
  productType: ProductType;
  productShape: string;
  stock: number;
  shapeAttributes?: Record<string, string>;
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
    productShape: product.productShape || null,
    productShapeId: product.productShapeId ?? null,
    imageUrl: product.imageUrl || undefined,
    media: (product.media || []).map(toFileAsset),
    inStock: product.inStock,
    stock: product.stock,
    isActive: product.isActive,
    isPublic: product.isPublic,
    rating: product.rating,
    reviews: product.reviews,
    createdAt: product.createdAt,
    attributes: (product.attributes || []).map(toProductAttribute),
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
  async uploadProductMedia(
    productId: number,
    companyId: number,
    mediaKind: string,
    mediaRole: string,
    sortOrder: number,
    file: File
  ): Promise<FileAsset> {
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

    return response.json(); // This line remains unchanged
  },

  async getProducts(): Promise<MarketplaceProduct[]> {
    return cachedRequest('marketplace:funcionario:products', 10000, async () => {
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
    });
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
    invalidateRequestCache('marketplace:funcionario:products');
    invalidateRequestCache('products-public');
    invalidateRequestCache('product-public:');
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
    invalidateRequestCache('marketplace:funcionario:products');
    invalidateRequestCache('products-public');
    invalidateRequestCache('product-public:');
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
    invalidateRequestCache('marketplace:funcionario:products');
    invalidateRequestCache('products-public');
    invalidateRequestCache('product-public:');
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

    invalidateRequestCache('marketplace:funcionario:products');
    invalidateRequestCache('products-public');
    invalidateRequestCache('product-public:');
  },
};
