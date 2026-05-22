'use client';
import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/marketplace/FormField';
import { getProductTypeLabel } from '@/types/product';
import {
    type ProductFormData,
    type ProductFormSubmit,
    type MediaUploadItem,
    EMPTY_FORM,
    PRODUCT_TYPES,
} from '@/components/marketplace/types/marketplace.types';
import { MediaUploader } from '@/components/multimedia/MediaUploader';
import { marketplaceCatalogService, type MarketplaceShapeAttribute, type MarketplaceShape } from '@/services/marketplace-catalog.service';

interface ProductModalProps {
    mode: 'create' | 'edit';
    initialData?: ProductFormData;
    initialMediaItems?: MediaUploadItem[];
    initialShapeAttributes?: Record<string, string>;
    onClose: () => void;
    onSave: (data: ProductFormSubmit) => void;
}

export function ProductModal({ mode, initialData, initialMediaItems, initialShapeAttributes, onClose, onSave }: ProductModalProps) {
    const [form, setForm] = useState<ProductFormData>(initialData ?? EMPTY_FORM);
    const [errors, setErrors] = useState<Partial<ProductFormData>>({});
    const [mediaItems, setMediaItems] = useState<MediaUploadItem[]>(initialMediaItems ?? []);
    const [mediaError, setMediaError] = useState('');
    const [shapes, setShapes] = useState<MarketplaceShape[]>([]);
    const [shapeAttributes, setShapeAttributes] = useState<MarketplaceShapeAttribute[]>([]);
    const [shapeAttributeValues, setShapeAttributeValues] = useState<Record<string, string>>({});
    const [shapeAttributeErrors, setShapeAttributeErrors] = useState<Record<string, string>>({});
    const [loadingShapes, setLoadingShapes] = useState(false);
    const selectedShape = useMemo(
        () => shapes.find((shape) => shape.name === form.productShape) || null,
        [form.productShape, shapes]
    );
    const visibleShapeAttributes = useMemo(
        () => shapeAttributes.filter((attribute) => attribute.code !== 'color' && attribute.input_type !== 'color'),
        [shapeAttributes]
    );

    const set = (key: keyof ProductFormData, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
    };

    useEffect(() => {
        setForm(initialData ?? EMPTY_FORM);
        setMediaItems(initialMediaItems ?? []);
    }, [initialData, initialMediaItems]);

    useEffect(() => {
        if (!selectedShape || shapeAttributes.length === 0) {
            setShapeAttributeValues({});
            setShapeAttributeErrors({});
            return;
        }

        setShapeAttributeValues((prev) => {
            const next: Record<string, string> = {};

            shapeAttributes.forEach((attribute) => {
                next[attribute.code] = initialShapeAttributes?.[attribute.code] ?? prev[attribute.code] ?? '';
            });

            return next;
        });
    }, [selectedShape, shapeAttributes, initialShapeAttributes]);

    useEffect(() => {
        let mounted = true;

        const loadShapes = async () => {
            try {
                setLoadingShapes(true);
                const data = await marketplaceCatalogService.getShapes();
                if (mounted) {
                    setShapes(data);
                }
            } catch {
                if (mounted) {
                    setShapes([]);
                }
            } finally {
                if (mounted) {
                    setLoadingShapes(false);
                }
            }
        };

        void loadShapes();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        const loadAttributes = async () => {
            if (!selectedShape) {
                setShapeAttributes([]);
                return;
            }

            try {
                const data = await marketplaceCatalogService.getShapeAttributes(selectedShape.id);
                if (mounted) {
                    setShapeAttributes(data);
                }
            } catch {
                if (mounted) {
                    setShapeAttributes([]);
                }
            }
        };

        void loadAttributes();

        return () => {
            mounted = false;
        };
    }, [selectedShape]);

    const validate = (): boolean => {
        const newErrors: Partial<ProductFormData> = {};
        const newShapeErrors: Record<string, string> = {};
        if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio.';
        if (!form.description.trim()) newErrors.description = 'La descripción es obligatoria.';
        if (!form.basePrice || isNaN(Number(form.basePrice)) || Number(form.basePrice) <= 0)
            newErrors.basePrice = 'Ingresa un precio válido mayor a 0.';
        if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
            newErrors.stock = 'Ingresa un stock válido (0 o más).';
        if (!form.productShape) newErrors.productShape = 'Debes seleccionar un shape de producto.';

        visibleShapeAttributes.forEach((attribute) => {
            const currentValue = shapeAttributeValues[attribute.code] || '';
            if (attribute.required && !currentValue.trim()) {
                newShapeErrors[attribute.code] = `El campo ${attribute.label} es obligatorio.`;
            }
            if (attribute.input_type === 'number' && currentValue.trim()) {
                if (isNaN(Number(currentValue)) || Number(currentValue) <= 0) {
                    newShapeErrors[attribute.code] = `El campo ${attribute.label} debe ser mayor a 0.`;
                }
            }
        });
        
        const hasMedia = mediaItems.length > 0;
        if (!hasMedia) {
            setMediaError('Debe subir al menos un archivo multimedia.');
        } else {
            setMediaError('');
        }
        
        setErrors(newErrors);
        setShapeAttributeErrors(newShapeErrors);
        return Object.keys(newErrors).length === 0 && Object.keys(newShapeErrors).length === 0 && hasMedia;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave({ ...form, mediaItems, shapeAttributes: shapeAttributeValues });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header del modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-semibold">
                        {mode === 'create' ? 'Agregar Producto' : 'Editar Producto'}
                    </h2>
                    <button
                        onClick={onClose}
                        type="button"
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

                    <FormField label="Shape del producto" error={errors.productShape}>
                        <select
                            value={form.productShape}
                            onChange={(e) => set('productShape', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                            disabled={loadingShapes}
                        >
                            <option value="">Selecciona un shape</option>
                            {shapes.map((shape) => (
                                <option key={shape.id} value={shape.name}>
                                    {shape.name}
                                </option>
                            ))}
                        </select>
                        {loadingShapes && (
                            <p className="text-xs text-muted-foreground mt-1">Cargando shapes...</p>
                        )}
                    </FormField>

                    {selectedShape && (
                        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Atributos requeridos para {selectedShape.name}</p>
                                <p className="text-xs text-muted-foreground">Completa estos campos para dejar el producto listo para el marketplace.</p>
                            </div>
                            <div className="grid gap-4">
                                {visibleShapeAttributes.length > 0 ? visibleShapeAttributes.map((attribute) => (
                                    <FormField
                                        key={attribute.id}
                                        label={attribute.label}
                                        error={shapeAttributeErrors[attribute.code]}
                                    >
                                        {attribute.input_type === 'number' ? (
                                            <input
                                                type="number"
                                                min={0}
                                                value={shapeAttributeValues[attribute.code] || ''}
                                                onChange={(event) => setShapeAttributeValues((prev) => ({ ...prev, [attribute.code]: event.target.value }))}
                                                placeholder={attribute.placeholder || `Ej: ${attribute.label.toLowerCase()}`}
                                                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={shapeAttributeValues[attribute.code] || ''}
                                                onChange={(event) => setShapeAttributeValues((prev) => ({ ...prev, [attribute.code]: event.target.value }))}
                                                placeholder={attribute.placeholder || `Ej: ${attribute.label.toLowerCase()}`}
                                                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                                            />
                                        )}
                                    </FormField>
                                )) : (
                                    <p className="text-sm text-muted-foreground">Este shape no tiene atributos configurados.</p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <FormField label="Multimedia (Imágenes y Videos)">
                        <MediaUploader
                            items={mediaItems}
                            onChange={(items) => {
                                setMediaItems(items);
                                if (items.length > 0) setMediaError('');
                            }}
                            error={mediaError}
                        />
                    </FormField>

                    {/* Acciones */}
                    <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-white">
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