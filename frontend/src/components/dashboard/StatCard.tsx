import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  colorClass: string;
}

export function StatCard({ label, value, icon, colorClass }: StatCardProps) {
  return (
    <Card className="h-full border-border/60 bg-card/90 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass} shadow-sm`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}