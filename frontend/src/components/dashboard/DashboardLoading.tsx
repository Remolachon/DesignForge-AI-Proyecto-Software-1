'use client';

import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';

type Role = 'cliente' | 'funcionario' | 'administrador';

export function DashboardLoading({ role }: { role: Role }) {
  const statCards = Array.from({ length: 4 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20" data-role={role}>
      <Header />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-9 w-64 bg-primary/10" />
            <Skeleton className="h-5 w-[min(32rem,70vw)] bg-primary/10" />
          </div>
          <Skeleton className="h-10 w-40 rounded-lg bg-accent/30" />
        </section>

        <section className="grid w-full gap-6 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((_, index) => (
            <div key={index} className="rounded-xl bg-muted p-6 shadow-none">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-3">
                  <Skeleton className="h-3 w-28 bg-muted/80" />
                  <Skeleton className="h-9 w-20 bg-muted/80" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl bg-muted/80" />
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <Skeleton className="h-7 w-48 bg-primary/10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-28 rounded-xl bg-muted" />
            <Skeleton className="h-28 rounded-xl bg-muted" />
            <Skeleton className="h-28 rounded-xl bg-muted" />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48 bg-primary/10" />
            <Skeleton className="h-8 w-24 bg-primary/10" />
          </div>
          <Skeleton className="h-24 rounded-xl bg-muted" />
          <Skeleton className="h-24 rounded-xl bg-muted" />
          <Skeleton className="h-24 rounded-xl bg-muted" />
        </section>
      </main>
    </div>
  );
}
