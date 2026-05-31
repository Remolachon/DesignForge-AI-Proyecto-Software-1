// /components/marketplace/Marketplace.tsx
'use client';

import { useState } from 'react';
import { DataPagination } from '@/components/ui/DataPagination';
import { useProducts } from '@/hooks/useProducts';
import { ProductType, Product } from '@/types/product';
import { Filters } from './Filters';
import { ProductCard } from './ProductCard';
import { BuyOrderModal } from './modals/BuyOrderModal';
import { ConfirmBuyModal } from './modals/ConfirmBuyModal';
import { useMarketplaceBuy } from './hooks/useMarketplaceBuy';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductReviewsModal } from './modals/ProductReviewsModal';
import { MarketplaceLoading } from './MarketplaceLoading';

export const Marketplace = () => {
  const { products, loading: productsLoading } = useProducts();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { attrValues, errors, loading, quantity, setQuantity, initAttributes, setField, createOrder, resetForm, validateForm } =
    useMarketplaceBuy();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ProductType | 'all'>(() => {
    const typeParam = searchParams.get('type');
    return typeParam && ['bordado', 'neon-flex', 'acrilico', 'vinilo', 'sublimacion'].includes(typeParam)
      ? (typeParam as ProductType)
      : 'all';
  });
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedReviewsProduct, setSelectedReviewsProduct] = useState<Product | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasToken] = useState(() => typeof window !== 'undefined' && Boolean(localStorage.getItem('token')));
  const itemsPerPage = 15;

  const handleSearchTermChange = (value: string) => {
    setPage(1);
    setSearchTerm(value);
  };

  const handleFilterTypeChange = (value: ProductType | 'all') => {
    setPage(1);
    setFilterType(value);
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === 'all' || p.productType === filterType;

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedProducts = filtered.slice(startIndex, startIndex + itemsPerPage);

  if (productsLoading) {
    return <MarketplaceLoading isAdmin={false} />;
  }

  const handleBuy = (product: Product) => {
    const token = localStorage.getItem('token');

    if (!token) {
      localStorage.setItem('redirect_after_login', '/marketplace');
      router.push('/login');
      return;
    }

    resetForm();
    setSelectedProduct(product);
    setQuantity(1);
    setShowBuyModal(true);
  };

  const handleViewReviews = (product: Product) => {
    setSelectedReviewsProduct(product);
  };

  const handleBuyConfirm = () => {
    if (!selectedProduct) return;
    const isValid = validateForm(selectedProduct.attributes, selectedProduct.stock);
    if (!isValid) return;

    setShowBuyModal(false);
    setShowConfirmModal(true);
  };

  // ✅ CONFIRMAR Y CREAR ORDEN (incluye check de token)
  const handleFinalConfirm = async () => {
    if (!selectedProduct) return;

    const success = await createOrder(
      selectedProduct.id,
      selectedProduct.title,
      selectedProduct.attributes,
      selectedProduct.stock
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
        setSearchTerm={handleSearchTermChange}
        filterType={filterType}
        setFilterType={handleFilterTypeChange}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {paginatedProducts.map((p) => (
          <ProductCard key={p.id} product={p} onBuy={() => handleBuy(p)} onViewReviews={() => handleViewReviews(p)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500">
          No se encontraron productos
        </p>
      )}

      {filtered.length > 0 && (
        <DataPagination
          page={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={itemsPerPage}
          onPageChange={setPage}
        />
      )}

      {/* Modal de parámetros */}
      {selectedProduct && (
        <BuyOrderModal
          product={selectedProduct}
          isOpen={showBuyModal}
          onClose={handleCloseBuyModal}
          attrValues={attrValues}
          errors={errors}
          loading={loading}
          quantity={quantity}
          onQuantityChange={setQuantity}
          onFieldChange={setField}
          onConfirm={handleBuyConfirm}
          initAttributes={initAttributes}
        />
      )}

      {/* Modal de confirmación */}
      {selectedProduct && (
        <ConfirmBuyModal
          productTitle={selectedProduct.title}
          quantity={quantity}
          totalAmount={(Number(selectedProduct.price || 0) * quantity) + Math.round(Number(selectedProduct.price || 0) * quantity * 0.19)}
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