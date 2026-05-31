import { FileAsset, Product, type ProductAttribute } from "@/types/product";
import { normalizeProductType } from "@/constants/productCatalog";
import { getApiBaseUrl } from "@/lib/utils/apiBaseUrl";
import { cachedRequest, invalidateRequestCache } from "@/services/requestCache";

type ProductApiResponse = {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  media?: ProductMediaResponse[];
  price: number;
  rating: number;
  reviews: number;
  inStock: boolean;
  stock: number;
  productType: string;
  productShape?: string | null;
  productShapeId?: number | null;
  attributes?: ProductAttributeResponse[];
};

type ProductMediaResponse = {
  id?: number;
  storage_path: string;
  media_kind: 'image' | 'video';
  media_role?: string | null;
  sort_order?: number | null;
};

type ProductAttributeResponse = {
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

function toFileAsset(media: ProductMediaResponse): FileAsset {
  return {
    id: media.id,
    storage_path: media.storage_path,
    media_kind: media.media_kind,
    media_role: media.media_role === 'main' ? 'main' : media.media_role === 'preview' ? 'preview' : media.media_role === 'attachment' ? 'attachment' : 'gallery',
    sort_order: media.sort_order ?? 0,
  };
}

function toProductAttribute(attribute: ProductAttributeResponse): ProductAttribute {
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

function toProduct(apiProduct: ProductApiResponse): Product {
  const normalizedType = normalizeProductType(apiProduct.productType) || "bordado";

  return {
    id: apiProduct.id,
    title: apiProduct.title,
    description: apiProduct.description,
    imageUrl: apiProduct.imageUrl || undefined,
      media: (apiProduct.media || []).map(toFileAsset),
    price: Number(apiProduct.price),
    rating: Number(apiProduct.rating || 0),
    reviews: Number(apiProduct.reviews || 0),
    inStock: Boolean(apiProduct.inStock),
    stock: Number(apiProduct.stock || 0),
    productType: normalizedType,
    productShape: apiProduct.productShape || null,
    productShapeId: apiProduct.productShapeId ?? null,
      attributes: (apiProduct.attributes || []).map(toProductAttribute),
  };
}

export class ProductService {
  static async getProducts(): Promise<Product[]> {
    return cachedRequest('products-public', 10000, async () => {
      const res = await fetch(`${getApiBaseUrl()}/products/`);

      if (!res.ok) {
        throw new Error("Error fetching products");
      }

      const data: ProductApiResponse[] = await res.json();
      return data.map(toProduct);
    });
  }

  static async getProductById(id: string): Promise<Product> {
    return cachedRequest(`product-public:${id}`, 10000, async () => {
      // Note: Since the backend currently lacks a specific /products/:id endpoint,
      // we fetch the catalog and filter. In production with a large catalog,
      // a specific backend endpoint should be added.
      const products = await ProductService.getProducts();
      const product = products.find(p => p.id.toString() === id);

      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    });
  }

  static invalidateProductCache() {
    invalidateRequestCache('products-public');
    invalidateRequestCache('product-public:');
  }
}