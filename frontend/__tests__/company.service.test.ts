import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { createCompany } from '@/services/company.service';

vi.mock('axios');

describe('Company Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'company-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('createCompany', async () => {
    const payload = {
      nit: '123',
      name: 'Empresa Test',
      description: 'Desc',
      address: 'Dir',
      phone: '123'
    };
    const mockData = { id: 1, ...payload };
    vi.mocked(axios.post).mockResolvedValueOnce({ data: mockData });

    const res = await createCompany(payload);
    
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/companies'),
      payload,
      expect.objectContaining({ headers: { Authorization: 'Bearer company-token' } })
    );
    expect(res).toEqual(mockData);
  });
});
