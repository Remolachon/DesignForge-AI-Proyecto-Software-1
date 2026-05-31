'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ProductReviewsModal } from '@/components/marketplace/modals/ProductReviewsModal';
import { ProductService } from '@/services/product.service';
import { type Product } from '@/types/product';

type ReviewOpenDetail = {
  productId?: number | null;
  notificationId?: number | null;
};

export function ReviewModalHost() {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [notificationId, setNotificationId] = useState<number | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setHasToken(Boolean(localStorage.getItem('token')));
  }, []);

  useEffect(() => {
    const handleOpenReview = async (event: Event) => {
      const customEvent = event as CustomEvent<ReviewOpenDetail>;
      const productId = customEvent.detail?.productId;

      if (!productId) {
        toast.error('No se pudo abrir la valoración porque faltó el producto.');
        return;
      }

      const requestId = ++requestIdRef.current;
      setOpen(true);
      setLoading(true);
      setProduct(null);
      setNotificationId(customEvent.detail?.notificationId ?? null);

      try {
        const productData = await ProductService.getProductById(String(productId));
        if (requestIdRef.current !== requestId) {
          return;
        }

        setProduct(productData);
      } catch {
        if (requestIdRef.current !== requestId) {
          return;
        }

        toast.error('No se pudo cargar el producto para valorar.');
        setOpen(false);
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    };

    window.addEventListener('open-review-modal', handleOpenReview as EventListener);
    return () => {
      window.removeEventListener('open-review-modal', handleOpenReview as EventListener);
    };
  }, []);

  return (
    <>
      <ProductReviewsModal
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            requestIdRef.current += 1;
            setLoading(false);
            setProduct(null);
            setNotificationId(null);
          }
        }}
        productId={product?.id ?? 0}
        productTitle={loading ? 'Cargando valoración...' : product?.title ?? 'Producto'}
        summaryRating={Number(Number(product?.rating ?? 0).toFixed(1))}
        summaryReviews={product?.reviews ?? 0}
        allowReview={hasToken}
        initialMode={notificationId !== null ? 'review' : 'comments'}
        loadingProduct={loading}
      />
    </>
  );
}