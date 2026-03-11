import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('¡Bienvenido de vuelta!');
      
      // Redirigir según el rol (simulado por el email)
      if (email.includes('funcionario') || email.includes('staff') || email.includes('admin')) {
        navigate('/funcionario/dashboard');
      } else {
        navigate('/cliente/dashboard');
      }
    } catch (error) {
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-magenta rounded-lg flex items-center justify-center">
            <Package className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-semibold text-primary">LukArt</span>
        </Link>
        <h2 className="text-center text-3xl font-semibold text-primary">
          Iniciar Sesión
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              disabled={loading}
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />

            <div className="flex items-center justify-between">
              <Link
                to="/recuperar-contrasena"
                className="text-sm text-accent hover:underline"
              >
                
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-muted-foreground">
                  Cuentas de prueba
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-primary">Cliente</p>
                <p className="text-muted-foreground">cliente@test.com</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-primary">Funcionario</p>
                <p className="text-muted-foreground">funcionario@test.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
