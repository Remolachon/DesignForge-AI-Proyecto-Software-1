export type OrderStatus =
  | 'En diseño'
  | 'En producción'
  | 'Listo para entrega'
  | 'Entregado';

export type ProductType = 'bordado' | 'neon-flex' | 'acrilico';

export interface AdminOrder {
  id: string;
  title: string;
  description?: string;
  status: OrderStatus;
  price: number;
  imageUrl: string;
  clientName: string;
  productType: ProductType;
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
    imageUrl: IMG_NEON,
    clientName: 'María García',
    productType: 'neon-flex',
    createdAt: '2025-03-01',
    deliveryDate: '2025-04-10',
  },
  {
    id: '002',
    title: 'Logo en Acrílico',
    description: 'Logo corporativo con corte láser',
    status: 'En producción',
    price: 85000,
    imageUrl: IMG_ACRILICO,
    clientName: 'Carlos López',
    productType: 'acrilico',
    createdAt: '2025-03-02',
    deliveryDate: '2025-04-12',
  },
  {
    id: '003',
    title: 'Bordado Corporativo',
    description: 'Uniformes con logo bordado x10 unidades',
    status: 'Listo para entrega',
    price: 60000,
    imageUrl: IMG_BORDADO,
    clientName: 'Ana Martínez',
    productType: 'bordado',
    createdAt: '2025-02-28',
    deliveryDate: '2025-04-08',
  },
  {
    id: '004',
    title: 'Placa Acrílica Oficina',
    description: 'Placa de identificación de área',
    status: 'En producción',
    price: 45000,
    imageUrl: IMG_ACRILICO,
    clientName: 'Pedro Ramírez',
    productType: 'acrilico',
    createdAt: '2025-03-03',
    deliveryDate: '2025-04-15',
  },
  {
    id: '005',
    title: 'Letrero Neon Bar',
    description: 'Letrero decorativo para bar temático',
    status: 'Entregado',
    price: 200000,
    imageUrl: IMG_NEON,
    clientName: 'Laura Torres',
    productType: 'neon-flex',
    createdAt: '2025-02-20',
    deliveryDate: '2025-03-01',
  },
  {
    id: '006',
    title: 'Bordado Gorras Equipo',
    description: 'Gorras con logo del equipo deportivo',
    status: 'En diseño',
    price: 35000,
    imageUrl: IMG_BORDADO,
    clientName: 'Diego Sánchez',
    productType: 'bordado',
    createdAt: '2025-03-05',
    deliveryDate: '2025-04-20',
  },
];

export function getProductTypeLabel(type: ProductType): string {
  switch (type) {
    case 'bordado':   return 'Bordado';
    case 'neon-flex': return 'Neon Flex';
    case 'acrilico':  return 'Acrílico';
  }
}