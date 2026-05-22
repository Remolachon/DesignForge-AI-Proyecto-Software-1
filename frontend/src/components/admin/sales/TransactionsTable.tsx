"use client";

import type { TransactionItem } from "@/services/salesService";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  approved:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  pending:
    "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  declined:
    "bg-red-50 text-red-700 ring-1 ring-red-200",
  expired:
    "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
  cancelled:
    "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
  refunded:
    "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Aprobada",
  pending: "Pendiente",
  declined: "Rechazada",
  expired: "Expirada",
  cancelled: "Cancelada",
  refunded: "Reembolsada",
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

// ─── Filter Options ───────────────────────────────────────────────────────────

type StatusFilter = "" | "approved" | "pending";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "approved", label: "Aprobadas" },
  { value: "pending", label: "Pendientes" },
];

// ─── Skeleton Rows ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3.5 rounded-full bg-gray-100 animate-pulse" style={{ width: `${50 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TransactionsTableProps {
  items: TransactionItem[];
  total: number;
  loading?: boolean;
  statusFilter: StatusFilter;
  onStatusFilterChange: (s: StatusFilter) => void;
  offset: number;
  limit: number;
  onPrev: () => void;
  onNext: () => void;
}

export function TransactionsTable({
  items,
  total,
  loading = false,
  statusFilter,
  onStatusFilterChange,
  offset,
  limit,
  onPrev,
  onNext,
}: TransactionsTableProps) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Transacciones</h2>
          <p className="text-xs text-gray-400">
            {total > 0 ? `${from}–${to} de ${total} transacciones` : "Sin transacciones en este período"}
          </p>
        </div>

        {/* Status filter pills */}
        <div
          className="inline-flex items-center gap-1 rounded-xl bg-gray-100 p-1"
          role="group"
          aria-label="Filtro de estado"
        >
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              id={`tx-status-filter-${opt.value || "all"}`}
              type="button"
              onClick={() => onStatusFilterChange(opt.value)}
              aria-pressed={statusFilter === opt.value}
              className={[
                "rounded-lg px-3 py-1 text-xs font-medium transition-all duration-200",
                statusFilter === opt.value
                  ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/70"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-50 text-sm">
          <thead>
            <tr className="bg-gray-50/60">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Cliente
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                Monto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Método
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Ref. PayU
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-400">Sin transacciones</p>
                    <p className="mt-1 text-xs text-gray-300">Cambia el filtro o el período de tiempo</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((tx) => (
                <tr
                  key={tx.id}
                  className="transition-colors duration-100 hover:bg-gray-50/70"
                >
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                    #{tx.id}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-gray-800">{tx.customer_name}</p>
                    <p className="text-xs text-gray-400">{tx.customer_email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                    {formatCOP(tx.amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-4 py-3.5 capitalize text-gray-600">
                    {tx.payment_method}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                    {formatDate(tx.transaction_date)}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-400 max-w-[10rem] truncate">
                    {tx.payu_reference ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
          <p className="text-xs text-gray-400">
            Mostrando {from}–{to} de {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              id="tx-pagination-prev"
              type="button"
              onClick={onPrev}
              disabled={!canPrev || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </button>
            <button
              id="tx-pagination-next"
              type="button"
              onClick={onNext}
              disabled={!canNext || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
