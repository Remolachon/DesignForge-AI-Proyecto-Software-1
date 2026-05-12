'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product, getProductTypeLabel } from '@/types/product';
import { useMarketplaceBuy } from '@/components/marketplace/hooks/useMarketplaceBuy';
import { BuyOrderModal } from '@/components/marketplace/modals/BuyOrderModal';
import { ConfirmBuyModal } from '@/components/marketplace/modals/ConfirmBuyModal';
import { ProductCarousel } from '@/components/multimedia/ProductCarousel';
import { ProductCommentsSection } from '@/components/marketplace/ProductCommentsSection';
import { Star, ShoppingBag, Settings2, ShieldCheck, Truck, RefreshCcw, Leaf, MessageSquareText } from 'lucide-react';

interface Props {
  initialProduct: Product;
}

export const ProductDetailView = ({ initialProduct }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formData, errors, loading, setField, createOrder, resetForm, validateForm } = useMarketplaceBuy();

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  // Optional: Add state for image gallery if we had multiple images.
  const [mainImage, setMainImage] = useState(initialProduct.imageUrl);

  useEffect(() => {
    const shouldOpenReviews = searchParams.get('review') === '1';
    if (shouldOpenReviews) {
      setTimeout(() => {
        document.getElementById('opiniones')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [searchParams]);

  useEffect(() => {
    setHasToken(Boolean(localStorage.getItem('token')));
  }, []);

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

          {/* Left: Image Gallery */}
          <div className="lg:col-span-7 w-full">
            <ProductCarousel media={initialProduct.media || []} altText={initialProduct.title} />
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
                      {initialProduct.rating}
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
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-foreground/80">Envío seguro</span>
              </div>
              <div className="flex items-center gap-3 group p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                <div className="p-2.5 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                  <Leaf className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-foreground/80">Material premium</span>
              </div>
              <div className="flex items-center gap-3 group p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                <div className="p-2.5 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-foreground/80">Garantía total</span>
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

        {/* Comments Section */}
        <ProductCommentsSection
          productId={initialProduct.id}
          productTitle={initialProduct.title}
          summaryRating={initialProduct.rating}
          summaryReviews={initialProduct.reviews}
          allowReview={hasToken}
        />
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
