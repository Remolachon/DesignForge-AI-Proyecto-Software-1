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

type OrdersPageResponse = {
  items: DashboardOrder[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type PaginatedPedidos = {
  items: Pedido[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
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

  async getMyOrdersPage(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedPedidos> {
    const token = localStorage.getItem('token');

    if (!token) {
      return {
        items: [],
        page: 1,
        pageSize: params.pageSize,
        totalItems: 0,
        totalPages: 1,
      };
    }

    const query = new URLSearchParams({
      page: String(params.page),
      page_size: String(params.pageSize),
    });

    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.status && params.status !== 'all') query.set('status', params.status);

    const res = await fetch(`${API_URL}/orders/my-orders/page?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Error cargando pedidos');
    }

    const data: OrdersPageResponse = await res.json();

    return {
      page: data.page,
      pageSize: data.pageSize,
      totalItems: data.totalItems,
      totalPages: data.totalPages,
      items: data.items.map((order) => ({
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
      })),
    };
  },
};