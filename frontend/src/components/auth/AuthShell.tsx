import Link from "next/link";
import { Package } from "lucide-react";
import BorderGlow from "@/components/ui/BorderGlow";
import { AuroraBackground } from "@/components/ui/aurora-background";

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <AuroraBackground className="min-h-screen bg-background dark:bg-background">
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 lg:py-12 w-full">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-magenta shadow-sm">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">DesignForge</p>
              <p className="text-lg font-semibold text-primary">LukArt</p>
            </div>
          </Link>
        </div>

        <BorderGlow
          className="w-full max-w-md shadow-[0_24px_80px_-44px_rgba(15,23,42,0.55)] backdrop-blur-md"
          borderRadius={32}
          backgroundColor="var(--background)"
          glowColor="171 100 45"
          colors={['#00E5C2', '#FF2D95', '#0B213F']}
          animated={true}
        >
          <div className="p-6 sm:p-8">
            <div className="mb-8 space-y-2 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
                {title}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>
            {children}
          </div>
        </BorderGlow>
      </div>
    </AuroraBackground>
  );
}
