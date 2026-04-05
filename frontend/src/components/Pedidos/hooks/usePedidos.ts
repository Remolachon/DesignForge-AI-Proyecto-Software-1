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
  if (normalized === 'listo para entregar') {
    return 'Listo para entregar';
  }
  if (normalized === 'entregado') return 'Entregado';

  return value;
}

export function usePedidos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await pedidosService.getMyOrdersPage({
          page,
          pageSize: 10,
          search: searchTerm,
          status: filterStatus,
        });
        setPedidos(data.items);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
      } catch {
        setPedidos([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, searchTerm, filterStatus]);

  const filteredPedidos = useMemo(() => {
    return pedidos.map((order: Pedido) => ({
      ...order,
      status: canonicalStatus(order.status) as Pedido['status'],
    }));
  }, [pedidos]);

  const setSearchAndReset = (value: string) => {
    setPage(1);
    setSearchTerm(value);
  };

  const setFilterAndReset = (value: OrderStatus | 'all') => {
    setPage(1);
    setFilterStatus(value);
  };

  return {
    searchTerm,
    setSearchTerm: setSearchAndReset,
    filterStatus,
    setFilterStatus: setFilterAndReset,
    filteredPedidos,
    loading,
    page,
    setPage,
    totalPages,
    totalItems,
  };
}