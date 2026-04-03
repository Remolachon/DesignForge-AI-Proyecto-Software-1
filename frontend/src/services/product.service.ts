import { Product } from "@/types/product";

export class ProductService {
  static async getProducts(): Promise<Product[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);

    if (!res.ok) {
      throw new Error("Error fetching products");
    }

    return res.json();
  }
}