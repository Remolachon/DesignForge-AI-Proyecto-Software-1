'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { funcionarioOrderService } from '@/services/funcionario-order.service';
import { AdminOrder, OrderStatus } from '@/types/order';
import {
    type FilterStatus,
    PAGE_SIZE,
    DEBOUNCE_MS,
    normalizeText,
} from '@/components/Pedidos/funcionario/pedidos-funcionario.types';
export function useFuncionarioPedidos() {
    const [inputSearch, setInputSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [page, setPage] = useState(1);
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pendingChange, setPendingChange] = useState<{
        orderId: string;
        newStatus: OrderStatus;
    } | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const isSearching = useMemo(() => {
        return normalizeText(inputSearch) !== debouncedSearch;
    }, [inputSearch, debouncedSearch]);
    const handleSearchChange = useCallback((value: string) => {
        setInputSearch(value);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setDebouncedSearch(normalizeText(value));
            setPage(1);
        }, DEBOUNCE_MS);
    }, []);
    const handleFilterChange = useCallback((value: FilterStatus) => {
        setFilterStatus(value);
        setPage(1);
    }, []);
    useEffect(() => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const data = await funcionarioOrderService.getFuncionarioOrdersPage(
                    {
                        page,
                        pageSize: PAGE_SIZE,
                        search: debouncedSearch,
                        status: filterStatus,
                    },
                    controller.signal,
                );
                if (cancelled || controller.signal.aborted) return;
                setOrders(data.items ?? []);
                setTotalPages(Math.max(1, data.totalPages ?? 1));
                setTotalItems(data.totalItems ?? 0);
            } catch (err: any) {
                if (err?.name === 'AbortError' || cancelled || controller.signal.aborted) return;
                toast.error(err?.message || 'No se pudieron cargar los pedidos');
                setOrders([]);
                setTotalPages(1);
                setTotalItems(0);
            } finally {
                if (!cancelled && !controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };
        load();
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [page, debouncedSearch, filterStatus]);
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
    }, []);
    const handleStatusChange = useCallback(
        (orderId: string, newStatus: OrderStatus) => {
            const order = orders.find((o) => o.id === orderId);
            if (!order || order.status === newStatus) return;
            setPendingChange({ orderId, newStatus });
        },
        [orders],
    );
    const confirmStatusChange = async () => {
        if (!pendingChange) return;
        const { orderId, newStatus } = pendingChange;
        try {
            const updated = await funcionarioOrderService.updateStatus(orderId, newStatus);
            setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
            toast.success(`Pedido #${orderId} actualizado a "${updated.status}"`);
        } catch (err: any) {
            toast.error(err?.message || 'No se pudo actualizar el estado');
        } finally {
            setPendingChange(null);
        }
    };
    return {
        // Búsqueda
        inputSearch,
        handleSearchChange,
        isSearching,
        // Filtro
        filterStatus,
        handleFilterChange,
        // Datos
        orders,
        loading,
        debouncedSearch,
        // Paginación
        page,
        setPage,
        totalPages,
        totalItems,
        // Cambio de estado
        pendingChange,
        setPendingChange,
        handleStatusChange,
        confirmStatusChange,
    };
}
