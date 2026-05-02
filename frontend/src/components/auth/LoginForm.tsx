"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { getDashboardByRole, login, startGoogleAuth } from "@/services/auth.service";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const extractBackendError = (error: unknown) => {
    const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;

    if (!detail) return "Ocurrió un error inesperado";
    if (typeof detail === "string") return detail;

    return "Ocurrió un error inesperado";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Hay campos vacíos");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg("Formato de correo incorrecto");
      return;
    }

    setLoading(true);

    try {
      const res = await login(email, password);
      toast.success("¡Bienvenido de vuelta!");

      const redirectPath = localStorage.getItem("redirect_after_login");

      if (redirectPath) {
        localStorage.removeItem("redirect_after_login");
        router.push(redirectPath);
        return;
      }

      router.push(getDashboardByRole(res.role));
    } catch (error: unknown) {
      const message = extractBackendError(error);
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setGoogleLoading(true);

    try {
      await startGoogleAuth("login");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo iniciar con Google";
      setErrorMsg(message);
      toast.error(message);
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      title="Inicia sesión"
      description="Accede a tu cuenta para gestionar tus pedidos y compras."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div>
          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            disabled={loading || googleLoading}
            className="h-11 rounded-xl border-border/70 bg-background/80"
          />
        </div>

        <div>
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Introduce tu contraseña"
            disabled={loading || googleLoading}
            className="h-11 rounded-xl border-border/70 bg-background/80"
          />
        </div>

        <Button type="submit" className="h-11 w-full rounded-xl shadow-sm" disabled={loading || googleLoading}>
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-border/60" />
          <span className="px-3 text-xs uppercase tracking-[0.22em] text-muted-foreground bg-card/90">o continúa con</span>
          <div className="flex-1 border-t border-border/60" />
        </div>

        <GoogleAuthButton
          label="Iniciar sesión con Google"
          helperText="Continuar con Google"
          loading={googleLoading}
          onClick={handleGoogleLogin}
        />

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-primary transition-colors hover:text-accent">
            Regístrate
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}