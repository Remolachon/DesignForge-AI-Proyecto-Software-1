"use client";

import React from "react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accentColor = "bg-indigo-500",
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
        {/* Skeleton shimmer */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3.5 w-24 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-8 w-32 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-3 w-20 rounded-full bg-gray-100 animate-pulse" />
          </div>
          <div className="h-12 w-12 rounded-xl bg-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      {/* Decorative accent bar */}
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${accentColor} opacity-80 transition-opacity group-hover:opacity-100`}
      />

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1 space-y-1 pl-2">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70">{subtitle}</p>
          )}
        </div>

        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${accentColor} bg-opacity-10 text-current transition-transform duration-300 group-hover:scale-110`}
          style={{ color: "inherit" }}
        >
          <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        </div>
      </div>
    </div>
  );
}
