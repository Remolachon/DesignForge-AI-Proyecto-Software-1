import { type ProductType, getProductTypeLabel } from './pedidos-funcionario.types';
export function ProductTypeBadge({ type }: { type: ProductType }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
            {getProductTypeLabel(type)}
        </span>
    );
}