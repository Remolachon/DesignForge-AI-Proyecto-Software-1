import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { AdminService } from '@/services/admin.service';

vi.mock('axios');

describe('Admin Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'admin-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('getAuthHeaders usa token si existe', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: {} });
    await AdminService.getDashboard();
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/admin/dashboard'),
      expect.objectContaining({ headers: { Authorization: 'Bearer admin-token' } })
    );
  });

  test('getAuthHeaders usa vacio si no hay token', async () => {
    localStorage.removeItem('token');
    vi.mocked(axios.get).mockResolvedValueOnce({ data: {} });
    await AdminService.getDashboard();
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/admin/dashboard'),
      expect.objectContaining({ headers: { Authorization: 'Bearer ' } })
    );
  });

  test('getDashboard retorna stats y orders', async () => {
    const mockData = { stats: { total_sales: 100 }, orders: [] };
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData });
    const res = await AdminService.getDashboard();
    expect(res).toEqual(mockData);
  });

  test('getCompanies pasa param filter', async () => {
    const mockData = [{ id: 1 }];
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData });
    const res = await AdminService.getCompanies('active');
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/companies/admin'),
      expect.objectContaining({ params: { filter: 'active' } })
    );
    expect(res).toEqual(mockData);
  });

  test('getCompanyCounts', async () => {
    const mockData = { total: 10 };
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData });
    const res = await AdminService.getCompanyCounts();
    expect(res).toEqual(mockData);
  });

  test('updateCompanyStatus usa PATCH', async () => {
    const mockData = { id: 1, status: 'APPROVED' };
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: mockData });
    const res = await AdminService.updateCompanyStatus(1, 'APPROVED');
    expect(axios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/companies/1/status'),
      { status: 'APPROVED' },
      expect.any(Object)
    );
    expect(res).toEqual(mockData);
  });

  test('deleteCompany usa DELETE', async () => {
    const mockData = { id: 1, status: 'DELETED' };
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: mockData });
    const res = await AdminService.deleteCompany(1);
    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining('/companies/1'),
      expect.any(Object)
    );
    expect(res).toEqual(mockData);
  });

  test('getOrdersPage con params por defecto', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { items: [] } });
    await AdminService.getOrdersPage();
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/admin/orders/page'),
      expect.objectContaining({
        params: { page: 1, page_size: 10, search: undefined, status: undefined }
      })
    );
  });

  test('getOrdersPage con params especificos', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { items: [] } });
    await AdminService.getOrdersPage({ page: 2, pageSize: 20, search: 'test', status: 'pending' });
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/admin/orders/page'),
      expect.objectContaining({
        params: { page: 2, page_size: 20, search: 'test', status: 'pending' }
      })
    );
  });
});
