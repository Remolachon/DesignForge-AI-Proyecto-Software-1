'use client';

import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';

export function MarketplaceLoading({ isAdmin = false }: { isAdmin?: boolean }) {
  const productCards = Array.from({ length: 6 });

  return (
    <div className={isAdmin ? "min-h-screen bg-background" : ""}>
      {isAdmin && <Header />}
      <div className={isAdmin ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse" : "px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-8 animate-pulse"}>
        
        {/* Header Section */}
        <div className={isAdmin ? "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" : "space-y-2"}>
          <div className="space-y-3">
            <Skeleton className="h-9 w-64 bg-primary/10" />
            <Skeleton className="h-5 w-[min(32rem,70vw)] bg-primary/10" />
          </div>
        </div>

        {/* Stats Section (Admin only) */}
        {isAdmin && (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 w-full sm:max-w-xs bg-muted" />
          <Skeleton className="h-10 w-full sm:w-48 bg-muted" />
        </div>

        {/* Grid of Products */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productCards.map((_, index) => (
            <div key={index} className="rounded-xl border bg-card text-card-foreground shadow space-y-4 p-4 overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full rounded-lg bg-muted" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4 bg-primary/10" />
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-4 w-5/6 bg-muted" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-6 w-24 bg-muted" />
                <Skeleton className="h-9 w-28 rounded-lg bg-primary/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
