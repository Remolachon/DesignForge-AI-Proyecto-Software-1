'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, getProductTypeLabel } from '@/types/product';
import { useMarketplaceBuy } from '@/components/marketplace/hooks/useMarketplaceBuy';
import { BuyOrderModal } from '@/components/marketplace/modals/BuyOrderModal';
import { ConfirmBuyModal } from '@/components/marketplace/modals/ConfirmBuyModal';
import { marketplaceCatalogService } from '@/services/marketplace-catalog.service';
import { Star, ShoppingBag, Settings2, RefreshCcw, Leaf } from 'lucide-react';

interface Props {
  initialProduct: Product;
}

export const ProductDetailView = ({ initialProduct }: Props) => {
  const router = useRouter();
  const { attrValues, errors, loading, quantity, setQuantity, initAttributes, setField, createOrder, resetForm, validateForm } = useMarketplaceBuy();

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resolvedShape, setResolvedShape] = useState(initialProduct.productShape || null);

  useEffect(() => {
    let cancelled = false;

    const resolveShape = async () => {
      if (initialProduct.productShape || !initialProduct.productShapeId) return;

      try {
        const shapes = await marketplaceCatalogService.getShapes();
        const matchedShape = shapes.find((shape) => shape.id === initialProduct.productShapeId) || null;

        if (!cancelled) {
          setResolvedShape(matchedShape?.name || null);
        }
      } catch {
        if (!cancelled) {
          setResolvedShape(null);
        }
      }
    };

    void resolveShape();

    return () => {
      cancelled = true;
    };
  }, [initialProduct.productShape, initialProduct.productShapeId]);

  const handleBuyClick = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('redirect_after_login', `/marketplace/${initialProduct.id}`);
      router.push('/login');
      return;
    }
    resetForm();
    setQuantity(1);
    setShowBuyModal(true);
  };

  const handleBuyConfirm = () => {
    const isValid = validateForm(initialProduct.attributes, initialProduct.stock);
    if (!isValid) return;
    setShowBuyModal(false);
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = async () => {
    const success = await createOrder(initialProduct.id, initialProduct.title, initialProduct.attributes, initialProduct.stock);
    if (success) {
      setShowConfirmModal(false);
      resetForm();
      // Possibly redirect or show success toast
    }
  };

  const primaryMedia = useMemo(() => {
    const media = initialProduct.media || [];
    const mainMedia = media.find((item) => item.media_role === 'main');
    return mainMedia || media[0] || null;
  }, [initialProduct.media]);

  const mediaCount = initialProduct.media?.length ?? 0;
  const attributeCount = initialProduct.attributes?.length ?? 0;

  const infoCards = [
    { label: 'Tipo', value: getProductTypeLabel(initialProduct.productType) },
    { label: 'Forma', value: resolvedShape || 'No tiene' },
    { label: 'Stock', value: initialProduct.inStock ? `${initialProduct.stock} disponibles` : 'Agotado' },
    { label: 'Medios', value: mediaCount ? `${mediaCount} archivo(s)` : 'No tiene' },
    { label: 'Reseñas', value: initialProduct.reviews ? `${initialProduct.reviews}` : 'No tiene' },
    { label: 'Atributos', value: attributeCount ? `${attributeCount} configurado(s)` : 'No tiene' },
  ];

  return (
    <div className="pt-6 lg:pt-10 pb-16 lg:pb-24 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-6 lg:mb-8 bg-muted/30 w-fit px-4 py-2 rounded-full border border-border/50">
          <Link href="/marketplace" className="hover:text-primary transition-colors font-medium">Marketplace</Link>
          <span className="text-border">/</span>
          <Link href={`/marketplace?type=${initialProduct.productType}`} className="capitalize hover:text-primary transition-colors font-medium">
            {getProductTypeLabel(initialProduct.productType)}
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground font-semibold line-clamp-1">{initialProduct.title}</span>
        </div>

        {/* Product Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">

          {/* Left: Main Media */}
          <div className="lg:col-span-7 w-full">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-muted/30 shadow-sm">
              {primaryMedia ? (
                primaryMedia.media_kind === 'video' ? (
                  <video
                    src={primaryMedia.storage_path}
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                  />
                ) : (
                  <Image
                    src={primaryMedia.storage_path || initialProduct.imageUrl || ''}
                    alt={initialProduct.title}
                    fill
                    unoptimized
                    priority
                    className="object-cover"
                  />
                )
              ) : initialProduct.imageUrl ? (
                <Image
                  src={initialProduct.imageUrl}
                  alt={initialProduct.title}
                  fill
                  unoptimized
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                  Sin vista previa
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Information */}
          <div className="lg:col-span-5 flex flex-col pt-0 lg:pt-4">

            {/* Title & Price Block */}
            <div className="mb-6 lg:mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-6 text-balance">
                {initialProduct.title}
              </h1>

              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-primary tracking-tight">
                    ${initialProduct.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">COP</span>
                </div>

                {initialProduct.reviews > 0 && (
                  <button
                    type="button"
                    onClick={() => document.getElementById('opiniones')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20 hover:bg-yellow-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold text-yellow-600 dark:text-yellow-400 text-sm flex items-center gap-1.5">
                      {Number(initialProduct.rating).toFixed(1)}
                      <span className="font-normal text-yellow-600/70 dark:text-yellow-400/70">({initialProduct.reviews})</span>
                    </span>
                  </button>
                )}
              </div>

              <div className="inline-flex items-center gap-2 text-xs lg:text-sm font-semibold px-3 py-1.5 rounded-full bg-background border shadow-sm">
                {initialProduct.inStock ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-green-600 dark:text-green-400">En stock - Listo para enviar</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                    <span className="text-red-600 dark:text-red-400">Agotado temporalmente</span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-sm sm:prose-base dark:prose-invert text-muted-foreground leading-relaxed mb-8 lg:mb-10 max-w-lg">
              <p>{initialProduct.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-8">
              {infoCards.map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            {initialProduct.attributes.length > 0 ? (
              <div className="mb-8 space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Detalles configurables</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {initialProduct.attributes.map((attribute) => (
                    <div key={attribute.code} className="rounded-xl border border-border/70 bg-background p-3">
                      <p className="text-xs text-muted-foreground">{attribute.label}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {attribute.default_value?.trim() || attribute.placeholder?.trim() || 'No tiene'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-8 rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
                Este producto no tiene atributos configurados.
              </div>
            )}

            {/* Action Area */}
            <div className="flex flex-col gap-3 lg:gap-4 mt-auto p-5 lg:p-6 bg-muted/20 rounded-2xl border border-border/50">
              <button
                onClick={handleBuyClick}
                disabled={!initialProduct.inStock}
                className="w-full bg-gradient-to-r from-primary to-accent text-white py-4 rounded-xl font-bold text-base lg:text-lg tracking-wide uppercase shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <span>Comprar Ahora</span>
                <ShoppingBag className="w-5 h-5" />
              </button>

              <Link
                href="/cliente/crear-pedido"
                className="w-full bg-background text-foreground py-3.5 rounded-xl font-semibold text-xs lg:text-sm tracking-wide uppercase hover:bg-muted transition-colors duration-300 flex items-center justify-center gap-2 border border-border hover:border-foreground/20 shadow-sm"
              >
                <Settings2 className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
                Crear un pedido personalizado
              </Link>
            </div>

            {/* Perks List */}
            <div className="mt-6 lg:mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 group p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                <div className="p-2.5 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                  <Leaf className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-foreground/80">Material premium</span>
              </div>
              <div className="flex items-center gap-3 group p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                <div className="p-2.5 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                  <RefreshCcw className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-foreground/80">Soporte 24/7</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Buy Modals */}
      <BuyOrderModal
        product={initialProduct}
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        attrValues={attrValues}
        errors={errors}
        loading={loading}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onFieldChange={setField}
        onConfirm={handleBuyConfirm}
        initAttributes={initAttributes}
      />
      <ConfirmBuyModal
        productTitle={initialProduct.title}
        quantity={quantity}
        totalAmount={(Number(initialProduct.price || 0) * quantity) + Math.round(Number(initialProduct.price || 0) * quantity * 0.19 * 100) / 100}
        isOpen={showConfirmModal}
        onConfirm={handleFinalConfirm}
        onCancel={() => {
          setShowConfirmModal(false);
          setShowBuyModal(true);
        }}
        loading={loading}
      />
    </div>
  );
};
