import { type ProductType } from '@/types/product';
// ─── Tipos ────────────────────────────────────────────────────────────────────
export type FilterType = ProductType | 'all';
export type ProductFormData = {
    name: string;
    description: string;
    basePrice: string;
    productType: ProductType;
    stock: string;
};
export interface MediaUploadItem {
    id: string;
    file?: File; // Optional for existing media that was already uploaded
    previewUrl: string;
    media_kind: 'image' | 'video' | 'thumbnail' | 'document';
    media_role: 'main' | 'gallery' | 'preview' | 'attachment';
}

export type ProductFormSubmit = ProductFormData & {
    mediaItems: MediaUploadItem[];
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