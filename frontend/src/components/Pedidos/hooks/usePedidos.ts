import { useEffect, useMemo, useState } from 'react';
import { Pedido, OrderStatus } from '../types/pedido';
import { pedidosService } from '../services/pedidos.service';

function normalizeStatus(value: string) {
  return value.trim().toLowerCase();
}

function canonicalStatus(value: string): OrderStatus | string {
  const normalized = normalizeStatus(value);

  if (normalized === 'en diseño') return 'En diseño';
  if (normalized === 'en produccion' || normalized === 'en producción') return 'En producción';
  if (normalized === 'listo para entrega' || normalized === 'listo para entregar') {
    return 'Listo para entregar';
  }
  if (normalized === 'entregado') return 'Entregado';

  return value;
}

export function usePedidos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await pedidosService.getMyOrders();
        setPedidos(data);
      } catch {
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredPedidos = useMemo(() => {
    return pedidos.filter((order: Pedido) => {
      const matchesSearch =
        order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.includes(searchTerm);

      const matchesFilter =
        filterStatus === 'all' ||
        canonicalStatus(order.status) === canonicalStatus(filterStatus);

      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filterStatus, pedidos]);

  return {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredPedidos,
    loading,
  };
}