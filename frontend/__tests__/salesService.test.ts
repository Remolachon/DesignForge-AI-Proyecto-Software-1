import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import * as salesService from '@/services/salesService';

vi.mock('axios');

describe('Sales Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'sales-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Admin Sales', () => {
    test('fetchSalesSummary', async () => {
      const mockData = { total_ventas: 1000 };
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData });

      const res = await salesService.fetchSalesSummary('month');
      
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/admin/sales/summary'),
        expect.objectContaining({ params: { filter: 'month' } })
      );
      expect(res).toEqual(mockData);
    });

    test('fetchSalesChart', async () => {
      const mockData = { filter: 'week', data: [] };
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData });

      const res = await salesService.fetchSalesChart('week');
      
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/admin/sales/chart'),
        expect.objectContaining({ params: { filter: 'week' } })
      );
      expect(res).toEqual(mockData);
    });

    test('fetchTransactions con params por defecto', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: { total: 0, items: [] } });

      await salesService.fetchTransactions({ filter: 'day' });
      
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/admin/sales/transactions'),
        expect.objectContaining({
          params: { filter: 'day', limit: 20, offset: 0, status: undefined }
        })
      );
    });
  });

  describe('Funcionario Sales', () => {
    test('fetchCompanySalesSummary sin token', async () => {
      localStorage.removeItem('token');
      vi.mocked(axios.get).mockResolvedValueOnce({ data: {} });

      await salesService.fetchCompanySalesSummary('year');
      
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/funcionario/sales/summary'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer ' }
        })
      );
    });

    test('fetchCompanySalesChart', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: {} });
      await salesService.fetchCompanySalesChart('day');
      
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/funcionario/sales/chart'),
        expect.objectContaining({ params: { filter: 'day' } })
      );
    });

    test('fetchCompanyTransactions con params completos', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: {} });
      
      await salesService.fetchCompanyTransactions({
        filter: 'month',
        status: 'APPROVED',
        limit: 50,
        offset: 10
      });
      
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/funcionario/sales/transactions'),
        expect.objectContaining({
          params: { filter: 'month', status: 'APPROVED', limit: 50, offset: 10 }
        })
      );
    });
  });
});
