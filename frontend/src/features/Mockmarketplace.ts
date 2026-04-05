import { ProductType } from './Mockordersadmin';

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

const IMG_ACRILICO =
  'https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.52.24%20PM.jpeg';
const IMG_NEON =
  'https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.51.13%20PM.jpeg';
const IMG_BORDADO =
  'https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.53.05%20PM%20(1).jpeg';

export const mockMarketplaceProducts: MarketplaceProduct[] = [
  {
    id: 'prod-001',
    name: 'Letrero Neon Estándar',
    description: 'Letrero luminoso ideal para negocios y decoración de interiores.',
    basePrice: 150000,
    productType: 'neon-flex',
    imageUrl: IMG_NEON,
    inStock: true,
    stock: 8,
    isActive: true,
    rating: 4.8,
    reviews: 24,
    createdAt: '2025-01-15',
  },
  {
    id: 'prod-002',
    name: 'Placa Acrílica Premium',
    description: 'Placa de acrílico transparente con grabado láser de alta precisión.',
    basePrice: 95000,
    productType: 'acrilico',
    imageUrl: IMG_ACRILICO,
    inStock: true,
    stock: 15,
    isActive: true,
    rating: 4.5,
    reviews: 12,
    createdAt: '2025-01-20',
  },
  {
    id: 'prod-003',
    name: 'Bordado Corporativo Pack 5',
    description: 'Pack de 5 bordados para uniformes o prendas de trabajo.',
    basePrice: 75000,
    productType: 'bordado',
    imageUrl: IMG_BORDADO,
    inStock: true,
    stock: 20,
    isActive: true,
    rating: 4.9,
    reviews: 37,
    createdAt: '2025-02-01',
  },
  {
    id: 'prod-004',
    name: 'Letrero Neon Decorativo',
    description: 'Diseño artístico para decoración de interiores y eventos.',
    basePrice: 200000,
    productType: 'neon-flex',
    imageUrl: IMG_NEON,
    inStock: false,
    stock: 0,
    isActive: false,
    rating: 4.2,
    reviews: 8,
    createdAt: '2025-02-10',
  },
  {
    id: 'prod-005',
    name: 'Logo Acrílico 3D',
    description: 'Logotipo en relieve sobre base acrílica, ideal para recepción.',
    basePrice: 130000,
    productType: 'acrilico',
    imageUrl: IMG_ACRILICO,
    inStock: true,
    stock: 5,
    isActive: true,
    rating: 4.7,
    reviews: 19,
    createdAt: '2025-02-20',
  },
];