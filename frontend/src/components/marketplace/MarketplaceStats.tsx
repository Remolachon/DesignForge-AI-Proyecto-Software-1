import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
interface MarketplaceStatsProps {
    totalActive: number;
    totalInactive: number;
    outOfStock: number;
}
export function MarketplaceStats({ totalActive, totalInactive, outOfStock }: MarketplaceStatsProps) {
    const stats = [
        { label: 'Productos activos', value: totalActive, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Productos inactivos', value: totalInactive, color: 'text-gray-500', bg: 'bg-gray-100' },
        { label: 'Sin stock', value: outOfStock, color: 'text-red-600', bg: 'bg-red-100' },
    ];
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map(({ label, value, color, bg }) => (
                <Card key={label}>
                    <CardContent className="pt-5 pb-5">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
                                <Package className={`w-5 h-5 ${color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{label}</p>
                                <p className="text-2xl font-semibold">{value}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}