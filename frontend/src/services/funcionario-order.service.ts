import { AdminOrder, OrderStatus } from '@/types/order';
import { getApiBaseUrl } from '@/lib/utils/apiBaseUrl';

const API_URL = getApiBaseUrl();

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
  media?: OrderMedia[];
  clientName?: string | null;
  companyName?: string | null;
  productType?: string | null;
  quantity?: number | null;
  attributes?: OrderAttribute[] | null;
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

export type OrderAttribute = {
  code: string;
  label: string;
  value: string;
};

export type OrderDetail = {
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
  media?: OrderMedia[];
  clientName?: string | null;
  companyName?: string | null;
  productType?: string | null;
  productId?: number | null;
  quantity: number;
  attributes: OrderAttribute[] | null;
};

export type OrderMedia = {
  bucket: string;
  path: string;
  mediaKind?: string | null;
  mediaRole?: string | null;
  mimeType?: string | null;
  sortOrder?: number | null;
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

  if (normalized === 'pendiente') return 'Pendiente';
  if (normalized === 'pendiente de pago') return 'Pendiente de pago';
  if (normalized === 'pago rechazado') return 'Pendiente de pago';
  if (normalized === 'pago no aprobado') return 'Pendiente de pago';
  if (normalized === 'en diseño') return 'En diseño';
  if (normalized === 'en producción' || normalized === 'en produccion') return 'En producción';
  if (normalized === 'listo para entregar') return 'Listo para entregar';
  return 'Entregado';
}

function normalizeProductType(value?: string | null): 'bordado' | 'neon-flex' | 'acrilico' | 'vinilo' | 'sublimacion' {
  const normalized = (value || '').trim().toLowerCase().replace('_', '-');

  if (normalized.includes('neon')) return 'neon-flex';
  if (normalized.includes('acril')) return 'acrilico';
  if (normalized.includes('vinilo')) return 'vinilo';
  if (normalized.includes('sublim')) return 'sublimacion';
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
    media: order.media || [],
    clientName: order.clientName || 'Cliente',
    companyName: order.companyName || null,
    productType: normalizeProductType(order.productType),
    quantity: order.quantity ?? 1,
    attributes: order.attributes ?? undefined,
  };
}

export const funcionarioOrderService = {
  async getOrders(signal?: AbortSignal): Promise<AdminOrder[]> {
    const response = await fetch(`${API_URL}/orders/dashboard`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
      signal,
    });

    if (response.status === 401) throw new Error('SESSION_EXPIRED');
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

    if (response.status === 401) throw new Error('SESSION_EXPIRED');
    if (!response.ok) throw new Error('No se pudieron cargar los pedidos');

    return response.json();
  },

  async getPendingCustomOrdersPage(
    params: { page: number; pageSize: number; search?: string },
    signal?: AbortSignal,
  ) {
    const query = new URLSearchParams();
    query.set('page', String(params.page));
    query.set('page_size', String(params.pageSize));

    if (params.search) query.set('search', params.search);

    const response = await fetch(
      `${API_URL}/orders/pending-custom/page?${query.toString()}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
        signal,
      },
    );

    if (response.status === 401) throw new Error('SESSION_EXPIRED');
    if (!response.ok) throw new Error('No se pudieron cargar los pedidos pendientes');

    return response.json();
  },

  async acceptPendingCustomOrder(orderId: string): Promise<AdminOrder> {
    const response = await fetch(`${API_URL}/orders/${orderId}/accept`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.detail || 'No se pudo aceptar el pedido');
    }

    const data = await response.json();
    return toAdminOrder(data.order as DashboardOrder);
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

  async getOrderDetail(orderId: string | number): Promise<OrderDetail> {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) throw new Error('SESSION_EXPIRED');
    if (!response.ok) throw new Error('No se pudo cargar el detalle del pedido');

    return response.json() as Promise<OrderDetail>;
  },
};