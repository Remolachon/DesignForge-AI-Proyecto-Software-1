import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteModalProps {
    productName: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export function DeleteModal({ productName, onConfirm, onCancel, loading = false }: DeleteModalProps) {
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
                    <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        className="flex-1 gap-2"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </div>
            </div>
        </div>
    );
}