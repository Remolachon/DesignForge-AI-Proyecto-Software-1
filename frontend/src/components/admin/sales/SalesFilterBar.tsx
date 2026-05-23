"use client";

import type { TimeFilter } from "@/services/salesService";

interface FilterOption {
  value: TimeFilter;
  label: string;
}

const FILTERS: FilterOption[] = [
  { value: "day", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
];

interface SalesFilterBarProps {
  value: TimeFilter;
  onChange: (filter: TimeFilter) => void;
}

export function SalesFilterBar({ value, onChange }: SalesFilterBarProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-2xl bg-muted p-1"
      role="group"
      aria-label="Filtro de período"
    >
      {FILTERS.map((filter) => {
        const isActive = filter.value === value;
        return (
          <button
            key={filter.value}
            id={`sales-filter-${filter.value}`}
            type="button"
            onClick={() => onChange(filter.value)}
            aria-pressed={isActive}
            className={[
              "rounded-xl px-4 py-1.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
