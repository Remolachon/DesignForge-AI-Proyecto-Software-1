import { getApiBaseUrl } from "@/lib/utils/apiBaseUrl";

const API_URL = getApiBaseUrl();

function getAuthToken(): string {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("AUTH_REQUIRED");
  }
  return token;
}

function handleUnauthorized(): never {
  localStorage.removeItem("token");
  localStorage.removeItem("user_name");
  localStorage.removeItem("role");
  throw new Error("SESSION_EXPIRED");
}

async function parseError(res: Response): Promise<never> {
  if (res.status === 401) {
    handleUnauthorized();
  }

  let detail = "No se pudo completar la operación";
  try {
    const data = await res.json();
    
    // Handle Pydantic validation errors (array of error objects)
    if (Array.isArray(data?.detail)) {
      const errors = data.detail
        .map((err: any) => {
          const field = Array.isArray(err.loc) ? err.loc.join('.') : 'unknown';
          const msg = err.msg || 'Invalid field';
          return `${field}: ${msg}`;
        })
        .join('; ');
      detail = errors || detail;
    } else if (typeof data?.detail === 'string') {
      detail = data.detail;
    } else if (data?.message) {
      detail = data.message;
    }
  } catch {
    // ignore parse errors
  }

  throw new Error(detail);
}

export type CreateCustomOrderPayload = {
  product_type: string;
  image_url: string | null;
  quantity: number;
  shape_id: number;
  shape_name: string;
  attributes: Record<string, { label: string; value: string }>;
};

export interface CreateMarketplaceOrderPayload {
  product_id: number;
  quantity?: number;
  attributes?: Record<string, string>;
};

export type CreateOrderResponse = {
  message: string;
  order_id: number;
  total_amount: number;
  payment_url?: string;
  payment_action_url?: string;
  payment_payload?: Record<string, string>;
  payment_reference?: string;
};

export type PaymentStatusResponse = {
  status: string;
  order_id?: number;
  payment_status?: string;
  payment_reference?: string;
  payment_approved_at?: string | null;
  message?: string;
};

export const paymentService = {
  async createCustomOrder(payload: CreateCustomOrderPayload): Promise<CreateOrderResponse> {
    const token = getAuthToken();

    const res = await fetch(`${API_URL}/orders/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      await parseError(res);
    }

    return res.json();
  },

  async createMarketplaceOrder(payload: CreateMarketplaceOrderPayload): Promise<CreateOrderResponse> {
    const token = getAuthToken();

    const res = await fetch(`${API_URL}/orders/marketplace`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      await parseError(res);
    }

    return res.json();
  },

  async getPaymentStatus(orderId: number): Promise<PaymentStatusResponse> {
    const token = getAuthToken();

    const res = await fetch(`${API_URL}/orders/${orderId}/payment-status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      await parseError(res);
    }

    return res.json();
  },

  async generatePaymentUrl(orderId: number): Promise<CreateOrderResponse> {
    const token = getAuthToken();

    const res = await fetch(`${API_URL}/orders/${orderId}/payment-url`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      await parseError(res);
    }

    return res.json();
  },

  submitToPayU(actionUrl: string, payload: Record<string, string>) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = actionUrl;
    form.style.display = "none";

    Object.entries(payload).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  },
};
