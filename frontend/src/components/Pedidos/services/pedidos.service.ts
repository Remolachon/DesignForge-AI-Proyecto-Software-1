import { Pedido } from '../types/pedido';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type DashboardOrder = {
  id: string;
  title: string;
  status: string;
  price: number;
  deliveryDate: string;
  createdAt: string;
  imageUrl?: string | null;
  image?: {
    bucket: string;
    path: string;
  };
  clientName?: string | null;
};

export const pedidosService = {
  async getMyOrders(): Promise<Pedido[]> {
    const token = localStorage.getItem('token');

    if (!token) {
      return [];
    }

    const res = await fetch(`${API_URL}/orders/my-orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Error cargando pedidos');
    }

    const data: DashboardOrder[] = await res.json();

    return data.map((order) => ({
      id: order.id,
      title: order.title,
      description: order.clientName ?? undefined,
      status: order.status as Pedido['status'],
      price: order.price,
      imageUrl: order.imageUrl || '',
      image: order.image,
      createdAt: order.createdAt,
      deliveryDate: order.deliveryDate,
      clientName: order.clientName ?? undefined,
    }));
  },
};