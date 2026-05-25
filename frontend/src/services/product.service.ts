/* eslint-disable @typescript-eslint/no-explicit-any */
import { Product } from "@/types/product";
import { normalizeProductType } from "@/constants/productCatalog";
import { getApiBaseUrl } from "@/lib/utils/apiBaseUrl";

type ProductApiResponse = {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  media?: any[];
  price: number;
  rating: number;
  reviews: number;
  inStock: boolean;
  stock: number;
  productType: string;
  productShape?: string | null;
  productShapeId?: number | null;
  attributes?: any[];
};

function toProduct(apiProduct: ProductApiResponse): Product {
  const normalizedType = normalizeProductType(apiProduct.productType) || "bordado";

  return {
    id: apiProduct.id,
    title: apiProduct.title,
    description: apiProduct.description,
    imageUrl: apiProduct.imageUrl || undefined,
    media: apiProduct.media || [],
    price: Number(apiProduct.price),
    rating: Number(apiProduct.rating || 0),
    reviews: Number(apiProduct.reviews || 0),
    inStock: Boolean(apiProduct.inStock),
    stock: Number(apiProduct.stock || 0),
    productType: normalizedType,
    productShape: apiProduct.productShape || null,
    productShapeId: apiProduct.productShapeId ?? null,
    attributes: apiProduct.attributes || [],
  };
}

export class ProductService {
  static async getProducts(): Promise<Product[]> {
    const res = await fetch(`${getApiBaseUrl()}/products/`);

    if (!res.ok) {
      throw new Error("Error fetching products");
    }

    const data: ProductApiResponse[] = await res.json();
    return data.map(toProduct);
  }

  static async getProductById(id: string): Promise<Product> {
    // Note: Since the backend currently lacks a specific /products/:id endpoint, 
    // we fetch the catalog and filter. In production with a large catalog, 
    // a specific backend endpoint should be added.
    const products = await ProductService.getProducts();
    const product = products.find(p => p.id.toString() === id);

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  }
}