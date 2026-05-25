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
});
