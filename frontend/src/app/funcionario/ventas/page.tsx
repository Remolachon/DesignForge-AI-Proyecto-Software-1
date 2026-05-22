"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  Percent,
  Receipt,
} from "lucide-react";

import Header from "@/components/Header";
import { SalesFilterBar } from "@/components/admin/sales/SalesFilterBar";
import { MetricCard } from "@/components/admin/sales/MetricCard";
import { SalesChart } from "@/components/admin/sales/SalesChart";
import { TransactionsTable } from "@/components/admin/sales/TransactionsTable";

import {
  fetchCompanySalesSummary,
  fetchCompanySalesChart,
  fetchCompanyTransactions,
  type TimeFilter,
  type SalesSummary,
  type ChartDataPoint,
  type TransactionItem,
} from "@/services/salesService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

const PAGE_SIZE = 20;

// ─── Page Component ───────────────────────────────────────────────────────────

export default function FuncionarioVentasPage() {
  // ── Filters & pagination ──
  const [filter, setFilter] = useState<TimeFilter>("month");
  const [statusFilter, setStatusFilter] = useState<"" | "approved" | "pending">("");
  const [offset, setOffset] = useState(0);

  // ── Data ──
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);

  // ── Loading / error ──
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [chartError, setChartError] = useState("");
  const [txError, setTxError] = useState("");

  // ── Effect: summary + chart (reload on filter change) ──
  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setSummaryLoading(true);
      setChartLoading(true);
      setSummaryError("");
      setChartError("");

      try {
        const [summaryRes, chartRes] = await Promise.all([
          fetchCompanySalesSummary(filter),
          fetchCompanySalesChart(filter),
        ]);
        if (!cancelled) {
          setSummary(summaryRes);
          setChartData(chartRes.data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            "No se pudo cargar la información de ventas.";
          setSummaryError(msg);
          setChartError(msg);
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
          setChartLoading(false);
        }
      }
    }

    loadOverview();
    return () => { cancelled = true; };
  }, [filter]);

  // ── Effect: transactions (reload on filter, statusFilter, offset change) ──
  useEffect(() => {
    let cancelled = false;

    async function loadTransactions() {
      setTxLoading(true);
      setTxError("");

      try {
        const res = await fetchCompanyTransactions({
          filter,
          status: statusFilter || undefined,
          limit: PAGE_SIZE,
          offset,
        });
        if (!cancelled) {
          setTransactions(res.items);
          setTotalTransactions(res.total);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            "No se pudo cargar las transacciones.";
          setTxError(msg);
        }
      } finally {
        if (!cancelled) {
          setTxLoading(false);
        }
      }
    }

    loadTransactions();
    return () => { cancelled = true; };
  }, [filter, statusFilter, offset]);

  // Reset offset when filters change
  const handleFilterChange = useCallback((f: TimeFilter) => {
    setFilter(f);
    setOffset(0);
  }, []);

  const handleStatusFilterChange = useCallback((s: "" | "approved" | "pending") => {
    setStatusFilter(s);
    setOffset(0);
  }, []);

  const globalError = summaryError || chartError || txError;

  // ── Metric cards data ──
  const metrics = [
    {
      id: "total-ventas",
      title: "Total Ventas",
      value: summary ? formatCOP(summary.total_ventas) : "—",
      subtitle: "Ventas de tu empresa en el período",
      icon: <DollarSign />,
      accentColor: "bg-indigo-500",
    },
    {
      id: "total-ganancias",
      title: "Ganancias Netas",
      value: summary ? formatCOP(summary.total_ganancias) : "—",
      subtitle: "Margen sobre costo base",
      icon: <TrendingUp />,
      accentColor: "bg-emerald-500",
    },
    {
      id: "total-transacciones",
      title: "Transacciones",
      value: summary ? String(summary.total_transacciones) : "—",
      subtitle: `${summary?.transacciones_aprobadas ?? "—"} aprobadas`,
      icon: <ShoppingCart />,
      accentColor: "bg-violet-500",
    },
    {
      id: "tasa-aprobacion",
      title: "Tasa de Aprobación",
      value: summary ? formatPercent(summary.tasa_aprobacion) : "—",
      subtitle: `Ticket promedio: ${summary ? formatCOP(summary.ticket_promedio) : "—"}`,
      icon: <CheckCircle />,
      accentColor: "bg-amber-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <Header />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Page header ── */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ventas de mi Empresa
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitorea el rendimiento financiero y el historial de transacciones de tus productos.
            </p>
          </div>

          <SalesFilterBar value={filter} onChange={handleFilterChange} />
        </section>

        {/* ── Global error banner ── */}
        {globalError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <Receipt className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        {/* ── Metric cards ── */}
        <section
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Métricas de ventas"
        >
          {metrics.map((m) => (
            <MetricCard
              key={m.id}
              title={m.title}
              value={m.value}
              subtitle={m.subtitle}
              icon={m.icon}
              accentColor={m.accentColor}
              loading={summaryLoading}
            />
          ))}
        </section>

        {/* ── Sales chart ── */}
        <section aria-label="Gráfica de ventas">
          <SalesChart data={chartData} loading={chartLoading} />
        </section>

        {/* ── Transactions table ── */}
        <section aria-label="Tabla de transacciones">
          {txError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {txError}
            </div>
          ) : (
            <TransactionsTable
              items={transactions}
              total={totalTransactions}
              loading={txLoading}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              offset={offset}
              limit={PAGE_SIZE}
              onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              onNext={() => setOffset((o) => o + PAGE_SIZE)}
            />
          )}
        </section>
      </main>
    </div>
  );
}
