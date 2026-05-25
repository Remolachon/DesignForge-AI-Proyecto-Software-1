'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function PedidosPendientesLoading() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3 w-36 rounded-full bg-primary/10" />
          <Skeleton className="h-9 w-80 bg-primary/10" />
          <Skeleton className="h-5 w-[min(42rem,80vw)] bg-primary/10" />
        </div>
        <Skeleton className="h-24 w-40 rounded-2xl bg-accent/20" />
      </section>

      <Skeleton className="h-20 rounded-2xl bg-card" />
      <Skeleton className="h-16 rounded-2xl bg-card" />

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Skeleton className="h-28 w-full rounded-2xl bg-muted/80 sm:w-28" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-2/3 bg-muted/80" />
                <Skeleton className="h-4 w-1/2 bg-muted/80" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Skeleton className="h-4 w-full bg-muted/80" />
                  <Skeleton className="h-4 w-full bg-muted/80" />
                  <Skeleton className="h-4 w-full bg-muted/80" />
                  <Skeleton className="h-4 w-full bg-muted/80" />
                </div>
                <div className="flex justify-between gap-3 border-t border-border pt-4">
                  <Skeleton className="h-7 w-24 bg-muted/80" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-28 rounded-xl bg-muted/80" />
                    <Skeleton className="h-9 w-28 rounded-xl bg-muted/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
