'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  Plus,
  Search,
  Star,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  X,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  funcionarioMarketplaceService,
  type MarketplaceSavePayload,
} from '@/services/funcionario-marketplace.service';

import {
  type MarketplaceProduct,
} from '@/features/Mockmarketplace';
import { type ProductType, getProductTypeLabel } from '@/features/Mockordersadmin';

// ─── Tipos locales ────────────────────────────────────────────────────────────
type FilterType = ProductType | 'all';

type ProductFormData = {
  name: string;
  description: string;
  basePrice: string;
  productType: ProductType;
  stock: string;
};

type ProductFormSubmit = ProductFormData & {
  imageFile: File | null;
};

const EMPTY_FORM: ProductFormData = {
  name: '',
  description: '',
  basePrice: '',
  productType: 'bordado',
  stock: '',
};

const PRODUCT_TYPES: ProductType[] = ['bordado', 'neon-flex', 'acrilico'];
const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all',       label: 'Todos' },
  { value: 'bordado',   label: 'Bordado' },
  { value: 'neon-flex', label: 'Neon Flex' },
  { value: 'acrilico',  label: 'Acrílico' },
];

// ─── Sub-componente: badge de tipo ────────────────────────────────────────────
function TypeBadge({ type }: { type: ProductType }) {
  const colors: Record<ProductType, string> = {
    bordado:   'bg-blue-100 text-blue-700',
    'neon-flex': 'bg-purple-100 text-purple-700',
    acrilico:  'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[type]}`}>
      {getProductTypeLabel(type)}
    </span>
  );
}

// ─── Sub-componente: campo de formulario ──────────────────────────────────────
interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

function FormField({ label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Sub-componente: modal de crear / editar ──────────────────────────────────
interface ProductModalProps {
  mode: 'create' | 'edit';
  initialData?: ProductFormData;
  initialImageUrl?: string | null;
  onClose: () => void;
  onSave: (data: ProductFormData & { imageFile: File | null }) => void;
}

function ProductModal({ mode, initialData, initialImageUrl, onClose, onSave }: ProductModalProps) {
  const [form, setForm] = useState<ProductFormData>(initialData ?? EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<ProductFormData>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialImageUrl ?? null);
  const [imageError, setImageError] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const set = (key: keyof ProductFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<ProductFormData> = {};
    if (!form.name.trim())        newErrors.name        = 'El nombre es obligatorio.';
    if (!form.description.trim()) newErrors.description = 'La descripción es obligatoria.';
    if (!form.basePrice || isNaN(Number(form.basePrice)) || Number(form.basePrice) <= 0)
      newErrors.basePrice = 'Ingresa un precio válido mayor a 0.';
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      newErrors.stock = 'Ingresa un stock válido (0 o más).';

    const hasImage = Boolean(imagePreviewUrl || imageFile);

    if (!hasImage) {
      setImageError('La imagen es obligatoria para agregar un producto.');
    } else {
      setImageError('');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && hasImage;
  };

  const onFileChange = (file?: File) => {
    if (!file) return;

    if (imagePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const nextPreview = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreviewUrl(nextPreview);
    setImageError('');
  };

  const clearSelectedImage = () => {
    if (imagePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(null);
    setImagePreviewUrl(null);
    setFileInputKey((prev) => prev + 1);
    setImageError('La imagen es obligatoria para agregar un producto.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave({ ...form, imageFile });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {mode === 'create' ? 'Agregar Producto' : 'Editar Producto'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <FormField label="Nombre del producto" error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej: Letrero Neon Estándar"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
            />
          </FormField>

          <FormField label="Descripción" error={errors.description}>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descripción breve del producto..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Precio base (COP)" error={errors.basePrice}>
              <input
                type="number"
                min={0}
                value={form.basePrice}
                onChange={(e) => set('basePrice', e.target.value)}
                placeholder="Ej: 150000"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
              />
            </FormField>

            <FormField label="Stock disponible" error={errors.stock}>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                placeholder="Ej: 10"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
              />
            </FormField>
          </div>

          <FormField label="Tipo de producto">
            <select
              value={form.productType}
              onChange={(e) => set('productType', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {getProductTypeLabel(t)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Imagen del producto" error={imageError}>
            <div className="space-y-3">
              <div className="relative w-full h-40 rounded-lg overflow-hidden border border-dashed border-border bg-muted/20">
                {imagePreviewUrl ? (
                  <Image src={imagePreviewUrl} alt="Vista previa del producto" fill sizes="100vw" unoptimized className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    Sin imagen seleccionada
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3 py-2 text-sm border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                  {imagePreviewUrl ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      onFileChange(e.target.files?.[0]);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>

                {imagePreviewUrl && (
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Quitar imagen
                  </button>
                )}
              </div>
            </div>
          </FormField>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Agregar' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sub-componente: modal de confirmación de eliminación ─────────────────────
interface DeleteModalProps {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteModal({ productName, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Eliminar producto</h3>
        <p className="text-sm text-muted-foreground mb-6">
          ¿Estás seguro de que deseas eliminar{' '}
          <span className="font-medium text-foreground">"{productName}"</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmActionModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function FuncionarioMarketplace() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterType, setFilterType]   = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  // Modales
  const [showModal, setShowModal]         = useState(false);
  const [modalMode, setModalMode]         = useState<'create' | 'edit'>('create');
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
  const totalActive   = products.filter((p) => p.isActive).length;
  const totalInactive = products.filter((p) => !p.isActive).length;
  const outOfStock    = products.filter((p) => !p.inStock).length;

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
        name:        editingProduct.name,
        description: editingProduct.description,
        basePrice:   String(editingProduct.basePrice),
        productType: editingProduct.productType,
        stock:       String(editingProduct.stock),
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-primary mb-2">
              Gestión del Marketplace
            </h1>
            <p className="text-muted-foreground">
              Agrega, edita y administra los productos disponibles
            </p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={openCreate}>
            <Plus className="w-5 h-5" />
            Agregar Producto
          </Button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Productos activos',   value: totalActive,   color: 'text-green-600',  bg: 'bg-green-100' },
            { label: 'Productos inactivos', value: totalInactive, color: 'text-gray-500',   bg: 'bg-gray-100'  },
            { label: 'Sin stock',           value: outOfStock,    color: 'text-red-600',    bg: 'bg-red-100'   },
          ].map(({ label, value, color, bg }) => (
            <Card key={label}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
                    <Package className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-semibold">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-lg
                             text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                />
              </div>
              <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
                {FILTER_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilterType(value)}
                    className={`
                      px-3 py-1.5 text-sm rounded-lg transition-all whitespace-nowrap
                      ${filterType === value
                        ? 'bg-white shadow-sm text-black font-medium'
                        : 'text-muted-foreground hover:text-black'}
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de productos */}
        {loading ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-sm">Cargando productos...</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-sm">
                No se encontraron productos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => (
              <Card
                key={product.id}
                className={`overflow-hidden transition-all ${
                  !product.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* Imagen */}
                <div className="relative aspect-video">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                  {/* Overlay de estado */}
                  {!product.isActive && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-full">
                        Inactivo
                      </span>
                    </div>
                  )}
                  {!product.inStock && product.isActive && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        Sin stock
                      </span>
                    </div>
                  )}
                </div>

                <CardContent className="pt-4 pb-4 space-y-3">
                  {/* Tipo y rating */}
                  <div className="flex items-center justify-between">
                    <TypeBadge type={product.productType} />
                    {product.reviews > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span>{product.rating}</span>
                        <span>({product.reviews})</span>
                      </div>
                    )}
                  </div>

                  {/* Nombre y descripción */}
                  <div>
                    <h3 className="font-semibold text-sm leading-tight mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {/* Precio y stock */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-primary text-base">
                      ${product.basePrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Stock: <span className="font-medium text-foreground">{product.stock}</span>
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-1">
                    {/* Activar / Desactivar */}
                    <button
                      onClick={() => toggleActive(product.id)}
                      title={product.isActive ? 'Desactivar' : 'Activar'}
                      className={`
                        flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium
                        border transition-colors
                        ${product.isActive
                          ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'}
                      `}
                    >
                      {product.isActive ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          Activar
                        </>
                      )}
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => openEdit(product)}
                      title="Editar producto"
                      className="px-3 py-1.5 rounded-lg border border-border bg-white hover:bg-muted
                                 text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => setDeletingProduct(product)}
                      title="Eliminar producto"
                      className="p-1.5 rounded-lg border border-red-100 bg-red-50 text-red-500
                                 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pie de página con conteo */}
        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Mostrando{' '}
            <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
            de{' '}
            <span className="font-semibold text-foreground">{products.length}</span>{' '}
            productos
          </p>
        )}
      </main>

      {/* Modal crear / editar */}
      {showModal && (
        <ProductModal
          mode={modalMode}
          initialData={editInitialData}
          initialImageUrl={editingProduct?.imageUrl}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {pendingSave && (
        <ConfirmActionModal
          title={modalMode === 'create' ? 'Confirmar nuevo producto' : 'Confirmar cambios'}
          description={
            modalMode === 'create'
              ? 'Se creará un nuevo producto en el marketplace con la información diligenciada.'
              : 'Se guardarán los cambios realizados a este producto.'
          }
          confirmLabel={modalMode === 'create' ? 'Crear producto' : 'Guardar cambios'}
          onConfirm={confirmSave}
          onCancel={() => setPendingSave(null)}
        />
      )}

      {pendingVisibility && (
        <ConfirmActionModal
          title={pendingVisibility.isActive ? 'Desactivar producto' : 'Activar producto'}
          description={
            pendingVisibility.isActive
              ? `"${pendingVisibility.name}" dejará de mostrarse en el marketplace público.`
              : `"${pendingVisibility.name}" volverá a mostrarse en el marketplace público.`
          }
          confirmLabel={pendingVisibility.isActive ? 'Desactivar' : 'Activar'}
          onConfirm={confirmToggleActive}
          onCancel={() => setPendingVisibility(null)}
        />
      )}

      {/* Modal confirmación de eliminación */}
      {deletingProduct && (
        <DeleteModal
          productName={deletingProduct.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingProduct(null)}
        />
      )}
    </div>
  );
}

// Tipo interno para el formulario usado en handleSave