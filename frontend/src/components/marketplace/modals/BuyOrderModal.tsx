'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/marketplace/FormField';
import type { BuyFormData, BuyFormErrors } from '@/components/marketplace/hooks/useMarketplaceBuy';

interface BuyOrderModalProps {
  productTitle: string;
  isOpen: boolean;
  onClose: () => void;
  formData: BuyFormData;
  errors: Partial<BuyFormErrors>;
  loading: boolean;
  onFieldChange: (field: keyof BuyFormData, value: string) => void;
  onConfirm: () => void;
}

export function BuyOrderModal({
  productTitle,
  isOpen,
  onClose,
  formData,
  errors,
  loading,
  onFieldChange,
  onConfirm,
}: BuyOrderModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Parámetros del Pedido</h2>
            <p className="text-sm text-muted-foreground mt-1">{productTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <FormField label="Longitud (cm)" error={errors.length}>
            <input
              type="number"
              min="1"
              step="0.1"
              value={formData.length}
              onChange={(e) => onFieldChange('length', e.target.value)}
              placeholder="Ej: 20"
              disabled={loading}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent transition-shadow
                       disabled:opacity-50"
            />
          </FormField>

          <FormField label="Altura (cm)" error={errors.height}>
            <input
              type="number"
              min="1"
              step="0.1"
              value={formData.height}
              onChange={(e) => onFieldChange('height', e.target.value)}
              placeholder="Ej: 30"
              disabled={loading}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent transition-shadow
                       disabled:opacity-50"
            />
          </FormField>

          <FormField label="Ancho (cm)" error={errors.width}>
            <input
              type="number"
              min="1"
              step="0.1"
              value={formData.width}
              onChange={(e) => onFieldChange('width', e.target.value)}
              placeholder="Ej: 15"
              disabled={loading}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent transition-shadow
                       disabled:opacity-50"
            />
          </FormField>

          <FormField label="Material" error={errors.material}>
            <select
              value={formData.material}
              onChange={(e) => onFieldChange('material', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm
                       bg-white focus:outline-none focus:ring-2 focus:ring-accent
                       transition-shadow disabled:opacity-50"
            >
              <option value="">Seleccionar material</option>
              <option value="standard">Estándar</option>
              <option value="premium">Premium</option>
              <option value="deluxe">Deluxe</option>
            </select>
          </FormField>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Procesando...' : 'Continuar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
