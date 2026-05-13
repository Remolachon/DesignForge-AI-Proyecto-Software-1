// /components/marketplace/Marketplace.tsx
'use client';

import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { ProductType, Product } from '@/types/product';
import { Filters } from './Filters';
import { ProductCard } from './ProductCard';
import { BuyOrderModal } from './modals/BuyOrderModal';
import { ConfirmBuyModal } from './modals/ConfirmBuyModal';
import { useMarketplaceBuy } from './hooks/useMarketplaceBuy';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductReviewsModal } from './modals/ProductReviewsModal';

export const Marketplace = () => {
  const { products } = useProducts();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formData, errors, loading, setField, createOrder, resetForm, validateForm } =
    useMarketplaceBuy();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedReviewsProduct, setSelectedReviewsProduct] = useState<Product | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      setFilterType(typeParam as ProductType);
    }
  }, [searchParams]);

  useEffect(() => {
    setHasToken(Boolean(localStorage.getItem('token')));
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === 'all' || p.productType === filterType;

    return matchesSearch && matchesFilter;
  });

  const handleBuy = (product: Product) => {
    const token = localStorage.getItem('token');

    if (!token) {
      localStorage.setItem('redirect_after_login', '/marketplace');
      router.push('/login');
      return;
    }

    setSelectedProduct(product);
    setShowBuyModal(true);
  };

  const handleViewReviews = (product: Product) => {
    setSelectedReviewsProduct(product);
  };

  const handleBuyConfirm = () => {
    const isValid = validateForm();
    if (!isValid) return;

    setShowBuyModal(false);
    setShowConfirmModal(true);
  };

  // ✅ CONFIRMAR Y CREAR ORDEN (incluye check de token)
  const handleFinalConfirm = async () => {
    if (!selectedProduct) return;

    const success = await createOrder(
      selectedProduct.id,
      selectedProduct.title
    );

    if (success) {
      setShowConfirmModal(false);
      resetForm();
      setSelectedProduct(null);
    }
  };

  const handleCloseBuyModal = () => {
    setShowBuyModal(false);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setShowBuyModal(true);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Marketplace</h1>
        <p className="text-gray-500">
          Explora y compra productos listos para entrega
        </p>
      </div>

      <Filters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} onBuy={() => handleBuy(p)} onViewReviews={() => handleViewReviews(p)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500">
          No se encontraron productos
        </p>
      )}

      {/* Modal de parámetros */}
      {selectedProduct && (
        <BuyOrderModal
          productTitle={selectedProduct.title}
          isOpen={showBuyModal}
          onClose={handleCloseBuyModal}
          formData={formData}
          errors={errors}
          loading={loading}
          onFieldChange={setField}
          onConfirm={handleBuyConfirm}
        />
      )}

      {/* Modal de confirmación */}
      {selectedProduct && (
        <ConfirmBuyModal
          productTitle={selectedProduct.title}
          isOpen={showConfirmModal}
          onConfirm={handleFinalConfirm}
          onCancel={handleCloseConfirmModal}
          loading={loading}
        />
      )}

      {selectedReviewsProduct && (
        <ProductReviewsModal
          open={Boolean(selectedReviewsProduct)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setSelectedReviewsProduct(null);
            }
          }}
          productId={selectedReviewsProduct.id}
          productTitle={selectedReviewsProduct.title}
          summaryRating={selectedReviewsProduct.rating}
          summaryReviews={selectedReviewsProduct.reviews}
          allowReview={hasToken}
        />
      )}
    </div>
  );
};