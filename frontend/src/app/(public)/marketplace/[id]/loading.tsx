import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="bg-background text-foreground flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-6 lg:pt-10 pb-16 lg:pb-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="mb-6 lg:mb-8 flex w-fit items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-4 py-2">
            <Skeleton className="h-4 w-20 rounded-full bg-muted" />
            <Skeleton className="h-4 w-4 rounded-full bg-muted" />
            <Skeleton className="h-4 w-24 rounded-full bg-muted" />
            <Skeleton className="h-4 w-4 rounded-full bg-muted" />
            <Skeleton className="h-4 w-40 rounded-full bg-muted" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-7 w-full">
              <div className="grid gap-4 lg:grid-cols-[112px_minmax(0,1fr)] lg:items-start">
                <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible lg:pb-0">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-20 shrink-0 rounded-2xl lg:h-24 lg:w-full bg-muted" />
                  ))}
                </div>

                <div className="order-1 lg:order-2">
                  <Skeleton className="aspect-[4/5] w-full rounded-3xl bg-muted/50" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-5 pt-0 lg:pt-4">
              <div className="space-y-5">
                <Skeleton className="h-14 w-[min(28rem,100%)] bg-muted" />
                <Skeleton className="h-10 w-44 bg-muted" />
                <Skeleton className="h-10 w-48 rounded-full bg-muted/70" />
              </div>

              <div className="space-y-3">
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-4 w-[92%] bg-muted" />
                <Skeleton className="h-4 w-[80%] bg-muted" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 rounded-xl bg-muted" />
                ))}
              </div>

              <Skeleton className="h-36 rounded-2xl bg-muted/70" />
              <Skeleton className="h-28 rounded-2xl bg-muted/50" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
