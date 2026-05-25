import { render, screen } from '@testing-library/react';
import Header from '@/components/Header'; // Assuming Header is default exported, but we need to mock context
import { vi, describe, test, expect, beforeEach } from 'vitest';
import * as AuthContext from '@/context/AuthContext';

// 1. Mocking next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

// 2. Mocking AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Header Component', () => {
  beforeEach(() => {
    // Restaurar los mocks antes de cada test
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders login and register buttons when user is not authenticated', async () => {
    // Configurar el mock para usuario no autenticado
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { default: HeaderComponent } = await import('@/components/Header');
    render(<HeaderComponent />);

    // Verificar que existen los enlaces a login y registro
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
  });

  test('renders user avatar and mode toggle when user is authenticated', async () => {
    // Configurar el mock para usuario autenticado (Rol Administrador)
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: '123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    localStorage.setItem('role', 'administrador');
    localStorage.setItem('user_name', 'Test User');

    const { default: HeaderComponent } = await import('@/components/Header');
    render(<HeaderComponent />);

    // Vitest renderiza rápido, por lo que el setTimeout(..., 0) del Header
    // podría requerir que esperemos a que el estado se actualice.
    // Usamos findByText que espera (asíncrono) hasta que el elemento aparece.
    const avatarButton = await screen.findByText('T'); // "T" de "Test User"
    expect(avatarButton).toBeInTheDocument();
  });
});
