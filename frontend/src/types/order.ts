export type OrderStatus =
  | 'Pendiente de pago'
  | 'En diseño'
  | 'En producción'
  | 'Listo para entregar'
  | 'Entregado';

export interface BaseOrder {
  id: string;
  title: string;
  status: OrderStatus;
  price: number;
  deliveryDate: string;
  createdAt: string;
  imageUrl?: string | null;
  image: {
    bucket: string;
    path: string;
  };
  media?: OrderMedia[];
  productId?: number | null;
  quantity?: number | null;
  parameters?: {
    length: number;
    height: number;
    width: number;
    material: string;
  } | null;
}

export interface AdminOrder extends BaseOrder {
  clientName: string;
  companyName?: string | null;
  imageUrl?: string | null;
  productType?: 'bordado' | 'neon-flex' | 'acrilico';
}

export interface OrderMedia {
  bucket: string;
  path: string;
  mediaKind?: string | null;
  mediaRole?: string | null;
  mimeType?: string | null;
  sortOrder?: number | null;
}