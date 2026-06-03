import { Pedido } from '../types/pedido';
import { getApiBaseUrl } from '@/lib/utils/apiBaseUrl';
import { cachedRequest, invalidateRequestCache } from '@/services/requestCache';

const API_URL = getApiBaseUrl();

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
  companyName?: string | null;
};

async function getAuthHeaders() {
  let token = localStorage.getItem('token');

  if (!token) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 60));
      token = localStorage.getItem('token');
      if (token) break;
    }
  }

  if (!token) throw new Error('SESSION_EXPIRED');

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
    return cachedRequest('orders:my-orders', 8000, async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/orders/my-orders`, {
        headers,
      });

      if (res.status === 401) throw new Error('SESSION_EXPIRED');
      if (!res.ok) throw new Error('No se pudieron cargar los pedidos');

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
    });
  },

  async getMyOrdersPage(
    params: { page: number; pageSize: number; search?: string; status?: string },
    signal?: AbortSignal,
  ): Promise<PaginatedPedidos> {
    const cacheKey = [
      'orders:my-orders-page',
      params.page,
      params.pageSize,
      params.search || '',
      params.status || 'all',
    ].join(':');

    const query = new URLSearchParams();
    query.set('page', String(params.page));
    query.set('page_size', String(params.pageSize));

    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'all') query.set('status', params.status);

    return cachedRequest(cacheKey, 8000, async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/orders/my-orders/page?${query.toString()}`, {
        method: 'GET',
        headers,
        signal,
      });

      if (response.status === 401) throw new Error('SESSION_EXPIRED');
      if (!response.ok) throw new Error('No se pudieron cargar los pedidos');

      return response.json();
    });
  },

  invalidatePedidosCache() {
    invalidateRequestCache('orders:my-orders');
  },

  async downloadInvoice(orderId: string | number): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/orders/${orderId}/invoice`, {
      method: 'GET',
      headers,
    });

    if (response.status === 401) throw new Error('SESSION_EXPIRED');
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Error al descargar la factura');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factura_pedido_${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};