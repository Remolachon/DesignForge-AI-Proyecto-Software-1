// /types/product.ts
export type ProductType = 'bordado' | 'neon-flex' | 'acrilico';

export interface Product {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  rating: number;
  reviews: number;
  inStock: boolean;
  productType: ProductType;
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