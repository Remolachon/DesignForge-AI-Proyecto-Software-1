'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pedido, OrderStatus } from '../types/pedido';
import { pedidosService } from '../services/pedidos.service';

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 250;

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function canonicalStatus(value: string): OrderStatus {
  const s = normalizeText(value);

  if (s === 'en diseno') return 'En diseño';
  if (s === 'en produccion') return 'En producción';
  if (s === 'listo para entregar') return 'Listo para entregar';
  if (s === 'entregado') return 'Entregado';

  return value as OrderStatus;
}

export function usePedidos() {
  const [searchTerm, setSearchTermState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatusState] = useState<OrderStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTermState(value);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const cleaned = normalizeText(value);
      setDebouncedSearch(cleaned);
      setPage(1);
    }, DEBOUNCE_MS);
  }, []);

  const handleFilterChange = useCallback((value: OrderStatus | 'all') => {
    setFilterStatusState(value);
    setPage(1);
  }, []);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    let alive = true;

    const load = async () => {
      setLoading(true);

      try {
        const data = await pedidosService.getMyOrdersPage(
          {
            page,
            pageSize: PAGE_SIZE,
            search: debouncedSearch,
            status: filterStatus,
          },
          controller.signal,
        );

        if (!alive || controller.signal.aborted) return;

        const normalizedItems = (data.items ?? []).map((order: Pedido) => ({
          ...order,
          status: canonicalStatus(order.status),
        }));

        setPedidos(normalizedItems);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
        setTotalItems(data.totalItems ?? 0);
      } catch (err: any) {
        if (err?.name === 'AbortError' || controller.signal.aborted || !alive) return;

        setPedidos([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        if (alive && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [page, debouncedSearch, filterStatus]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const isSearching = useMemo(() => {
    return normalizeText(searchTerm) !== debouncedSearch;
  }, [searchTerm, debouncedSearch]);

  return {
    searchTerm,
    setSearchTerm: handleSearchChange,
    filterStatus,
    setFilterStatus: handleFilterChange,
    filteredPedidos: pedidos,
    loading,
    isSearching,
    page,
    setPage,
    totalPages,
    totalItems,
  };
}