// /components/marketplace/Filters.tsx
'use client';

import { Search } from 'lucide-react';
import { ProductType } from '@/types/product';

interface Props {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterType: ProductType | 'all';
  setFilterType: (v: ProductType | 'all') => void;
}

type FilterType = ProductType | 'all';

const types: FilterType[] = ['all', 'bordado', 'neon-flex', 'acrilico'];

export const Filters = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
}: Props) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg border ${
              filterType === type ? 'bg-black text-white' : ''
            }`}
          >
            {type === 'all' ? 'Todos' : type}
          </button>
        ))}
      </div>
    </div>
  );
};