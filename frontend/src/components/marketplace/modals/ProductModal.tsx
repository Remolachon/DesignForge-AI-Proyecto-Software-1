'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/marketplace/FormField';
import { getProductTypeLabel } from '@/features/Mockordersadmin';
import {
    type ProductFormData,
    type ProductFormSubmit,
    EMPTY_FORM,
    PRODUCT_TYPES,
} from '@/components/marketplace/types/marketplace.types';
interface ProductModalProps {
    mode: 'create' | 'edit';
    initialData?: ProductFormData;
    initialImageUrl?: string | null;
    onClose: () => void;
    onSave: (data: ProductFormSubmit) => void;
}
export function ProductModal({ mode, initialData, initialImageUrl, onClose, onSave }: ProductModalProps) {
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
        if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio.';
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