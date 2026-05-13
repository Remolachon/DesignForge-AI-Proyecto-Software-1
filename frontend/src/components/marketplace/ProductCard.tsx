// /components/marketplace/ProductCard.tsx
'use client';

import { Product, getProductTypeLabel } from '@/types/product';
import { MessageSquareText, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  product: Product;
  onBuy: () => void;
  onViewReviews?: () => void;
}

export const ProductCard = ({ product, onBuy, onViewReviews }: Props) => {
  const mainMedia = product.media?.find(m => m.media_role === 'main') || product.media?.[0];
  const displayUrl = mainMedia?.storage_path || product.imageUrl;

  return (
    <div className="rounded-2xl p-4 flex flex-col hover:shadow-xl transition-all duration-500 bg-background group relative overflow-hidden hover:-translate-y-1">
      {/* Decorative hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <Link href={`/marketplace/${product.id}`} className="relative aspect-square mb-4 overflow-hidden rounded-lg block">
        {displayUrl ? (
          mainMedia?.media_kind === 'video' ? (
              <video
                  src={displayUrl}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  autoPlay
                  muted
                  loop
                  playsInline
              />
          ) : (
              <Image
                src={displayUrl}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                loading="eager"
                unoptimized
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <span className="text-sm text-muted-foreground">Sin imagen</span>
          </div>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <span className="text-foreground font-semibold tracking-wider text-sm">AGOTADO</span>
          </div>
        )}
      </Link>

      <div className="flex justify-between items-start mb-2">
        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md font-medium tracking-wide">
          {getProductTypeLabel(product.productType)}
        </span>
        <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-md">
          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
          <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">{product.rating}</span>
        </div>
      </div>

      <Link href={`/marketplace/${product.id}`} className="group-hover:text-primary transition-colors">
        <h3 className="font-semibold text-lg line-clamp-1 mb-1">{product.title}</h3>
      </Link>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{product.description}</p>

      <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-bold text-xl text-primary">
          ${product.price.toLocaleString()}
        </span>

        <div className="flex gap-2 sm:justify-end">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewReviews?.();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MessageSquareText className="h-4 w-4" />
            Comentarios
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBuy();
            }}
            disabled={!product.inStock}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm active:scale-95"
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
};