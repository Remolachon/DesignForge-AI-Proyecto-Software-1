const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type ProductReview = {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  userName: string;
};

export type NotificationItem = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string | null;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

type ReviewsResponse = {
  items: ProductReview[];
  totalItems: number;
};

type NotificationsResponse = {
  items: NotificationItem[];
  unreadCount: number;
};

function getToken() {
  return localStorage.getItem('token');
}

export const interactionService = {
  async getProductReviews(productId: number): Promise<ReviewsResponse> {
    const response = await fetch(`${API_URL}/products/${productId}/reviews`);

    if (!response.ok) {
      throw new Error('No se pudieron cargar los comentarios');
    }

    return response.json();
  },

  async createReview(productId: number, rating: number, comment: string): Promise<ProductReview> {
    const token = getToken();

    if (!token) {
      throw new Error('AUTH_REQUIRED');
    }

    const response = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: productId,
        rating,
        comment,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.detail || 'No se pudo guardar la valoración');
    }

    return response.json();
  },

  async getNotifications(): Promise<NotificationsResponse> {
    const token = getToken();

    if (!token) {
      return { items: [], unreadCount: 0 };
    }

    const response = await fetch(`${API_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('No se pudieron cargar las notificaciones');
    }

    return response.json();
  },

  async markNotificationAsRead(notificationId: number): Promise<NotificationItem> {
    const token = getToken();

    if (!token) {
      throw new Error('AUTH_REQUIRED');
    }

    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.detail || 'No se pudo marcar la notificación');
    }

    return response.json();
  },
};