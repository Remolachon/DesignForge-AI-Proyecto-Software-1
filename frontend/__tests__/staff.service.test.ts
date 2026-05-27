import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import * as staffService from '@/services/staff.service';

vi.mock('axios');

describe('Staff Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'staff-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('fetchStaff', async () => {
    const mockData = [{ id: 1, email: 'test@test.com' }];
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockData });
    const res = await staffService.fetchStaff();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/staff/'), expect.any(Object));
    expect(res).toEqual(mockData);
  });

  test('assignFuncionarioRole', async () => {
    const mockData = { message: 'ok', user_id: 1 };
    vi.mocked(axios.post).mockResolvedValueOnce({ data: mockData });
    const res = await staffService.assignFuncionarioRole(1);
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/staff/1/assign'), {}, expect.any(Object));
    expect(res).toEqual(mockData);
  });

  test('revokeFuncionarioRole', async () => {
    const mockData = { message: 'ok', user_id: 1 };
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: mockData });
    const res = await staffService.revokeFuncionarioRole(1);
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/staff/1/revoke'), expect.any(Object));
    expect(res).toEqual(mockData);
  });

  test('inviteFuncionario', async () => {
    const mockData = { message: 'invited', user_id: 2 };
    vi.mocked(axios.post).mockResolvedValueOnce({ data: mockData });
    const res = await staffService.inviteFuncionario('test@invite.com');
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/staff/invite'), { email: 'test@invite.com' }, expect.any(Object));
    expect(res).toEqual(mockData);
  });

  test('removeFuncionario', async () => {
    const mockData = { message: 'removed', user_id: 1 };
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: mockData });
    const res = await staffService.removeFuncionario(1);
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/staff/1/remove'), expect.any(Object));
    expect(res).toEqual(mockData);
  });

  test('handles 401 error and throws SESSION_EXPIRED', async () => {
    const error401 = new Error('Request failed with status code 401');
    (error401 as any).response = { status: 401 };
    
    // Configurar axios.isAxiosError para que devuelva true cuando sea error401
    vi.mocked(axios.isAxiosError).mockImplementation((payload: any) => payload === error401);

    vi.mocked(axios.get).mockRejectedValueOnce(error401);
    await expect(staffService.fetchStaff()).rejects.toThrow('SESSION_EXPIRED');

    vi.mocked(axios.post).mockRejectedValueOnce(error401);
    await expect(staffService.assignFuncionarioRole(1)).rejects.toThrow('SESSION_EXPIRED');

    vi.mocked(axios.delete).mockRejectedValueOnce(error401);
    await expect(staffService.revokeFuncionarioRole(1)).rejects.toThrow('SESSION_EXPIRED');

    vi.mocked(axios.post).mockRejectedValueOnce(error401);
    await expect(staffService.inviteFuncionario('test@invite.com')).rejects.toThrow('SESSION_EXPIRED');

    vi.mocked(axios.delete).mockRejectedValueOnce(error401);
    await expect(staffService.removeFuncionario(1)).rejects.toThrow('SESSION_EXPIRED');
  });

  test('handles other errors normally', async () => {
    const genericError = new Error('Network Error');
    vi.mocked(axios.isAxiosError).mockImplementation(() => false);
    
    vi.mocked(axios.get).mockRejectedValueOnce(genericError);
    await expect(staffService.fetchStaff()).rejects.toThrow('Network Error');

    vi.mocked(axios.post).mockRejectedValueOnce(genericError);
    await expect(staffService.assignFuncionarioRole(1)).rejects.toThrow('Network Error');

    vi.mocked(axios.delete).mockRejectedValueOnce(genericError);
    await expect(staffService.revokeFuncionarioRole(1)).rejects.toThrow('Network Error');

    vi.mocked(axios.post).mockRejectedValueOnce(genericError);
    await expect(staffService.inviteFuncionario('test@invite.com')).rejects.toThrow('Network Error');

    vi.mocked(axios.delete).mockRejectedValueOnce(genericError);
    await expect(staffService.removeFuncionario(1)).rejects.toThrow('Network Error');
  });
});
