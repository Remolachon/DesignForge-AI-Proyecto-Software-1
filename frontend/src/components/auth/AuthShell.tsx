import Link from "next/link";
import { Package } from "lucide-react";

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-accent-magenta/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
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

        <div className="w-full max-w-md rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.55)] backdrop-blur-md sm:p-8">
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
      </div>
    </div>
  );
}
