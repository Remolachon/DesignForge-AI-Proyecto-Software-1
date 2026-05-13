import { OrderStatus } from '@/types/order';
import { getStatusColor } from '@/lib/utils/statusColors';
import { ORDER_STATUSES } from './pedidos-funcionario.types';
interface StatusSelectProps {
    orderId: string;
    currentStatus: OrderStatus;
    onChange: (id: string, newStatus: OrderStatus) => void;
}
export function StatusSelect({ orderId, currentStatus, onChange }: StatusSelectProps) {
    return (
        <select
            value={currentStatus}
            onChange={(e) => onChange(orderId, e.target.value as OrderStatus)}
            className={`
        text-xs px-2 py-1.5 rounded-full border font-medium cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-accent transition-colors
        ${getStatusColor(currentStatus)}
      `}
        >
            {ORDER_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-white text-gray-900 font-normal">
                    {s}
                </option>
            ))}
        </select>
    );
}