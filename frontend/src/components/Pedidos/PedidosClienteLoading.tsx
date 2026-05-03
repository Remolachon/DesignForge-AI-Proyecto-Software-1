import { Skeleton } from '@/components/ui/skeleton';

export function PedidosClienteLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse">
        {/* Header */}
        <div className="space-y-3">
          <Skeleton className="h-9 w-48 bg-primary/10" />
          <Skeleton className="h-5 w-96 bg-primary/10" />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Skeleton className="h-10 w-full sm:w-96 rounded-lg bg-muted" />
          <Skeleton className="h-10 w-full sm:w-40 rounded-lg bg-muted" />
        </div>

        {/* Pedidos List */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-muted p-6 shadow-sm"
            >
              <div className="space-y-4">
                {/* Row 1: Title and Status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4 bg-muted/80" />
                    <Skeleton className="h-4 w-1/2 bg-muted/60" />
                  </div>
                  <Skeleton className="h-6 w-28 rounded-full bg-muted/80" />
                </div>

                {/* Row 2: Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-3 w-20 bg-muted/60" />
                      <Skeleton className="h-4 w-24 bg-muted/80" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <Skeleton className="h-5 w-48 bg-muted/60" />
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-9 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
