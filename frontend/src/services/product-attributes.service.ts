import { ProductAttribute } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const productAttributesService = {
  async getProductAttributes(productId: number | string): Promise<ProductAttribute[]> {
    const res = await fetch(`${API_URL}/products/${productId}/attributes`);
    
    if (!res.ok) {
      throw new Error("Failed to fetch product attributes");
    }

    const data = await res.json();
    
    // Convert to our frontend interface (camelCase vs snake_case if needed, 
    // although our schema is using snake_case for some fields we should map them)
    return data.map((attr: any) => ({
      id: attr.id,
      code: attr.code,
      label: attr.label,
      type: attr.type,
      required: attr.required,
      unit: attr.unit,
      sortOrder: attr.sort_order,
      options: attr.options?.map((opt: any) => ({
        id: opt.id,
        value: opt.value,
        label: opt.label,
        priceModifier: opt.price_modifier
      })) || []
    }));
  }
};
