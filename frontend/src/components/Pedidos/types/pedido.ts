export type OrderStatus =
  | 'Pendiente de pago'
  | 'En diseño'
  | 'En producción'
  | 'Listo para entregar'
  | 'Entregado';

export interface Pedido {
  id: string;
  title: string;
  description?: string;
  status: OrderStatus;
  price: number;
  imageUrl: string;
  image?: {
    bucket: string;
    path: string;
  };
  media?: {
    bucket: string;
    path: string;
    mediaKind?: string | null;
    mediaRole?: string | null;
    mimeType?: string | null;
    sortOrder?: number | null;
  }[];
  createdAt: string;
  deliveryDate: string;
  clientName?: string;
}