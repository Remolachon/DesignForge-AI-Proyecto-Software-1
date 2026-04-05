import { BaseOrder } from '@/types/order';

export const mockPedidos: BaseOrder[] = [
  {
    id: '001',
    title: 'Letrero Neon Personalizado',
    status: 'En diseño',
    price: 120000,
    createdAt: '2025-03-01',
    deliveryDate: '2025-03-10',
    image: {
      bucket: 'mock',
      path: 'neon-personalizado.jpeg',
    },
  },
  {
    id: '002',
    title: 'Logo en Acrílico',
    status: 'En producción',
    price: 85000,
    createdAt: '2025-03-02',
    deliveryDate: '2025-03-12',
    image: {
      bucket: 'mock',
      path: 'logo-acrilico.jpeg',
    },
  },
];
