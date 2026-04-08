import { Button } from '@/components/ui/button';
interface ConfirmActionModalProps {
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
}
export function ConfirmActionModal({
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