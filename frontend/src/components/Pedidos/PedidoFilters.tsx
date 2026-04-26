import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OrderStatus } from '@/components/Pedidos/types/pedido';

interface Props {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: OrderStatus | 'all';
  setFilterStatus: (value: OrderStatus | 'all') => void;
}

const statuses: (OrderStatus | 'all')[] = [
  'all',
  'Pendiente de pago',
  'Pago rechazado',
  'En diseño',
  'En producción',
  'Listo para entregar',
  'Entregado',
];

export function PedidoFilters({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
}: Props) {
  return (
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

        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          {statuses.map((status) => {
            const isActive = filterStatus === status;

            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`
                  px-4 py-2 text-sm rounded-lg transition-all
                  ${isActive 
                    ? 'bg-white shadow-sm text-black font-medium' 
                    : 'text-muted-foreground hover:text-black'}
                `}
              >
                {status === 'all' ? 'Todos' : status}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}