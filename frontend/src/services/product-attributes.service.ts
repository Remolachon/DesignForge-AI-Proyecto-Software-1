import { ProductAttribute } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const productAttributesService = {
  async getProductAttributes(productId: number | string): Promise<ProductAttribute[]> {
    const res = await fetch(`${API_URL}/products/${productId}/attributes`);
    
    if (!res.ok) {
      throw new Error("Failed to fetch product attributes");
    }

    const data = await res.json();
    
    return data.map((attr: any) => ({
      id: attr.id,
      code: attr.code,
      label: attr.label,
      input_type: attr.input_type,
      required: attr.required,
      placeholder: attr.placeholder,
      sort_order: attr.sort_order,
    }));
  }
};
