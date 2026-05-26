import { waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import * as authService from '@/services/auth.service';
import React from 'react';

// Mock the backend logout service
vi.mock('@/services/auth.service', () => ({
  logout: vi.fn(),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('useAuth throws error when used outside AuthProvider', () => {
    // Suppress console.error for this specific expected throw to keep test output clean
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used inside AuthProvider');
    
    consoleSpy.mockRestore();
  });

  test('AuthProvider initializes user from localStorage', () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('email', 'test@test.com');
    localStorage.setItem('name', 'John');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual({
      email: 'test@test.com',
      name: 'John',
    });
  });

  test('AuthProvider leaves user null if localStorage is incomplete', () => {
    localStorage.setItem('token', 'fake-token');
    // Missing email and name

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
  });

  test('login sets user state', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@login.com', 'password123');
    });

    expect(result.current.user).toEqual({ email: 'test@login.com' });
  });

  test('register sets user state', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('Jane', 'jane@test.com', 'password123');
    });

    expect(result.current.user).toEqual({ name: 'Jane', email: 'jane@test.com' });
  });

  test('logout calls service, clears storage and state', async () => {
    localStorage.setItem('token', 'fake');
    localStorage.setItem('email', 'fake');
    localStorage.setItem('name', 'fake');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Ensure state was populated from local storage first
    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('email')).toBeNull();
    expect(localStorage.getItem('name')).toBeNull();
    expect(result.current.user).toBeNull();
  });
});
