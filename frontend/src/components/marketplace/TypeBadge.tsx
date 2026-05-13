import { type ProductType, getProductTypeLabel } from '@/types/product';
export function TypeBadge({ type }: { type: ProductType }) {
    const colors: Record<ProductType, string> = {
        bordado: 'bg-blue-100 text-blue-700',
        'neon-flex': 'bg-purple-100 text-purple-700',
        acrilico: 'bg-green-100 text-green-700',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[type]}`}>
            {getProductTypeLabel(type)}
        </span>
    );
}