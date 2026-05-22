// /types/product.ts
export type ProductType = 'bordado' | 'neon-flex' | 'acrilico';

export interface ProductShape {
  id: number;
  name: string;
}

export interface FileAsset {
  id?: number;
  bucket_name?: string;
  storage_path: string;
  file_type?: string;
  mime_type?: string;
  size_bytes?: number;
  sort_order: number;
  company_id?: number;
  product_id?: number;
  media_kind: 'image' | 'video' | 'thumbnail' | 'document';
  media_role: 'main' | 'gallery' | 'preview' | 'attachment';
  width?: number;
  height?: number;
  duration_seconds?: number;
  extension?: string;
  is_active?: boolean;
  uploaded_by?: number;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  imageUrl?: string; // Kept for backwards compatibility if needed during migration
  media: FileAsset[];
  price: number;
  rating: number;
  reviews: number;
  inStock: boolean;
  stock: number;
  productType: ProductType;
  productShape?: string | null;
  productShapeId?: number | null;
  attributes: ProductAttribute[];
}

export const getProductTypeLabel = (type: ProductType) => {
  switch (type) {
    case 'bordado':
      return 'Bordado';
    case 'neon-flex':
      return 'Neon Flex';
    case 'acrilico':
      return 'Acrílico';
  }
};

export type AttributeType = 'text' | 'number' | 'color' | 'select';

export interface ProductAttribute {
  id: number;
  code: string;
  label: string;
  input_type: AttributeType;
  required: boolean;
  placeholder: string | null;
  default_value?: string | null;
  sort_order: number;
}

export type AttributeValues = Record<string, string>;

export interface CreateOrderItemPayload {
  productId: number;
  quantity: number;
  attributes: AttributeValues;
}