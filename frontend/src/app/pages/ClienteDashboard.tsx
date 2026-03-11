import { Link } from 'react-router';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Plus, Package, ShoppingBag, Clock, TrendingUp } from 'lucide-react';
import { Button } from '../components/Button';
import { mockOrders, getStatusColor } from '../data/mockData';

export default function ClienteDashboard() {
  const recentOrders = mockOrders.slice(0, 3);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-primary mb-2">
              Bienvenido de vuelta
            </h1>
            <p className="text-muted-foreground">
              Gestiona tus pedidos y crea nuevos diseños personalizados
            </p>
          </div>
          <Link to="/cliente/crear-pedido">
            <Button className="w-full sm:w-auto">
              <Plus className="w-5 h-5" />
              Crear Pedido
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pedidos Activos</p>
                <p className="text-3xl font-semibold">3</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pedidos Totales</p>
                <p className="text-3xl font-semibold">12</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pendientes Entrega</p>
                <p className="text-3xl font-semibold">1</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/cliente/crear-pedido">
              <Card hover className="h-full">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-magenta rounded-lg flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Crear Pedido</h3>
                    <p className="text-sm text-muted-foreground">
                      Diseña un producto personalizado con IA
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/marketplace">
              <Card hover className="h-full">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Marketplace</h3>
                    <p className="text-sm text-muted-foreground">
                      Explora productos listos para comprar
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/cliente/pedidos">
              <Card hover className="h-full">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Mis Pedidos</h3>
                    <p className="text-sm text-muted-foreground">
                      Ver historial y seguimiento de pedidos
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pedidos Recientes</h2>
            <Link to="/cliente/pedidos">
              <Button variant="tertiary" size="sm">
                Ver todos
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {recentOrders.map((order) => (
              <Card key={order.id} hover>
                <div className="flex flex-col sm:flex-row gap-4">
                  <img
                    src={order.imageUrl}
                    alt={order.title}
                    className="w-full sm:w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold mb-1">{order.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Pedido #{order.id}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
                      <span>Entrega: {new Date(order.deliveryDate).toLocaleDateString('es-ES')}</span>
                      <span className="font-semibold text-primary">
                        ${order.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
