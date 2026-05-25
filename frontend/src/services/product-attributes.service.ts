import { ProductAttribute } from "@/types/product";
import { getApiBaseUrl } from "@/lib/utils/apiBaseUrl";

const API_URL = getApiBaseUrl();

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
