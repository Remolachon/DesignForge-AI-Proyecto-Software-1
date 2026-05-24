"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/buttonMayus";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { syncRoleFromBackend } from "@/services/auth.service";

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [storedName, setStoredName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Obtener datos desde localStorage y sincronizar rol
  useEffect(() => {
    const name = localStorage.getItem("user_name");
    const userRole = localStorage.getItem("role");

    // Deferimos el setState para evitar cascadas
    setTimeout(() => {
      setStoredName(name);
      setRole(userRole);
    }, 0);

    // Sincronizar el rol en segundo plano por si cambió en el backend
    // (ej. el usuario creó una empresa y pasó a ser funcionario_adm)
    syncRoleFromBackend().then((newRole) => {
      if (newRole && newRole !== userRole) {
        setRole(newRole);
      }
    });
  }, []);

  // Nombre del usuario
  const fullName =
    storedName ||
    (user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.email);

  // Ruta del dashboard según rol
  const dashboardRoute =
    role === "administrador"
      ? "/administrador/dashboard"
      : role === "funcionario_adm"
        ? "/funcionario-adm/dashboard"
        : role === "funcionario"
          ? "/funcionario/dashboard"
          : role === "cliente"
            ? "/cliente/dashboard"
            : "/";

  const loginHref = pathname?.startsWith("/cliente/crear-pedido")
    ? `/login?next=${encodeURIComponent("/cliente/crear-pedido?resume=1")}`
    : "/login";

  // Ruta del prefijo de navegación según rol (puede diferir del nombre del rol)
  const roleRoutePrefixMap: Record<string, string> = {
    administrador: "/administrador",
    funcionario_adm: "/funcionario-adm",
    funcionario: "/funcionario",
  };
  const roleRoutePrefix = roleRoutePrefixMap[role ?? ""] ?? `/${role}`;

  // Determinar si estamos en el modo del rol o en el modo cliente
  const isRoleMode = pathname?.startsWith(roleRoutePrefix);

  const handleModeToggle = (targetIsRole: boolean) => {
    if (!pathname || !role) return;

    if (targetIsRole) {
      router.push(`${roleRoutePrefix}/dashboard`);
    } else {
      // Switched to Cliente mode
      if (pathname.startsWith(roleRoutePrefix)) {
        const strippedPath = pathname.replace(roleRoutePrefix, "");

        if (strippedPath.startsWith("/marketplace")) {
          router.push(strippedPath);
        } else if (strippedPath === "" || strippedPath === "/") {
          router.push("/cliente/dashboard");
        } else {
          router.push(`/cliente${strippedPath}`);
        }
      } else {
        router.push("/cliente/dashboard");
      }
    }
  };

  return (
    <header className="relative z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* LOGO */}
          <Link href={dashboardRoute} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-magenta rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-primary">LukArt</span>
          </Link>

          {!fullName ? (
            <div className="flex items-center gap-4">
              <Link href={loginHref}>
                <Button variant="tertiary" className="rounded-full px-5 py-2 transition-all duration-200 hover:bg-accent/15 hover:text-accent hover:shadow-md hover:-translate-y-0.5">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button>Registrarse</Button>
              </Link>
            </div>
          ) : (
            <div className="relative z-50 flex items-center gap-3">

              {/* SWITCH DE MODO ELEGANTE */}
              {(role === "administrador" || role === "funcionario" || role === "funcionario_adm") && (
                <div className="inline-flex items-center mr-2 sm:mr-4 bg-secondary/30 backdrop-blur-md border border-border/40 rounded-full p-1 shadow-sm">
                  <button
                    onClick={() => handleModeToggle(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${!isRoleMode
                      ? "bg-green-100 text-green-700 shadow-sm ring-1 ring-green-300"
                      : "text-muted-foreground hover:text-green-700 hover:bg-green-50"
                      }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline-block">Cliente</span>
                  </button>
                  <button
                    onClick={() => handleModeToggle(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${isRoleMode
                      ? "bg-gradient-to-r from-accent to-accent-magenta text-white shadow-md ring-1 ring-accent/50"
                      : "text-muted-foreground hover:text-primary hover:bg-secondary/50"
                      }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline-block whitespace-nowrap">
                      {role === "administrador"
                        ? "Administrador"
                        : role === "funcionario_adm"
                          ? "Func. Adm"
                          : "Funcionario"}
                    </span>
                  </button>
                </div>
              )}

              <NotificationBell />

              <div className="relative flex justify-center">
                {/* ICONO USUARIO */}
                <button
                  onClick={() => setOpen(!open)}
                  className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-semibold"
                >
                  {fullName?.charAt(0).toUpperCase()}
                </button>

                {/* DROPDOWN */}
                {open && (
                  <div className="absolute top-14 left-1/2 z-50 w-56 -translate-x-1/2 rounded-lg border border-border bg-background p-4 text-center shadow-xl">

                    <p className="text-sm font-medium text-primary mb-3">
                      {fullName}
                    </p>

                    <button
                      onClick={async () => {
                        await logout();

                        localStorage.clear();
                        setOpen(false);

                        window.location.replace("/");
                      }}
                      className="text-red-500 hover:underline"
                    >
                      Cerrar sesión
                    </button>

                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}