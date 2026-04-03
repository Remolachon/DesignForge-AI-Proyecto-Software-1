// /components/marketplace/ProductCard.tsx
import { Product, getProductTypeLabel } from '@/types/product';
import { Star } from 'lucide-react';
import Image from 'next/image';

interface Props {
  product: Product;
  onBuy: (id: string) => void;
}

export const ProductCard = ({ product, onBuy }: Props) => {
  return (
    <div className="border rounded-xl p-4 flex flex-col hover:shadow-lg transition">
      <div className="relative aspect-square mb-4 overflow-hidden rounded-lg">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-sm text-gray-400">Sin imagen</span>
          </div>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
            Agotado
          </div>
        )}
      </div>

      <span className="text-xs bg-gray-200 px-2 py-1 rounded w-fit mb-2">
        {getProductTypeLabel(product.productType)}
      </span>

      <h3 className="font-semibold">{product.title}</h3>
      <p className="text-sm text-gray-500 mb-2">{product.description}</p>

      <div className="flex items-center gap-1 mb-2">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        {product.rating}
      </div>

      <div className="mt-auto flex justify-between items-center">
        <span className="font-bold text-lg">
          ${product.price.toLocaleString()}
        </span>

        <button
          onClick={() => onBuy(product.id)}
          disabled={!product.inStock}
          className="px-3 py-1 bg-black text-white rounded disabled:opacity-50"
        >
          Comprar
        </button>
      </div>
    </div>
  );
};