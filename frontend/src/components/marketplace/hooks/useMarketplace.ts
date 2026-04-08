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
export function useMarketplace() {
    const [products, setProducts] = useState<MarketplaceProduct[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [loading, setLoading] = useState(true);
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
            if (pendingSave.imageFile) {
                const uploaded = await funcionarioMarketplaceService.uploadProductImage(pendingSave.imageFile);
                payload.imageStoragePath = uploaded.storage_path;
            }
            if (modalMode === 'create') {
                const created = await funcionarioMarketplaceService.createProduct(payload);
                setProducts((prev) => [created, ...prev]);
                toast.success('Producto agregado al marketplace.');
            } else if (editingProduct) {
                const updated = await funcionarioMarketplaceService.updateProduct(editingProduct.id, payload);
                setProducts((prev) =>
                    prev.map((p) => (p.id === editingProduct.id ? updated : p)),
                );
                toast.success('Producto actualizado correctamente.');
            }
            setPendingSave(null);
            setShowModal(false);
        } catch (error: any) {
            toast.error(error?.message || 'No se pudo guardar el producto');
        }
    };
    const toggleActive = (productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;
        setPendingVisibility(product);
    };
    const confirmToggleActive = async () => {
        if (!pendingVisibility) return;
        try {
            const updated = await funcionarioMarketplaceService.setVisibility(
                pendingVisibility.id,
                !pendingVisibility.isActive,
            );
            setProducts((prev) => prev.map((p) => (p.id === pendingVisibility.id ? updated : p)));
            toast.success(
                pendingVisibility.isActive
                    ? `"${pendingVisibility.name}" desactivado del marketplace.`
                    : `"${pendingVisibility.name}" activado en el marketplace.`,
            );
            setPendingVisibility(null);
        } catch (error: any) {
            toast.error(error?.message || 'No se pudo cambiar visibilidad');
        }
    };
    const confirmDelete = async () => {
        if (!deletingProduct) return;
        try {
            await funcionarioMarketplaceService.deleteProduct(deletingProduct.id);
            setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
            toast.success(`"${deletingProduct.name}" eliminado.`);
            setDeletingProduct(null);
        } catch (error: any) {
            toast.error(error?.message || 'No se pudo eliminar el producto');
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