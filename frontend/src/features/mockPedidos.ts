import { Pedido } from '@/components/Pedidos/types/pedido';

export const mockPedidos: Pedido[] = [
  {
    id: '001',
    title: 'Letrero Neon Personalizado',
    description: 'Nombre en neon azul',
    status: 'En diseño',
    price: 120000,
    imageUrl: 'https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.52.24%20PM.jpeg',
    createdAt: '2025-03-01',
    deliveryDate: '2025-03-10',
  },
  {
    id: '002',
    title: 'Logo en Acrílico',
    status: 'En producción',
    price: 85000,
    imageUrl: 'https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.52.24%20PM.jpeg',
    createdAt: '2025-03-02',
    deliveryDate: '2025-03-12',
  },
];