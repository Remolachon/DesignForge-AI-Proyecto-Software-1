import { ProductType } from '@/types/product';

export interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  productType: ProductType;
  imageUrl: string;
  inStock: boolean;
  stock: number;
  isActive: boolean;
  rating: number;
  reviews: number;
  createdAt: string;
}
