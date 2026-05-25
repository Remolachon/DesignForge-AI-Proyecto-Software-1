import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderStatus } from '@/types/order';
interface ConfirmStatusModalProps {
    orderId: string;
    nextStatus: OrderStatus;
    onConfirm: () => void;
    onCancel: () => void;
}
export function ConfirmStatusModal({ orderId, nextStatus, onConfirm, onCancel }: ConfirmStatusModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]">
            <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 text-center text-foreground shadow-2xl">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Confirmar cambio de estado</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    ¿Seguro que deseas actualizar el pedido{' '}
                    <span className="font-medium text-foreground">#{orderId}</span> a{' '}
                    <span className="font-medium text-foreground">{nextStatus}</span>?
                </p>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={onConfirm}>
                        Confirmar
                    </Button>
                </div>
            </div>
        </div>
    );
}