import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { clearAuthSession, redirectToLogin } from '@/lib/utils/authSession';

describe('authSession', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user_name', 'fake-user');
    localStorage.setItem('role', 'fake-role');
    
    // Mock window.location
    delete (global as any).window.location;
    global.window.location = { replace: vi.fn() } as any;
  });

  afterEach(() => {
    localStorage.clear();
    global.window = originalWindow;
  });

  test('clearAuthSession removes token, user_name, and role', () => {
    clearAuthSession();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user_name')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
  });

  test('redirectToLogin calls clearAuthSession and redirects to /login', () => {
    redirectToLogin();
    expect(localStorage.getItem('token')).toBeNull();
    expect(global.window.location.replace).toHaveBeenCalledWith('/login');
  });

  test('redirectToLogin with nextPath redirects properly', () => {
    redirectToLogin('/dashboard');
    expect(global.window.location.replace).toHaveBeenCalledWith('/login?next=%2Fdashboard');
  });

  test('functions do nothing if window is undefined', () => {
    const tempWindow = global.window;
    // @ts-expect-error: we are intentionally deleting window for this test
    delete global.window;
    
    expect(() => clearAuthSession()).not.toThrow();
    expect(() => redirectToLogin()).not.toThrow();
    
    global.window = tempWindow;
  });
});
