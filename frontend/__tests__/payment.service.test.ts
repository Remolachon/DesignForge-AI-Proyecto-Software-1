import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { paymentService } from '@/services/payment.service';

describe('Payment Service', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockClear();
    vi.stubGlobal('fetch', mockFetch);
    localStorage.setItem('token', 'fake-payment-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Error Parsing', () => {
    test('maneja error 401 y limpia localStorage', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 401,
        ok: false,
        json: async () => ({ detail: 'Token expired' })
      });

      await expect(paymentService.getPaymentStatus(1)).rejects.toThrow('SESSION_EXPIRED');
      expect(localStorage.getItem('token')).toBeNull();
    });

    test('parsea array de errores de Pydantic', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 422,
        ok: false,
        json: async () => ({
          detail: [
            { loc: ['body', 'quantity'], msg: 'Must be greater than 0' }
          ]
        })
      });

      await expect(paymentService.getPaymentStatus(1)).rejects.toThrow('body.quantity: Must be greater than 0');
    });

    test('parsea error string en detail', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        ok: false,
        json: async () => ({ detail: 'Custom detail error' })
      });
      await expect(paymentService.getPaymentStatus(1)).rejects.toThrow('Custom detail error');
    });

    test('parsea error en message', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        ok: false,
        json: async () => ({ message: 'Custom message error' })
      });
      await expect(paymentService.getPaymentStatus(1)).rejects.toThrow('Custom message error');
    });

    test('falla por default si falla el parsing', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 500,
        ok: false,
        json: async () => { throw new Error('Unparseable'); }
      });
      await expect(paymentService.getPaymentStatus(1)).rejects.toThrow('No se pudo completar la operación');
    });
  });

  describe('Endpoints', () => {
    test('createCustomOrder', async () => {
      const payload = { product_type: 'neon', image_url: 'a', quantity: 1, shape_id: 1, shape_name: 'b', attributes: {} };
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ order_id: 99 }) });

      const res = await paymentService.createCustomOrder(payload);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/orders/'), expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }));
      expect(res.order_id).toBe(99);
    });

    test('createMarketplaceOrder', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ order_id: 88 }) });
      const res = await paymentService.createMarketplaceOrder({ product_id: 1 });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/orders/marketplace'), expect.objectContaining({ method: 'POST' }));
      expect(res.order_id).toBe(88);
    });

    test('generatePaymentUrl', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ payment_url: 'http://pay' }) });
      const res = await paymentService.generatePaymentUrl(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/orders/1/payment-url'), expect.objectContaining({ method: 'POST' }));
      expect(res.payment_url).toBe('http://pay');
    });
  });

  describe('submitToPayU', () => {
    test('crea form y submit', () => {
      // Mock document.createElement y form.submit
      const formMock = {
        method: '',
        action: '',
        style: { display: '' },
        appendChild: vi.fn(),
        submit: vi.fn(),
      };
      const inputMock = { type: '', name: '', value: '' };

      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'form') return formMock as any;
        if (tagName === 'input') return inputMock as any;
        return {} as any;
      });
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);

      paymentService.submitToPayU('http://payu.test', { accountId: '123' });

      expect(formMock.action).toBe('http://payu.test');
      expect(formMock.method).toBe('POST');
      expect(formMock.appendChild).toHaveBeenCalledTimes(1);
      expect(inputMock.name).toBe('accountId');
      expect(inputMock.value).toBe('123');
      expect(appendChildSpy).toHaveBeenCalledWith(formMock);
      expect(formMock.submit).toHaveBeenCalledTimes(1);
    });
  });
});
