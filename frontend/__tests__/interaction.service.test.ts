import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { interactionService } from '@/services/interaction.service';

describe('Interaction Service', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    localStorage.setItem('token', 'interaction-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('getProductReviews', () => {
    test('retorna reviews exitosamente', async () => {
      const mockData = { items: [{ id: 1 }], totalItems: 1 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const res = await interactionService.getProductReviews(10);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/products/10/reviews'));
      expect(res).toEqual(mockData);
    });

    test('arroja error si falla', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      await expect(interactionService.getProductReviews(10)).rejects.toThrow('No se pudieron cargar los comentarios');
    });
  });

  describe('createReview', () => {
    test('arroja error de autorizacion si no hay token', async () => {
      localStorage.removeItem('token');
      await expect(interactionService.createReview(1, 5, 'Good')).rejects.toThrow('AUTH_REQUIRED');
    });

    test('crea review exitosamente', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 99 }) });
      const res = await interactionService.createReview(1, 5, 'Good');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/reviews'),
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ product_id: 1, rating: 5, comment: 'Good' }) })
      );
      expect(res.id).toBe(99);
    });

    test('extrae error del backend si falla', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ detail: 'Custom review error' }) });
      await expect(interactionService.createReview(1, 5, 'Good')).rejects.toThrow('Custom review error');
    });
  });

  describe('getNotifications', () => {
    test('retorna array vacio si no hay token', async () => {
      localStorage.removeItem('token');
      const res = await interactionService.getNotifications();
      expect(res).toEqual({ items: [], unreadCount: 0 });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('retorna notificaciones si hay token', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [{ id: 1 }], unreadCount: 1 }) });
      const res = await interactionService.getNotifications();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/notifications'), expect.any(Object));
      expect(res.items).toHaveLength(1);
    });

    test('lanza error si la request falla', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      await expect(interactionService.getNotifications()).rejects.toThrow('No se pudieron cargar las notificaciones');
    });
  });

  describe('markNotificationAsRead', () => {
    test('arroja error de autorizacion', async () => {
      localStorage.removeItem('token');
      await expect(interactionService.markNotificationAsRead(1)).rejects.toThrow('AUTH_REQUIRED');
    });

    test('marca como leida', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, isRead: true }) });
      const res = await interactionService.markNotificationAsRead(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/1/read'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(res.isRead).toBe(true);
    });

    test('extrae error del backend si falla', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ detail: 'Already read' }) });
      await expect(interactionService.markNotificationAsRead(1)).rejects.toThrow('Already read');
    });
  });
});
