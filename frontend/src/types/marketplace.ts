import { ProductType, FileAsset, ProductAttribute } from '@/types/product';

export interface MarketplaceProduct {
  id: string;
  companyId?: number;
  name: string;
  description: string;
  basePrice: number;
  productType: ProductType;
  productShape?: string | null;
  productShapeId?: number | null;
  imageUrl?: string;
  media?: FileAsset[];
  inStock: boolean;
  stock: number;
  isActive: boolean;
  isPublic: boolean;
  rating: number;
  reviews: number;
  createdAt: string;
  attributes?: ProductAttribute[];
}
