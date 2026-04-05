export type OrderStatus = 'En diseño' | 'En producción' | 'Listo para entrega' | 'Entregado';

export interface AdminOrder {
  id: string;
  title: string;
  description?: string;
  status: OrderStatus;
  price: number;
  image: {
    bucket: string;
    path: string;
  };
  clientName: string;
  createdAt: string;
  deliveryDate: string;
}

const IMG_ACRILICO =
  'https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.52.24%20PM.jpeg';
const IMG_NEON =
  'https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.51.13%20PM.jpeg';
const IMG_BORDADO =
  'https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.53.05%20PM%20(1).jpeg';

export const mockOrdersAdmin: AdminOrder[] = [
  {
    id: '001',
    title: 'Letrero Neon Personalizado',
    description: 'Nombre en neon azul para local comercial',
    status: 'En diseño',
    price: 120000,
        image: {
      bucket: 'product-catalog',
      path: 'mock/neon.jpg',
    },
    clientName: 'María García',
    createdAt: '2025-03-01',
    deliveryDate: '2025-03-10',
  },
  {
    id: '002',
    title: 'Logo en Acrílico',
    description: 'Logo corporativo con corte láser',
    status: 'En producción',
    price: 85000,
    image: {
      bucket: 'product-catalog',
      path: 'mock/neon.jpg',
    },
    clientName: 'Carlos López',
    createdAt: '2025-03-02',
    deliveryDate: '2025-03-12',
  },
  {
    id: '003',
    title: 'Bordado Corporativo',
    description: 'Uniformes con logo bordado',
    status: 'Listo para entrega',
    price: 60000,
        image: {
      bucket: 'product-catalog',
      path: 'mock/neon.jpg',
    },
    clientName: 'Ana Martínez',
    createdAt: '2025-02-28',
    deliveryDate: '2025-03-08',
  },
  {
    id: '004',
    title: 'Placa Acrílica Oficina',
    description: 'Placa de identificación de área',
    status: 'En producción',
    price: 45000,
        image: {
      bucket: 'product-catalog',
      path: 'mock/neon.jpg',
    },
    clientName: 'Pedro Ramírez',
    createdAt: '2025-03-03',
    deliveryDate: '2025-03-15',
  },
  {
    id: '005',
    title: 'Letrero Neon Bar',
    description: 'Letrero decorativo para bar temático',
    status: 'Entregado',
    price: 200000,
        image: {
      bucket: 'product-catalog',
      path: 'mock/neon.jpg',
    },
    clientName: 'Laura Torres',
    createdAt: '2025-02-20',
    deliveryDate: '2025-03-01',
  },
];