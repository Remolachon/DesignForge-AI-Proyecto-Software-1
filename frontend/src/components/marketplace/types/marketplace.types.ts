import { type ProductType } from '@/features/Mockordersadmin';
// ─── Tipos ────────────────────────────────────────────────────────────────────
export type FilterType = ProductType | 'all';
export type ProductFormData = {
    name: string;
    description: string;
    basePrice: string;
    productType: ProductType;
    stock: string;
};
export type ProductFormSubmit = ProductFormData & {
    imageFile: File | null;
};
// ─── Constantes ───────────────────────────────────────────────────────────────
export const EMPTY_FORM: ProductFormData = {
    name: '',
    description: '',
    basePrice: '',
    productType: 'bordado',
    stock: '',
};
export const PRODUCT_TYPES: ProductType[] = ['bordado', 'neon-flex', 'acrilico'];
export const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'bordado', label: 'Bordado' },
    { value: 'neon-flex', label: 'Neon Flex' },
    { value: 'acrilico', label: 'Acrílico' },
];