import { useState, useMemo } from 'react';
import { Pedido, OrderStatus } from '../types/pedido';
import { mockPedidos } from '@/features/mockPedidos';

export function usePedidos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  const pedidos = mockPedidos;

  const filteredPedidos = useMemo(() => {
    return pedidos.filter((order: Pedido) => {
      const matchesSearch =
        order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.includes(searchTerm);

      const matchesFilter =
        filterStatus === 'all' || order.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filterStatus, pedidos]);

  return {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filteredPedidos,
  };
}