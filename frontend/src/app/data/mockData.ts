export type OrderStatus =
  | "En diseño"
  | "En producción"
  | "Listo para entrega"
  | "Entregado";
export type ProductType = "bordado" | "neon-flex" | "acrilico";

export interface Order {
  id: string;
  clientName: string;
  productType: ProductType;
  status: OrderStatus;
  title: string;
  imageUrl: string;
  price: number;
  createdAt: string;
  deliveryDate: string;
  description?: string;
}

export interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  productType: ProductType;
  rating: number;
  reviews: number;
  inStock: boolean;
}

export const mockOrders: Order[] = [
  {
    id: "001",
    clientName: "María García",
    productType: "neon-flex",
    status: "En producción",
    title: "Letrero Neon ",
    imageUrl:
      "https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.51.13%20PM.jpeg",
    price: 50000,
    createdAt: "2026-02-15",
    deliveryDate: "2026-02-28",
    description: "Letrero luminoso para cafetería",
  },
  {
    id: "002",
    clientName: "Juan Pérez",
    productType: "bordado",
    status: "En diseño",
    title: "Logo bordado",
    imageUrl:
      "https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.53.05%20PM.jpeg",
    price: 10000,
    createdAt: "2026-02-20",
    deliveryDate: "2026-03-05",
    description: "Logo corporativo para uniformes",
  },
  {
    id: "003",
    clientName: "Ana López",
    productType: "acrilico",
    status: "Listo para entrega",
    title: "Placa acrílica ",
    imageUrl:
      "https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.52.24%20PM.jpeg",
    price: 100000,
    createdAt: "2026-02-10",
    deliveryDate: "2026-02-22",
    description: "Placa de reconocimiento personalizada",
  },
  {
    id: "004",
    clientName: "Carlos Ruiz",
    productType: "neon-flex",
    status: "En producción",
    title: 'Letrero "Open 24/7"',
    imageUrl:
      "https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.52.24%20PM.jpeg",
    price: 40000,
    createdAt: "2026-02-18",
    deliveryDate: "2026-03-01",
  },
  {
    id: "005",
    clientName: "Laura Martínez",
    productType: "bordado",
    status: "Entregado",
    title: "Parches bordados personalizados",
    imageUrl:
      "https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.53.05%20PM.jpeg",
    price: 8000,
    createdAt: "2026-02-05",
    deliveryDate: "2026-02-15",
  },
];

export const mockMarketplaceProducts: MarketplaceProduct[] = [
  {
    id: "mp-001",
    title: 'Letrero Neon "Open"',
    description: "Letrero luminoso clásico para negocios",
    price: 50000,
    imageUrl:
      "https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.51.13%20PM.jpeg",
    productType: "neon-flex",
    rating: 4.8,
    reviews: 24,
    inStock: true,
  },
  {
    id: "mp-002",
    title: "Logo bordado empresarial",
    description: "Logo bordado de alta calidad para uniformes",
    price: 10000,
    imageUrl:
      "https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.53.05%20PM.jpeg",
    productType: "bordado",
    rating: 4.9,
    reviews: 38,
    inStock: true,
  },
  {
    id: "mp-003",
    title: "Placa acrílica transparente",
    description: "Placa acrílica premium con grabado láser",
    price: 100000,
    imageUrl:
      "https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.52.24%20PM.jpeg",
    productType: "acrilico",
    rating: 4.7,
    reviews: 16,
    inStock: true,
  },
  {
    id: "mp-004",
    title: 'Letrero Neon "Bar"',
    description:
      "Letrero neon personalizable para bares y restaurantes",
    price: 40000,
    imageUrl:
      "https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.51.13%20PM.jpeg",
    productType: "neon-flex",
    rating: 4.6,
    reviews: 19,
    inStock: false,
  },
  {
    id: "mp-005",
    title: "Set de parches bordados",
    description: "Colección de 10 parches bordados variados",
    price: 20000,
    imageUrl:
      "https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.53.05%20PM.jpeg",
    productType: "bordado",
    rating: 4.8,
    reviews: 42,
    inStock: true,
  },
  {
    id: "mp-006",
    title: "Letrero acrílico iluminado",
    description: "Letrero acrílico con retroiluminación LED",
    price: 40000,
    imageUrl:
      "https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.52.24%20PM.jpeg",
    productType: "acrilico",
    rating: 4.9,
    reviews: 31,
    inStock: true,
  },
];

export const getStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    "En diseño": "bg-blue-100 text-blue-800",
    "En producción": "bg-amber-100 text-amber-800",
    "Listo para entrega": "bg-green-100 text-green-800",
    Entregado: "bg-gray-100 text-gray-800",
  };
  return colors[status];
};

export const getProductTypeLabel = (
  type: ProductType,
): string => {
  const labels: Record<ProductType, string> = {
    bordado: "Bordado",
    "neon-flex": "Neon Flex",
    acrilico: "Acrílico",
  };
  return labels[type];
};