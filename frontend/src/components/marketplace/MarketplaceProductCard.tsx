import Image from 'next/image';
import { Star, Eye, EyeOff, Pencil, Trash2, MessageSquareText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TypeBadge } from '@/components/marketplace/TypeBadge';
import { type MarketplaceProduct } from '@/types/marketplace';
interface MarketplaceProductCardProps {
    product: MarketplaceProduct;
    onToggleActive: (productId: string) => void;
    onEdit: (product: MarketplaceProduct) => void;
    onDelete: (product: MarketplaceProduct) => void;
    onViewReviews?: (product: MarketplaceProduct) => void;
    imageLoading?: 'eager' | 'lazy';
}
export function MarketplaceProductCard({
    product,
    onToggleActive,
    onEdit,
    onDelete,
    onViewReviews,
    imageLoading = 'lazy',
}: MarketplaceProductCardProps) {
    const mainMedia = product.media?.find(m => m.media_role === 'main') || product.media?.[0];
    const displayUrl = mainMedia?.storage_path || product.imageUrl;

    return (
        <Card
            className={`overflow-hidden transition-all ${!product.isPublic ? 'opacity-60' : ''
                }`}
        >
            {/* Imagen / Video Principal */}
            <div className="relative aspect-video">
                {displayUrl ? (
                    mainMedia?.media_kind === 'video' ? (
                        <video
                            src={displayUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    ) : (
                        <Image
                            src={displayUrl}
                            alt={product.name}
                            fill
                            sizes="(max-width: 1024px) 100vw, 33vw"
                            unoptimized
                            loading={imageLoading}
                            className="object-cover"
                        />
                    )
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">Sin imagen</span>
                    </div>
                )}
                {/* Overlay de estado */}
                {!product.isPublic && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-full">
                            Inactivo
                        </span>
                    </div>
                )}
                {!product.inStock && product.isPublic && (
                    <div className="absolute top-2 right-2">
                        <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                            Sin stock
                        </span>
                    </div>
                )}
            </div>
            <CardContent className="pt-4 pb-4 space-y-3">
                {/* Tipo y rating */}
                <div className="flex items-center justify-between">
                    <TypeBadge type={product.productType} />
                    {product.reviews > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span>{Number(product.rating).toFixed(1)}</span>
                            <span>({product.reviews})</span>
                        </div>
                    )}
                </div>
                {/* Nombre y descripción */}
                <div>
                    <h3 className="font-semibold text-sm leading-tight mb-1">
                        {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {product.description}
                    </p>
                </div>
                {/* Precio y stock */}
                <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-primary text-base">
                        ${product.basePrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Stock: <span className="font-medium text-foreground">{product.stock}</span>
                    </span>
                </div>
                {/* Acciones */}
                <div className="flex gap-2 pt-1">
                    <button
                        onClick={() => onViewReviews?.(product)}
                        title="Ver comentarios"
                        className="px-3 py-1.5 rounded-lg border border-border bg-white hover:bg-muted text-xs font-medium transition-colors flex items-center gap-1"
                    >
                        <MessageSquareText className="w-3.5 h-3.5" />
                        Comentarios
                    </button>
                    {/* Activar / Desactivar */}
                    <button
                        onClick={() => onToggleActive(product.id)}
                        title={product.isPublic ? 'Desactivar' : 'Activar'}
                        className={`
              flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium
              border transition-colors
              ${product.isPublic
                                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'}
            `}
                    >
                        {product.isPublic ? (
                            <>
                                <EyeOff className="w-3.5 h-3.5" />
                                Desactivar
                            </>
                        ) : (
                            <>
                                <Eye className="w-3.5 h-3.5" />
                                Activar
                            </>
                        )}
                    </button>
                    {/* Editar */}
                    <button
                        onClick={() => onEdit(product)}
                        title="Editar producto"
                        className="px-3 py-1.5 rounded-lg border border-border bg-white hover:bg-muted
                       text-xs font-medium transition-colors flex items-center gap-1"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                    </button>
                    {/* Eliminar */}
                    <button
                        onClick={() => onDelete(product)}
                        title="Eliminar producto"
                        className="p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-500
                       hover:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}