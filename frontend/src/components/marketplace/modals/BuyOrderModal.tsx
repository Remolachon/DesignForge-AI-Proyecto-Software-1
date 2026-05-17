'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, ProductAttribute } from '@/types/product';
import { AttributeInput } from '../AttributeInput';
import { useEffect } from 'react';

interface BuyOrderModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  attrValues: Record<string, string>;
  errors: Record<string, string>;
  loading: boolean;
  onFieldChange: (code: string, value: string) => void;
  onConfirm: () => void;
  initAttributes: (attributes: ProductAttribute[]) => void;
}

export function BuyOrderModal({
  product,
  isOpen,
  onClose,
  attrValues,
  errors,
  loading,
  onFieldChange,
  onConfirm,
  initAttributes,
}: BuyOrderModalProps) {
  useEffect(() => {
    if (isOpen && product.attributes && product.attributes.length > 0) {
      initAttributes(product.attributes);
    }
  }, [isOpen, product.attributes]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm();
  };

  const extraPrice = product.attributes?.reduce((total, attr) => {
    if (attr.type !== 'select') return total;
    const selected = attr.options?.find(o => o.value === attrValues[attr.code]);
    return total + (selected?.price_modifier ?? 0);
  }, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Parámetros del Pedido</h2>
            <p className="text-sm text-muted-foreground mt-1">{product.title}</p>
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
          {product.attributes && product.attributes.length > 0 ? (
            <div className="space-y-4">
              {product.attributes
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(attr => (
                  <div key={attr.code}>
                    <AttributeInput
                      attribute={attr}
                      value={attrValues[attr.code] ?? ''}
                      onChange={onFieldChange}
                      disabled={loading}
                    />
                    {errors[attr.code] && (
                      <p className="text-xs text-red-500 mt-1">{errors[attr.code]}</p>
                    )}
                  </div>
                ))}

              {/* Precio extra acumulado */}
              {extraPrice > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
                  Costo adicional por opciones:
                  <span className="font-bold ml-1">+${extraPrice.toLocaleString('es-CO')}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic py-2">
              Este producto no requiere parámetros adicionales.
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
