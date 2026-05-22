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
      className="inline-flex items-center gap-1 rounded-2xl bg-gray-100 p-1"
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
                ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/70"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
