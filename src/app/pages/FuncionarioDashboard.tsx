import { Link } from 'react-router';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { Button } from '../components/Button';
import { mockOrders, getStatusColor } from '../data/mockData';

export default function FuncionarioDashboard() {
  const urgentOrders = mockOrders.filter(o => o.status === 'En producción').slice(0, 3);
  const pendingDesign = mockOrders.filter(o => o.status === 'En diseño').length;
  const inProduction = mockOrders.filter(o => o.status === 'En producción').length;
  const readyForDelivery = mockOrders.filter(o => o.status === 'Listo para entrega').length;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-primary mb-2">
              Panel de Producción
            </h1>
            <p className="text-muted-foreground">
              Gestiona pedidos y organiza el calendario de producción
            </p>
          </div>
          <Link to="/funcionario/calendario">
            <Button>Ver Calendario</Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">En Diseño</p>
                <p className="text-3xl font-semibold">{pendingDesign}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">En Producción</p>
                <p className="text-3xl font-semibold">{inProduction}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Listos</p>
                <p className="text-3xl font-semibold">{readyForDelivery}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Pedidos</p>
                <p className="text-3xl font-semibold">{mockOrders.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/funcionario/pedidos">
              <Card hover className="h-full">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Gestionar Pedidos</h3>
                    <p className="text-sm text-muted-foreground">
                      Ver y actualizar estado de pedidos
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/funcionario/calendario">
              <Card hover className="h-full">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-magenta rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Calendario</h3>
                    <p className="text-sm text-muted-foreground">
                      Organizar horarios de producción
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/funcionario/marketplace">
              <Card hover className="h-full">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Gestionar Marketplace</h3>
                    <p className="text-sm text-muted-foreground">
                      Agregar y editar productos
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Urgent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pedidos Urgentes</h2>
            <Link to="/funcionario/pedidos">
              <Button variant="tertiary" size="sm">
                Ver todos
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {urgentOrders.map((order) => (
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
                          Cliente: {order.clientName} • Pedido #{order.id}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                      <span className="text-muted-foreground">
                        Entrega: {new Date(order.deliveryDate).toLocaleDateString('es-ES')}
                      </span>
                      <Link to={`/funcionario/pedidos/${order.id}`}>
                        <Button variant="tertiary" size="sm">
                          Ver detalles
                        </Button>
                      </Link>
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
