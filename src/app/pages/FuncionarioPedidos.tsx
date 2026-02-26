import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Search, Filter, Eye } from 'lucide-react';
import { mockOrders, OrderStatus, getStatusColor, getProductTypeLabel } from '../data/mockData';
import { Link } from 'react-router';
import { toast } from 'sonner';

export default function FuncionarioPedidos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    toast.success(`Pedido #${orderId} actualizado a "${newStatus}"`);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-primary mb-2">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">
            Ver, filtrar y actualizar el estado de todos los pedidos
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por cliente, título o ID..."
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
              <Button
                variant={filterStatus === 'Entregado' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilterStatus('Entregado')}
              >
                Entregados
              </Button>
            </div>
          </div>
        </Card>

        {/* Orders Table */}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Entrega
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={order.imageUrl}
                          alt={order.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div>
                          <p className="font-semibold text-sm">{order.title}</p>
                          <p className="text-xs text-muted-foreground">#{order.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{order.clientName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default" className="text-xs">
                        {getProductTypeLabel(order.productType)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="text-xs px-2 py-1 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="En diseño">En diseño</option>
                        <option value="En producción">En producción</option>
                        <option value="Listo para entrega">Listo para entrega</option>
                        <option value="Entregado">Entregado</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{new Date(order.deliveryDate).toLocaleDateString('es-ES')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold">${order.price.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/funcionario/pedidos/${order.id}`}>
                        <Button variant="tertiary" size="sm">
                          <Eye className="w-4 h-4" />
                          Ver
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron pedidos</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
