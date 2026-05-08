'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, getProductTypeLabel } from '@/types/product';
import { useMarketplaceBuy } from '@/components/marketplace/hooks/useMarketplaceBuy';
import { BuyOrderModal } from '@/components/marketplace/modals/BuyOrderModal';
import { ConfirmBuyModal } from '@/components/marketplace/modals/ConfirmBuyModal';
import { Star, ShoppingBag, Settings2, ShieldCheck, Truck, RefreshCcw, Leaf } from 'lucide-react';

interface Props {
  initialProduct: Product;
}

export const ProductDetailView = ({ initialProduct }: Props) => {
  const router = useRouter();
  const { formData, errors, loading, setField, createOrder, resetForm, validateForm } = useMarketplaceBuy();

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // Optional: Add state for image gallery if we had multiple images.
  const [mainImage, setMainImage] = useState(initialProduct.imageUrl);

  const handleBuyClick = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.setItem('redirect_after_login', `/marketplace/${initialProduct.id}`);
      router.push('/login');
      return;
    }
    setShowBuyModal(true);
  };

  const handleBuyConfirm = () => {
    const isValid = validateForm();
    if (!isValid) return;
    setShowBuyModal(false);
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = async () => {
    const success = await createOrder(initialProduct.id, initialProduct.title);
    if (success) {
      setShowConfirmModal(false);
      resetForm();
      // Possibly redirect or show success toast
    }
  };

  // Mocking extra images for the gallery
  const thumbnails = [
    initialProduct.imageUrl,
    // Add same image to demonstrate layout since we only have 1 image per product
    initialProduct.imageUrl,
    initialProduct.imageUrl,
  ];

  return (
    <div className="pt-24 lg:pt-32 pb-16 lg:pb-24 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-6 lg:mb-8 mt-2 lg:mt-4">
          <Link href="/marketplace" className="hover:text-primary transition-colors font-medium">Marketplace</Link>
          <span>/</span>
          <Link href={`/marketplace?type=${initialProduct.productType}`} className="capitalize hover:text-primary transition-colors font-medium">
            {getProductTypeLabel(initialProduct.productType)}
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold line-clamp-1">{initialProduct.title}</span>
        </div>

        {/* Product Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">

          {/* Left: Image Gallery */}
          <div className="lg:col-span-7 flex flex-col md:flex-row-reverse gap-4 lg:gap-6">
            {/* Main Hero Image */}
            <div className="flex-1 bg-muted/30 rounded-2xl overflow-hidden aspect-[4/5] relative group border border-border/40 shadow-sm w-full">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={initialProduct.title}
                  fill
                  loading="eager"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-muted-foreground">Sin imagen</span>
                </div>
              )}
              {/* Type Badge Overlay */}
              <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 lg:px-4 py-1 lg:py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-border/50">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                <span className="text-[10px] lg:text-xs font-semibold text-foreground tracking-wide uppercase">
                  {getProductTypeLabel(initialProduct.productType)}
                </span>
              </div>
            </div>

            {/* Thumbnails (Vertical on Desktop, Horizontal on Mobile) */}
            <div className="flex md:flex-col gap-3 w-full md:w-24 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide snap-x md:snap-none touch-pan-x">
              {thumbnails.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={`shrink-0 snap-center w-20 h-24 md:w-full md:h-28 rounded-xl overflow-hidden relative border-2 transition-all duration-200
                    ${mainImage === img ? 'border-primary opacity-100 shadow-md scale-[1.02]' : 'border-transparent opacity-60 hover:opacity-100 bg-muted/30 hover:scale-[1.02]'}`}
                >
                  {img ? (
                    <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Information */}
          <div className="lg:col-span-5 flex flex-col pt-4 lg:pt-8">

            {/* Title & Price Block */}
            <div className="mb-6 lg:mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-4 text-balance">
                {initialProduct.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 lg:gap-4 mb-4">
                <span className="text-2xl lg:text-3xl font-bold text-primary">${initialProduct.price.toLocaleString()}</span>
                {/* Optional: Add previous price to show discount if applicable, for now just show rating here */}
                {initialProduct.reviews > 0 && (
                  <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
                    <Star className="w-3.5 lg:w-4 h-3.5 lg:h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400 text-xs lg:text-sm">
                      {initialProduct.rating} <span className="text-yellow-600/70 dark:text-yellow-400/70">({initialProduct.reviews})</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground font-medium">
                {initialProduct.inStock ? (
                  <>
                    <span className="w-2 lg:w-2.5 h-2 lg:h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></span>
                    <span className="text-green-600 dark:text-green-400">En stock - Listo para enviar</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 lg:w-2.5 h-2 lg:h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                    <span className="text-red-600 dark:text-red-400">Agotado temporalmente</span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm lg:text-base text-muted-foreground leading-relaxed mb-8 lg:mb-10 max-w-lg">
              {initialProduct.description}
            </p>

            {/* Action Area */}
            <div className="flex flex-col gap-3 lg:gap-4 mt-auto">
              <button
                onClick={handleBuyClick}
                disabled={!initialProduct.inStock}
                className="w-full bg-primary text-primary-foreground py-3.5 lg:py-4 rounded-xl font-bold text-base lg:text-lg tracking-wide uppercase hover:shadow-[0_8px_24px_rgba(11,33,63,0.25)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border border-primary/20"
              >
                <span>Comprar Ahora</span>
                <ShoppingBag className="w-5 h-5" />
              </button>

              <Link
                href="/cliente/crear-pedido"
                className="w-full bg-muted/50 text-foreground py-3.5 lg:py-4 rounded-xl font-semibold text-xs lg:text-sm tracking-wide uppercase hover:bg-muted transition-colors duration-300 flex items-center justify-center gap-2 border border-border/60 hover:border-border"
              >
                <Settings2 className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
                Crear un pedido personalizado
              </Link>
            </div>

            {/* Perks List */}
            <div className="mt-8 lg:mt-10 pt-6 lg:pt-8 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-y-4 lg:gap-y-6 gap-x-4">
              <div className="flex items-center gap-3 group">
                <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                  <Truck className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Envío seguro</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                  <Leaf className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Materiales de calidad</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                  <ShieldCheck className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Garantía DesignForge</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                  <RefreshCcw className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Soporte post-venta</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Buy Modals */}
      <BuyOrderModal
        productTitle={initialProduct.title}
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        formData={formData}
        errors={errors}
        loading={loading}
        onFieldChange={setField}
        onConfirm={handleBuyConfirm}
      />
      <ConfirmBuyModal
        productTitle={initialProduct.title}
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
