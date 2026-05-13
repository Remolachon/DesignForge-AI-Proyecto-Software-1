import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { type FilterType, FILTER_OPTIONS } from '@/components/marketplace/types/marketplace.types';
interface MarketplaceFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filterType: FilterType;
    onFilterChange: (value: FilterType) => void;
}
export function MarketplaceFilters({
    searchTerm,
    onSearchChange,
    filterType,
    onFilterChange,
}: MarketplaceFiltersProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-lg
                         text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                        />
                    </div>
                    <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
                        {FILTER_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => onFilterChange(value)}
                                className={`
                  px-3 py-1.5 text-sm rounded-lg transition-all whitespace-nowrap
                  ${filterType === value
                                        ? 'bg-white shadow-sm text-black font-medium'
                                        : 'text-muted-foreground hover:text-black'}
                `}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}