'use client';

import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';

type Role = 'cliente' | 'funcionario';

export function DashboardLoading({ role }: { role: Role }) {
  const isCliente = role === 'cliente';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto p-8 space-y-8 animate-pulse">
        <section className="flex justify-between gap-6">
          <div className="space-y-3">
            <Skeleton className="h-9 w-64 bg-primary/10" />
            <Skeleton className="h-5 w-96 max-w-[70vw] bg-primary/10" />
          </div>
          <Skeleton className="h-10 w-40 rounded-lg bg-accent/30" />
        </section>

        <section className={`grid gap-6 ${isCliente ? 'md:grid-cols-3 max-w-5xl mx-auto' : 'md:grid-cols-3 lg:grid-cols-4'}`}>
          <Skeleton className="h-28 rounded-xl bg-primary/10" />
          <Skeleton className="h-28 rounded-xl bg-primary/10" />
          <Skeleton className="h-28 rounded-xl bg-primary/10" />
          {!isCliente && <Skeleton className="h-28 rounded-xl bg-primary/10" />}
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
