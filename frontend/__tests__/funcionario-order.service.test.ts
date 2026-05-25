import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { funcionarioOrderService } from '@/services/funcionario-order.service';

describe('Funcionario Order Service', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    localStorage.clear();
    localStorage.setItem('token', 'fake-token'); // auth header mock
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('arroja error si no hay token en localStorage', async () => {
    localStorage.removeItem('token');
    await expect(funcionarioOrderService.getOrders()).rejects.toThrow('No hay token de autenticación');
  });

  describe('getOrders', () => {
    test('normaliza estados y tipos de producto correctamente', async () => {
      const mockDashboardResponse = {
        orders: [
          {
            id: '1',
            title: 'Test 1',
            status: ' pendiente de PAGO ', // edge case
            price: 100,
            deliveryDate: '2023-10-10',
            createdAt: '2023-10-01',
            image: { bucket: 'a', path: 'b' },
            productType: 'NEON',
          },
          {
            id: '2',
            title: 'Test 2',
            status: 'en produccion', // edge case sin tilde
            price: 200,
            deliveryDate: '2023-10-10',
            createdAt: '2023-10-01',
            image: { bucket: 'a', path: 'b' },
            productType: ' ACRILICO_TEST ',
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardResponse
      });

      const orders = await funcionarioOrderService.getOrders();

      expect(orders[0].status).toBe('Pendiente de pago');
      expect(orders[0].productType).toBe('neon-flex');

      expect(orders[1].status).toBe('En producción');
      expect(orders[1].productType).toBe('acrilico');
    });

    test('arroja error si response.ok es falso', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      await expect(funcionarioOrderService.getOrders()).rejects.toThrow('Error cargando pedidos');
    });
  });

  describe('getFuncionarioOrdersPage', () => {
    test('construye la URL con search y status correctamente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      });

      await funcionarioOrderService.getFuncionarioOrdersPage({ page: 1, pageSize: 10, search: 'juan', status: 'Pendiente' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1&page_size=10&search=juan&status=Pendiente'),
        expect.any(Object)
      );
    });

    test('falla con mensaje descriptivo', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      await expect(funcionarioOrderService.getFuncionarioOrdersPage({ page: 1, pageSize: 10 }))
        .rejects.toThrow('No se pudieron cargar los pedidos');
    });
  });

  describe('acceptPendingCustomOrder', () => {
    test('llama a PATCH y retorna orden', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ order: { id: '123', status: 'En diseño', image: {} } })
      });

      const result = await funcionarioOrderService.acceptPendingCustomOrder('123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders/123/accept'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(result.id).toBe('123');
      expect(result.status).toBe('En diseño');
    });

    test('extrae mensaje de error del json si falla', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Custom error from backend' })
      });

      await expect(funcionarioOrderService.acceptPendingCustomOrder('123'))
        .rejects.toThrow('Custom error from backend');
    });
  });

  describe('updateStatus', () => {
    test('envia nuevo estado y retorna orden actualizada', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ order: { id: '1', status: 'Entregado', image: {} } })
      });

      const result = await funcionarioOrderService.updateStatus('1', 'Entregado');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders/1/status'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'Entregado' })
        })
      );
      expect(result.status).toBe('Entregado');
    });
  });

  describe('getOrderDetail', () => {
    test('retorna el detalle exitosamente', async () => {
      const mockDetail = { id: '99', title: 'Test Detail' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetail
      });

      const result = await funcionarioOrderService.getOrderDetail('99');
      expect(result).toEqual(mockDetail);
    });

    test('arroja error si falla', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      await expect(funcionarioOrderService.getOrderDetail('99'))
        .rejects.toThrow('No se pudo cargar el detalle del pedido');
    });
  });
});
