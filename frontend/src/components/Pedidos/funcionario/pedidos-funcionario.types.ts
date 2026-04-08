import { OrderStatus } from '@/types/order';
export type ProductType = 'bordado' | 'neon-flex' | 'acrilico';
export type FilterStatus = OrderStatus | 'all';
export const PAGE_SIZE = 10;
export const DEBOUNCE_MS = 250;
export const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'En diseño', label: 'En diseño' },
    { value: 'En producción', label: 'En producción' },
    { value: 'Listo para entregar', label: 'Listo para entregar' },
    { value: 'Entregado', label: 'Entregados' },
];
export const ORDER_STATUSES: OrderStatus[] = [
    'En diseño',
    'En producción',
    'Listo para entregar',
    'Entregado',
];
export function normalizeText(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}
export function getProductTypeLabel(type: ProductType): string {
    const map: Record<ProductType, string> = {
        bordado: 'Bordado',
        'neon-flex': 'Neon Flex',
        acrilico: 'Acrílico',
    };
    return map[type] ?? type;
}