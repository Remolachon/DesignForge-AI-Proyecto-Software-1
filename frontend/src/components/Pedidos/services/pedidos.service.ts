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

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');

  return {
    Authorization: `Bearer ${token}`,
  };
}

export type PaginatedPedidos = {
  items: Pedido[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export const pedidosService = {
  async getMyOrders(): Promise<Pedido[]> {
    const res = await fetch(`${API_URL}/orders/my-orders`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error('Error cargando pedidos');

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

  async getMyOrdersPage(
    params: { page: number; pageSize: number; search?: string; status?: string },
    signal?: AbortSignal,
  ): Promise<PaginatedPedidos> {
    const query = new URLSearchParams();
    query.set('page', String(params.page));
    query.set('page_size', String(params.pageSize));

    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'all') query.set('status', params.status);

    const response = await fetch(`${API_URL}/orders/my-orders/page?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal,
    });

    if (!response.ok) throw new Error('No se pudieron cargar los pedidos');

    return response.json();
  },
};