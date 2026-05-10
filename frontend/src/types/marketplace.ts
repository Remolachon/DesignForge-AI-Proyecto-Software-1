import { ProductType, FileAsset } from '@/types/product';

export interface MarketplaceProduct {
  id: string;
  companyId?: number;
  name: string;
  description: string;
  basePrice: number;
  productType: ProductType;
  imageUrl?: string;
  media?: FileAsset[];
  inStock: boolean;
  stock: number;
  isActive: boolean;
  rating: number;
  reviews: number;
  createdAt: string;
}
