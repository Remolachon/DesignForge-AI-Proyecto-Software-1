export type OrderStatus =
  | 'En diseño'
  | 'En producción'
  | 'Listo para entrega'
  | 'Entregado';

export interface Pedido {
  id: string;
  title: string;
  description?: string;
  status: OrderStatus;
  price: number;
  imageUrl: string;
  createdAt: string;
  deliveryDate: string;
}