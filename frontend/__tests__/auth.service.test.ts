import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { 
  login, 
  register, 
  logout, 
  syncRoleFromBackend, 
  getDashboardByRole, 
  startGoogleAuth, 
  completeGoogleAuth 
} from '@/services/auth.service';
import { supabaseClient } from '@/lib/supabase/supabaseClient';

// Mock dependencias externas
vi.mock('axios');
vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    auth: {
      signInWithOAuth: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      getSession: vi.fn()
    }
  }
}));

describe('Auth Service', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock window.location para pruebas de redirección y hash
    delete (window as any).location;
    window.location = { 
      ...originalLocation, 
      origin: 'http://localhost',
      href: '',
      hash: ''
    } as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  describe('getDashboardByRole', () => {
    test('retorna rutas correctas según el rol', () => {
      expect(getDashboardByRole('administrador')).toBe('/administrador/dashboard');
      expect(getDashboardByRole('funcionario_adm')).toBe('/funcionario-adm/dashboard');
      expect(getDashboardByRole('funcionario')).toBe('/funcionario/dashboard');
      expect(getDashboardByRole('cliente')).toBe('/cliente/dashboard');
      expect(getDashboardByRole(undefined)).toBe('/cliente/dashboard');
    });
  });

  describe('login & register', () => {
    test('login exitoso guarda datos en localStorage', async () => {
      const mockResponse = {
        data: {
          access_token: 'fake-token',
          first_name: 'John',
          last_name: 'Doe',
          role: 'cliente'
        }
      };
      
      vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

      const result = await login('test@test.com', 'password');

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        { email: 'test@test.com', password: 'password' },
        expect.any(Object)
      );
      expect(localStorage.getItem('token')).toBe('fake-token');
      expect(localStorage.getItem('user_name')).toBe('John Doe');
      expect(localStorage.getItem('role')).toBe('cliente');
      expect(result).toEqual(mockResponse.data);
    });

    test('register envía datos correctamente', async () => {
      const mockResponse = { data: { id: 1, email: 'test@test.com' } };
      vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

      const result = await register('John', 'Doe', '123', 'test@test.com', 'pass', 'pass');

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/register'),
        {
          first_name: 'John',
          last_name: 'Doe',
          phone: '123',
          email: 'test@test.com',
          password: 'pass',
          confirm_password: 'pass'
        }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('logout', () => {
    test('limpia localStorage y llama al backend', async () => {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user_name', 'John');
      localStorage.setItem('role', 'cliente');

      vi.mocked(axios.post).mockResolvedValueOnce({});

      await logout();

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/logout'),
        {},
        { headers: { Authorization: 'Bearer fake-token' } }
      );
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user_name')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
    });

    test('limpia localStorage incluso si el backend falla (token expirado)', async () => {
      localStorage.setItem('token', 'expired-token');
      
      // Simulamos que el backend rechaza el logout porque el token ya expiró (401)
      vi.mocked(axios.post).mockRejectedValueOnce(new Error('Unauthorized'));

      await logout();

      // Debe limpiar igual localmente
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('syncRoleFromBackend', () => {
    test('sincroniza el rol si hay token válido', async () => {
      localStorage.setItem('token', 'valid-token');
      vi.mocked(axios.get).mockResolvedValueOnce({ data: { role: 'administrador' } });

      const result = await syncRoleFromBackend();

      expect(result).toBe('administrador');
      expect(localStorage.getItem('role')).toBe('administrador');
    });

    test('retorna null si falla la petición HTTP (token expirado/nulo)', async () => {
      localStorage.setItem('token', 'expired-token');
      vi.mocked(axios.get).mockRejectedValueOnce(new Error('Unauthorized'));

      const result = await syncRoleFromBackend();

      expect(result).toBeNull();
    });

    test('retorna null rápido si no hay token local', async () => {
      const result = await syncRoleFromBackend();
      expect(result).toBeNull();
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe('Google OAuth', () => {
    test('startGoogleAuth llama a supabase y redirige', async () => {
      vi.mocked(supabaseClient.auth.signInWithOAuth).mockResolvedValueOnce({
        data: { url: 'https://google.com/auth', provider: 'google' },
        error: null
      } as any);

      await startGoogleAuth('login');

      expect(supabaseClient.auth.signInWithOAuth).toHaveBeenCalled();
      expect(window.location.href).toBe('https://google.com/auth');
    });

    test('startGoogleAuth lanza error si supabase falla', async () => {
      const mockError = new Error('Supabase Error');
      vi.mocked(supabaseClient.auth.signInWithOAuth).mockResolvedValueOnce({
        data: { url: null, provider: 'google' },
        error: mockError as any
      });

      await expect(startGoogleAuth('login')).rejects.toThrow('Supabase Error');
    });

    test('completeGoogleAuth falla explícitamente con SESSION_EXPIRED si no hay token de supabase', async () => {
      // Rama: sin code, sin fragment, getSession retorna null/sin token
      vi.mocked(supabaseClient.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null
      } as any);

      await expect(completeGoogleAuth()).rejects.toThrow('SESSION_EXPIRED');
    });
    
    test('completeGoogleAuth falla si hay error interno en exchangeCodeForSession', async () => {
      const mockError = new Error('Exchange failed');
      vi.mocked(supabaseClient.auth.exchangeCodeForSession).mockResolvedValueOnce({
        data: { session: null, user: null },
        error: mockError as any
      });

      await expect(completeGoogleAuth('auth-code')).rejects.toThrow('Exchange failed');
    });

    test('completeGoogleAuth funciona con código de autorización exitoso', async () => {
      // Rama: code presente
      vi.mocked(supabaseClient.auth.exchangeCodeForSession).mockResolvedValueOnce({
        data: { session: { access_token: 'google-token' }, user: null },
        error: null
      } as any);

      const backendResponse = {
        data: {
          access_token: 'backend-token',
          first_name: 'Google',
          last_name: 'User',
          role: 'cliente'
        }
      };
      vi.mocked(axios.post).mockResolvedValueOnce(backendResponse);

      const result = await completeGoogleAuth('auth-code');

      expect(supabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('auth-code');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/google-oauth'),
        { access_token: 'google-token' }
      );
      expect(localStorage.getItem('token')).toBe('backend-token');
      expect(result).toEqual(backendResponse.data);
    });
  });
});
