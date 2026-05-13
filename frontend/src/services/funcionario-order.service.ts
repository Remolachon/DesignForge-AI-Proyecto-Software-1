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
  media?: OrderMedia[];
  clientName?: string | null;
  companyName?: string | null;
  productType?: string | null;
  quantity?: number | null;
  parameters?: OrderParameters | null;
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

export type OrderParameters = {
  length: number;
  height: number;
  width: number;
  material: string;
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
  quantity: number;
  parameters: OrderParameters | null;
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

  if (normalized === 'pendiente de pago') return 'Pendiente de pago';
  if (normalized === 'pago rechazado') return 'Pendiente de pago';
  if (normalized === 'pago no aprobado') return 'Pendiente de pago';
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
    media: order.media || [],
    clientName: order.clientName || 'Cliente',
    companyName: order.companyName || null,
    productType: normalizeProductType(order.productType),
    quantity: order.quantity ?? 1,
    parameters: order.parameters || null,
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

  async getOrderDetail(orderId: string | number): Promise<OrderDetail> {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error('No se pudo cargar el detalle del pedido');

    return response.json() as Promise<OrderDetail>;
  },
};