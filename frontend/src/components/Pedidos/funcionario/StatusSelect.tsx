import { OrderStatus } from '@/types/order';
import { getStatusColor } from '@/lib/utils/statusColors';
import { ORDER_STATUSES } from './pedidos-funcionario.types';
interface StatusSelectProps {
    orderId: string;
    currentStatus: OrderStatus;
    onChange: (id: string, newStatus: OrderStatus) => void;
}
export function StatusSelect({ orderId, currentStatus, onChange }: StatusSelectProps) {
    const editableStatuses = ORDER_STATUSES.filter((status) => status !== 'Pendiente de pago');

    if (currentStatus === 'Pendiente de pago') {
        return (
            <span className={`text-xs px-2 py-1.5 rounded-full border font-medium inline-flex ${getStatusColor(currentStatus)}`}>
                {currentStatus}
            </span>
        );
    }

    return (
        <select
            value={currentStatus}
            onChange={(e) => onChange(orderId, e.target.value as OrderStatus)}
            className={`
        text-xs px-2 py-1.5 rounded-full border font-medium cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-accent transition-colors
        bg-background text-foreground
        ${getStatusColor(currentStatus)}
      `}
        >
            {editableStatuses.map((s) => (
                <option key={s} value={s} className="bg-background text-foreground font-medium">
                    {s}
                </option>
            ))}
        </select>
    );
}