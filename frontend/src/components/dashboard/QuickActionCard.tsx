import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface QuickActionCardProps {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

export function QuickActionCard({
  href,
  icon,
  iconBg,
  title,
  description,
}: QuickActionCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full border-border/60 bg-card/90 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} shadow-sm`}>
              {icon}
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold tracking-tight text-foreground">{title}</h3>
              <p className="text-sm leading-5 text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}