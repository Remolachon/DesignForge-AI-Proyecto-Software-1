"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/services/salesService";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAxisCOP(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-popover px-4 py-3 shadow-lg text-sm text-popover-foreground">
      <p className="mb-2 font-semibold text-foreground">{label}</p>
      {payload.map((entry: any) => {
        if (entry.dataKey === "ganancias" && entry.payload?.hideProfitsInTooltip) return null;
        return (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground capitalize">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {entry.dataKey === "transacciones"
                ? entry.value
                : formatCOP(entry.value as number)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SKELETON_HEIGHTS = [45, 60, 35, 75, 50, 80, 40, 65];

function ChartSkeleton() {
  return (
    <div className="flex h-64 w-full animate-pulse items-end gap-3 px-4 pb-4 pt-6">
      {SKELETON_HEIGHTS.map((height, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-md bg-gray-200"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SalesChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
  hideProfits?: boolean;
}

export function SalesChart({ data, loading = false, hideProfits = false }: SalesChartProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">Tendencia de ventas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hideProfits ? "Ventas en el período seleccionado" : "Ventas y ganancias en el período seleccionado"}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
            Ventas
          </span>
          {!hideProfits && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Ganancias
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <ChartSkeleton />
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Sin datos para este período</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Prueba seleccionando un período diferente
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={hideProfits ? data.map(d => ({ ...d, hideProfitsInTooltip: true })) : data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatAxisCOP}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="ventas"
              name="Ventas"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            {!hideProfits && (
              <Line
                type="monotone"
                dataKey="ganancias"
                name="Ganancias"
                stroke="#10b981"
                strokeWidth={2.5}
                strokeDasharray="5 4"
                dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
