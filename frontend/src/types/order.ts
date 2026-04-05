export type OrderStatus =
  | 'En diseño'
  | 'En producción'
  | 'Listo para entrega'
  | 'Entregado';

export interface BaseOrder {
  id: string;
  title: string;
  status: OrderStatus;
  price: number;
  deliveryDate: string;
  createdAt: string;
  image: {
    bucket: string;
    path: string;
  };
}

export interface AdminOrder extends BaseOrder {
  clientName: string;
}