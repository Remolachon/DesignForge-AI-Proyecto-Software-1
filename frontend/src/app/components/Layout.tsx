import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Bell, Package, LayoutDashboard } from 'lucide-react';
import { Button } from './Button';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return <>{children}</>;
  }

  const dashboardPath = user.role === 'funcionario' || user.role === 'admin' 
    ? '/funcionario/dashboard' 
    : '/cliente/dashboard';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={dashboardPath} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-magenta rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-primary">LukArt</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to={dashboardPath}
                className="flex items-center gap-2 text-foreground hover:text-accent transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              
              {user.role === 'cliente' && (
                <>
                  <Link 
                    to="/cliente/crear-pedido"
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    Crear Pedido
                  </Link>
                  <Link 
                    to="/marketplace"
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    Marketplace
                  </Link>
                  <Link 
                    to="/cliente/pedidos"
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    Mis Pedidos
                  </Link>
                </>
              )}

              {(user.role === 'funcionario' || user.role === 'admin') && (
                <>
                  <Link 
                    to="/funcionario/pedidos"
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    Pedidos
                  </Link>
                  <Link 
                    to="/funcionario/calendario"
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    Calendario
                  </Link>
                  <Link 
                    to="/funcionario/marketplace"
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    Gestionar Marketplace
                  </Link>
                </>
              )}

              <Link 
                to="/documentacion"
                className="text-muted-foreground hover:text-accent transition-colors text-sm"
              >
                Docs
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-magenta rounded-full"></span>
              </button>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}