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
    <Link href={href}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
              {icon}
            </div>
            <div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}