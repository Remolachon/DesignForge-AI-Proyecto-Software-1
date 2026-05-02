import { Chrome, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleAuthButtonProps {
  label: string;
  helperText: string;
  loading?: boolean;
  onClick: () => void;
}

export function GoogleAuthButton({ label, helperText, loading = false, onClick }: GoogleAuthButtonProps) {
  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl border-border/70 bg-white/80 text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-border hover:bg-white"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4 text-[#4285F4]" />}
        <span className="font-medium">{label}</span>
      </Button>
      <p className="text-center text-xs text-muted-foreground">{helperText}</p>
    </div>
  );
}
