"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ShieldX } from "lucide-react";
import { toast } from "sonner";

import { completeGoogleAuth, getDashboardByRole } from "@/services/auth.service";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  const mode = useMemo(() => searchParams.get("mode") || "login", [searchParams]);

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error") || searchParams.get("error_description");
    const fallbackRoute = mode === "register" ? "/register" : "/login";

    if (error || !code) {
      router.replace(fallbackRoute);
      return;
    }

    let active = true;

    const finishOAuth = async () => {
      try {
        setStatus("loading");
        const authResult = await completeGoogleAuth(code);

        if (!active) return;

        const redirectPath = localStorage.getItem("redirect_after_login");
        if (redirectPath) {
          localStorage.removeItem("redirect_after_login");
          setStatus("done");
          router.replace(redirectPath);
          return;
        }

        setStatus("done");
        router.replace(getDashboardByRole(authResult.role));
      } catch (err: unknown) {
        if (!active) return;

        console.error("finishOAuth error:", err);
        setStatus("error");
        toast.error("No se pudo completar el inicio con Google. Puedes reintentar.");
        // No redirect here so the user can see the error and retry from the form
      }
    };

    void finishOAuth();

    return () => {
      active = false;
    };
  }, [mode, router, searchParams]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-accent-magenta/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg rounded-[2rem] border border-border/60 bg-card/90 p-8 text-center shadow-[0_24px_80px_-44px_rgba(15,23,42,0.55)] backdrop-blur-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-accent-magenta shadow-sm">
            {status === "error" ? (
              <ShieldX className="h-8 w-8 text-white" />
            ) : status === "done" ? (
              <CheckCircle2 className="h-8 w-8 text-white" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            )}
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Autenticación con Google
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              {status === "error"
                ? "Volviendo al formulario"
                : status === "done"
                  ? "Sesión completada"
                  : "Completando el inicio de sesión"}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              {status === "error"
                ? "No se guardó ningún cambio. Puedes intentarlo de nuevo cuando quieras."
                : "Espere un momento mientras completamos el inicio de sesión."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
