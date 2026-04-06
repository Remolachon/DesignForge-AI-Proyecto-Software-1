import { AdminOrder, OrderStatus } from '@/types/order';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type DashboardOrder = {
  id: string;
  title: string;
  status: string;
  price: number;
  deliveryDate: string;
  createdAt: string;
  imageUrl?: string | null;
  image: {
    bucket: string;
    path: string;
  };
  clientName?: string | null;
  productType?: string | null;
};

type DashboardResponse = {
  orders: DashboardOrder[];
};

export type PaginatedOrders<T> = {
  items: T[];
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

function canonicalStatus(status: string): OrderStatus {
  const normalized = status.trim().toLowerCase();

  if (normalized === 'en diseño') return 'En diseño';
  if (normalized === 'en producción' || normalized === 'en produccion') return 'En producción';
  if (normalized === 'listo para entregar') return 'Listo para entregar';
  return 'Entregado';
}

function normalizeProductType(value?: string | null): 'bordado' | 'neon-flex' | 'acrilico' {
  const normalized = (value || '').trim().toLowerCase().replace('_', '-');

  if (normalized.includes('neon')) return 'neon-flex';
  if (normalized.includes('acril')) return 'acrilico';
  return 'bordado';
}

function toAdminOrder(order: DashboardOrder): AdminOrder {
  return {
    id: order.id,
    title: order.title,
    status: canonicalStatus(order.status),
    price: order.price,
    deliveryDate: order.deliveryDate,
    createdAt: order.createdAt,
    image: order.image,
    imageUrl: order.imageUrl || undefined,
    clientName: order.clientName || 'Cliente',
    productType: normalizeProductType(order.productType),
  };
}

export const funcionarioOrderService = {
  async getOrders(): Promise<AdminOrder[]> {
    const response = await fetch(`${API_URL}/orders/dashboard`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Error cargando pedidos');

    const data: DashboardResponse = await response.json();
    return data.orders.map(toAdminOrder);
  },

  async getFuncionarioOrdersPage(
    params: { page: number; pageSize: number; search?: string; status?: string },
    signal?: AbortSignal,
  ) {
    const query = new URLSearchParams();
    query.set('page', String(params.page));
    query.set('page_size', String(params.pageSize));

    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'all') query.set('status', params.status);

    const response = await fetch(
      `${API_URL}/orders/funcionario-orders/page?${query.toString()}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
        signal,
      },
    );

    if (!response.ok) throw new Error('No se pudieron cargar los pedidos');

    return response.json();
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<AdminOrder> {
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.detail || 'No se pudo actualizar el estado');
    }

    const data = await response.json();
    return toAdminOrder(data.order as DashboardOrder);
  },
};