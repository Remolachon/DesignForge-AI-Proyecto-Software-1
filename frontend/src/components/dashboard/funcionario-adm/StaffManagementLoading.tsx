'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function StaffManagementLoading() {
  return (
    <section className="space-y-6 rounded-3xl border border-border/60 bg-card/90 p-5 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-8 w-60 bg-primary/10" />
          <Skeleton className="h-4 w-96 max-w-[80vw] bg-primary/10" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl bg-accent/20" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-11 w-11 rounded-xl bg-muted/80" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 bg-muted/80" />
                <Skeleton className="h-8 w-16 bg-muted/80" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-5 gap-4 items-center">
              <Skeleton className="h-4 w-32 bg-muted/80" />
              <Skeleton className="h-4 w-44 bg-muted/80" />
              <Skeleton className="h-4 w-28 bg-muted/80" />
              <Skeleton className="h-6 w-20 rounded-full bg-muted/80" />
              <Skeleton className="h-9 w-32 justify-self-end bg-muted/80" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
