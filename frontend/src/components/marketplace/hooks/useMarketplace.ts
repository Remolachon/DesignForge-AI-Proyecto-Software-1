'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    funcionarioMarketplaceService,
    type MarketplaceSavePayload,
} from '@/services/funcionario-marketplace.service';
import { type MarketplaceProduct } from '@/types/marketplace';
import {
    type FilterType,
    type ProductFormData,
    type ProductFormSubmit,
} from '@/components/marketplace/types/marketplace.types';
import { uploadProductMedia } from '@/services/media/uploadProductMedia';

export function useMarketplace() {
    const [products, setProducts] = useState<MarketplaceProduct[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    // Modales
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingProduct, setEditingProduct] = useState<MarketplaceProduct | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<MarketplaceProduct | null>(null);
    const [pendingSave, setPendingSave] = useState<ProductFormSubmit | null>(null);
    const [pendingVisibility, setPendingVisibility] = useState<MarketplaceProduct | null>(null);
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await funcionarioMarketplaceService.getProducts();
                setProducts(data);
            } catch (error: any) {
                toast.error(error?.message || 'No se pudieron cargar los productos');
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, []);
    // ── Filtrado ──────────────────────────────────────────────────────────────
    const filtered = products.filter((p) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            p.name.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term);
        const matchesType = filterType === 'all' || p.productType === filterType;
        return matchesSearch && matchesType;
    });
    // ── Estadísticas ──────────────────────────────────────────────────────────
    const totalActive = products.filter((p) => p.isActive).length;
    const totalInactive = products.filter((p) => !p.isActive).length;
    const outOfStock = products.filter((p) => !p.inStock).length;
    // ── Acciones CRUD ─────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditingProduct(null);
        setModalMode('create');
        setShowModal(true);
    };
    const openEdit = (product: MarketplaceProduct) => {
        setEditingProduct(product);
        setModalMode('edit');
        setShowModal(true);
    };
    const handleSave = (data: ProductFormSubmit) => {
        setPendingSave(data);
    };
    const confirmSave = async () => {
        if (!pendingSave) return;
        setIsProcessing(true);
        const toastId = toast.loading(modalMode === 'create' ? 'Creando producto...' : 'Guardando cambios...');
        const price = Number(pendingSave.basePrice);
        const stock = Number(pendingSave.stock);
        const payload: MarketplaceSavePayload = {
            name: pendingSave.name.trim(),
            description: pendingSave.description.trim(),
            basePrice: price,
            productType: pendingSave.productType,
            stock,
        };
        try {
            let finalProduct: MarketplaceProduct;
            
            if (modalMode === 'create') {
                finalProduct = await funcionarioMarketplaceService.createProduct(payload);
                toast.success('Producto agregado al marketplace.', { id: toastId });
            } else {
                if (!editingProduct) return;
                finalProduct = await funcionarioMarketplaceService.updateProduct(editingProduct.id, payload);
                toast.success('Producto actualizado correctamente.', { id: toastId });
            }

            const mediaToUpload = pendingSave.mediaItems?.filter(m => m.file);
            if (mediaToUpload && mediaToUpload.length > 0 && finalProduct.companyId) {
                await uploadProductMedia(finalProduct.companyId, Number(finalProduct.id), mediaToUpload);
                const refreshedProducts = await funcionarioMarketplaceService.getProducts();
                setProducts(refreshedProducts);
            } else {
                if (modalMode === 'create') {
                    setProducts((prev) => [finalProduct, ...prev]);
                } else {
                    setProducts((prev) =>
                        prev.map((p) => (p.id === finalProduct.id ? finalProduct : p)),
                    );
                }
            }

            setPendingSave(null);
            setShowModal(false);
        } catch (error: any) {
            toast.error(error?.message || 'No se pudo guardar el producto', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };
    const toggleActive = (productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;
        setPendingVisibility(product);
    };
    const confirmToggleActive = async () => {
        if (!pendingVisibility) return;
        setIsProcessing(true);
        const toastId = toast.loading(pendingVisibility.isPublic ? 'Desactivando producto...' : 'Activando producto...');
        try {
            const updated = await funcionarioMarketplaceService.setVisibility(
                pendingVisibility.id,
                !pendingVisibility.isPublic,
            );
            setProducts((prev) => prev.map((p) => (p.id === pendingVisibility.id ? updated : p)));
            toast.success(
                pendingVisibility.isPublic
                    ? `"${pendingVisibility.name}" desactivado del marketplace.`
                    : `"${pendingVisibility.name}" activado en el marketplace.`,
                { id: toastId }
            );
            setPendingVisibility(null);
        } catch (error: any) {
            toast.error(error?.message || 'No se pudo cambiar visibilidad', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };
    const confirmDelete = async () => {
        if (!deletingProduct) return;
        setIsProcessing(true);
        const toastId = toast.loading('Eliminando producto...');
        try {
            await funcionarioMarketplaceService.deleteProduct(deletingProduct.id);
            setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
            toast.success(`"${deletingProduct.name}" eliminado.`, { id: toastId });
            setDeletingProduct(null);
        } catch (error: any) {
            toast.error(error?.message || 'No se pudo eliminar el producto', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };
    // Forma tipada para el modal de edición
    const editInitialData: ProductFormData | undefined = editingProduct
        ? {
            name: editingProduct.name,
            description: editingProduct.description,
            basePrice: String(editingProduct.basePrice),
            productType: editingProduct.productType,
            stock: String(editingProduct.stock),
        }
        : undefined;
    return {
        // Estado
        products,
        filtered,
        searchTerm,
        setSearchTerm,
        filterType,
        setFilterType,
        loading,
        isProcessing,
        // Estadísticas
        totalActive,
        totalInactive,
        outOfStock,
        // Modal crear/editar
        showModal,
        setShowModal,
        modalMode,
        editingProduct,
        editInitialData,
        openCreate,
        openEdit,
        handleSave,
        // Confirmación guardar
        pendingSave,
        setPendingSave,
        confirmSave,
        // Visibilidad
        pendingVisibility,
        setPendingVisibility,
        toggleActive,
        confirmToggleActive,
        // Eliminar
        deletingProduct,
        setDeletingProduct,
        confirmDelete,
    };
}