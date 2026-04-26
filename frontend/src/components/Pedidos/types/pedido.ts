export type OrderStatus =
  | 'Pendiente de pago'
  | 'Pago rechazado'
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
  createdAt: string;
  deliveryDate: string;
  clientName?: string;
}