'use client';
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, ProductAttribute } from '@/types/product';
import { useEffect, useMemo } from 'react';

interface BuyOrderModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  attrValues: Record<string, string>;
  errors: Record<string, string>;
  loading: boolean;
  quantity: number;
  onQuantityChange: (value: number) => void;
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
  quantity,
  onQuantityChange,
  onFieldChange,
  onConfirm,
  initAttributes,
}: BuyOrderModalProps) {
  useEffect(() => {
    if (isOpen && product.attributes && product.attributes.length > 0) {
      initAttributes(product.attributes);
    }
  }, [isOpen, product.attributes]);

  const visibleAttributes = useMemo(
    () => (product.attributes || [])
      .filter((attribute) => attribute.code !== 'color' && attribute.input_type !== 'color')
      .sort((a, b) => a.sort_order - b.sort_order),
    [product.attributes],
  );

  const getAttributeDisplayValue = (attribute: ProductAttribute): string => {
    const persistedValue = (attribute.default_value || '').trim();
    if (persistedValue) return persistedValue;
    if (attribute.placeholder && attribute.placeholder.trim()) return attribute.placeholder.trim();
    if (attribute.input_type === 'color') return '#000000';
    return 'No definido';
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm();
  };

  const subtotal = Number(product.price || 0) * quantity;
  const tax = Math.round(subtotal * 0.19 * 100) / 100;
  const total = subtotal + tax;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background text-foreground border border-border rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Resumen de compra</h2>
            <p className="text-sm text-muted-foreground mt-1">{product.title}</p>
            <p className="text-xs text-muted-foreground mt-1">Stock disponible: {product.stock}</p>
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
          <div className="space-y-4">
            {visibleAttributes.length > 0 ? (
              <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
                {visibleAttributes.map((attribute) => (
                  <div
                    key={attribute.code}
                    className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {attribute.label}{attribute.required ? '*' : ''}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-foreground text-right">
                      {getAttributeDisplayValue(attribute)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic py-2">
                Este producto no tiene atributos configurados.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(event) => onQuantityChange(Number(event.target.value) || 1)}
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
                  disabled={loading}
                />
                {errors.quantity && (
                  <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground">
                Máximo 10 unidades por pedido
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>IVA</span>
                <span>${tax.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>Total</span>
                <span>${total.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
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
