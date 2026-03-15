import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Search, Eye, Download } from 'lucide-react';
import { mockOrders, OrderStatus, getStatusColor } from '../data/mockData';

export default function ClientePedidos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-primary mb-2">Mis Pedidos</h1>
          <p className="text-muted-foreground">
            Historial y seguimiento de tus pedidos
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterStatus === 'all' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Todos
              </Button>
              <Button
                variant={filterStatus === 'En diseño' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilterStatus('En diseño')}
              >
                En diseño
              </Button>
              <Button
                variant={filterStatus === 'En producción' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilterStatus('En producción')}
              >
                En producción
              </Button>
              <Button
                variant={filterStatus === 'Listo para entrega' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilterStatus('Listo para entrega')}
              >
                Listos
              </Button>
            </div>
          </div>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} hover>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Image */}
                <img
                  src={order.imageUrl}
                  alt={order.title}
                  className="w-full lg:w-48 h-48 object-cover rounded-lg"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{order.title}</h3>
                      <p className="text-sm text-muted-foreground">Pedido #{order.id}</p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>

                  {order.description && (
                    <p className="text-muted-foreground mb-4">{order.description}</p>
                  )}

                  {/* Timeline */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        order.status === 'Entregado' ? 'bg-green-500' : 'bg-blue-500'
                      }`}></div>
                      <span className="text-sm">
                        Creado: {new Date(order.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        order.status === 'Entregado' ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <span className="text-sm">
                        Entrega estimada: {new Date(order.deliveryDate).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xl font-bold text-primary">
                      ${order.price.toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm">
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </Button>
                      {order.status === 'Entregado' && (
                        <Button variant="tertiary" size="sm">
                          <Download className="w-4 h-4" />
                          Factura
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron pedidos</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
