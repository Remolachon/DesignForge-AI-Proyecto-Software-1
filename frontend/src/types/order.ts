export type OrderStatus =
  | 'Pendiente de pago'
  | 'Pago rechazado'
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
}

export interface AdminOrder extends BaseOrder {
  clientName: string;
  imageUrl?: string | null;
  productType?: 'bordado' | 'neon-flex' | 'acrilico';
}