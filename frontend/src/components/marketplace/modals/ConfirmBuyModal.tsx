'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface ConfirmBuyModalProps {
  productTitle: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function ConfirmBuyModal({
  productTitle,
  isOpen,
  onConfirm,
  onCancel,
  loading,
}: ConfirmBuyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Confirmar Pedido</h3>
        <p className="text-sm text-muted-foreground mb-6">
          ¿Estás seguro de que deseas comprar{' '}
          <span className="font-medium text-foreground">"{productTitle}"</span> con los
          parámetros especificados?
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
