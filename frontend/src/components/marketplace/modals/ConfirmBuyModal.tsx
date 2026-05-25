'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface ConfirmBuyModalProps {
  productTitle: string;
  quantity: number;
  totalAmount: number;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function ConfirmBuyModal({
  productTitle,
  quantity,
  totalAmount,
  isOpen,
  onConfirm,
  onCancel,
  loading,
}: ConfirmBuyModalProps) {
  if (!isOpen) return null;

  const safeTotalAmount = Number.isFinite(totalAmount) ? totalAmount : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background text-foreground border border-border rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Confirmar Pedido</h3>
        <p className="text-sm text-muted-foreground mb-6">
          ¿Estás seguro de que deseas comprar{' '}
          <span className="font-medium text-foreground">&quot;{productTitle}&quot;</span> con cantidad <span className="font-medium text-foreground">{quantity}</span> por un total de <span className="font-medium text-foreground">${safeTotalAmount.toLocaleString('es-CO')}</span>?
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? 'Creando...' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
