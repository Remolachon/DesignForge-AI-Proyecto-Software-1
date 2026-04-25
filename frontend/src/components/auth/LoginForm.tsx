"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { login } from "@/services/auth.service";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  const queryRedirectPath = useMemo(() => {
    const nextPath = searchParams.get("next");

    if (!nextPath || !nextPath.startsWith("/")) {
      return null;
    }

    return nextPath;
  }, [searchParams]);

  const fromRegister = searchParams.get("fromRegister") === "1";

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const extractBackendError = (error: any) => {
    const detail = error?.response?.data?.detail;

    if (!detail) return "Ocurrió un error inesperado";

    if (typeof detail === "string") return detail;

    return "Ocurrió un error inesperado";
  };

  const getDashboardByRole = (role: string | undefined) => {
    const normalizedRole = (role || "").toLowerCase().trim();

    if (normalizedRole === "funcionario") {
      return "/funcionario/dashboard";
    }

    return "/cliente/dashboard";
  };

  const navigateAfterLogin = (targetPath: string, dashboardPath: string) => {
    // Dejamos dashboard como entrada anterior para que el botón atrás vuelva allí.
    if (targetPath !== dashboardPath) {
      router.replace(dashboardPath);
      setTimeout(() => {
        router.push(targetPath);
      }, 0);
      return;
    }

    // Duplicamos dashboard para evitar regresar a auth en el primer "atrás".
    router.replace(dashboardPath);
    setTimeout(() => {
      router.push(dashboardPath);
    }, 0);
  };

  useEffect(() => {
    if (!fromRegister) {
      return;
    }

    const cleanLoginPath = "/login";

    // Limpiamos query de control y forzamos que atrás desde login vuelva a home.
    window.history.replaceState(null, "", cleanLoginPath);
    window.history.pushState({ fromRegister: true }, "", cleanLoginPath);

    const handlePopState = () => {
      window.location.replace("/");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [fromRegister]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // ✅ VALIDACIONES EN ORDEN (SOLO 1 ERROR)
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

      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user_name", `${res.first_name} ${res.last_name}`);
      localStorage.setItem("role", res.role);

      toast.success("¡Bienvenido de vuelta!");
      const roleDashboard = getDashboardByRole(res.role);
      const sessionRedirect = sessionStorage.getItem("redirect_after_login");
      const localRedirect = localStorage.getItem("redirect_after_login");
      const redirectPath = queryRedirectPath || sessionRedirect || localRedirect;

      sessionStorage.removeItem("redirect_after_login");
      localStorage.removeItem("redirect_after_login");

      if (redirectPath) {
        navigateAfterLogin(redirectPath, roleDashboard);
      } else {
        navigateAfterLogin(roleDashboard, roleDashboard);
      }
    } catch (error: any) {
      const message = extractBackendError(error);
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-magenta rounded-lg flex items-center justify-center">
            <Package className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-semibold text-primary">LukArt</span>
        </Link>

        <h2 className="text-center text-3xl font-semibold text-primary">
          Iniciar Sesión
        </h2>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg border border-border min-h-[380px] flex flex-col justify-center"
        >
          {errorMsg && (
            <div className="bg-red-100 text-red-600 text-sm p-3 rounded-md text-center">
              {errorMsg}
            </div>
          )}

          <div className="[&_input]:border-black [&_input]:focus:border-accent">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Introduce tu correo"
              disabled={loading}
            />
          </div>

          <div className="[&_input]:border-black [&_input]:focus:border-accent">
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Introduce tu contraseña"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              replace
              className="font-medium text-primary hover:text-accent transition-colors"
            >
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}