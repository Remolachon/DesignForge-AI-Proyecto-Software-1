import { Product } from "@/types/product";
import { getCatalogImageByType, normalizeProductType } from "@/constants/productCatalog";

type ProductApiResponse = {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  price: number;
  rating: number;
  reviews: number;
  inStock: boolean;
  productType: string;
};

function toProduct(apiProduct: ProductApiResponse): Product {
  const normalizedType = normalizeProductType(apiProduct.productType) || "bordado";

  return {
    id: String(apiProduct.id),
    title: apiProduct.title,
    description: apiProduct.description,
    imageUrl: getCatalogImageByType(apiProduct.productType, apiProduct.imageUrl),
    price: Number(apiProduct.price),
    rating: Number(apiProduct.rating || 0),
    reviews: Number(apiProduct.reviews || 0),
    inStock: Boolean(apiProduct.inStock),
    productType: normalizedType,
  };
}

export class ProductService {
  static async getProducts(): Promise<Product[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);

    if (!res.ok) {
      throw new Error("Error fetching products");
    }

    const data: ProductApiResponse[] = await res.json();
    return data.map(toProduct);
  }
}