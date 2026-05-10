"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/buttonMayus";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [storedName, setStoredName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Obtener datos desde localStorage
  useEffect(() => {
    const name = localStorage.getItem("user_name");
    const userRole = localStorage.getItem("role");

    setStoredName(name);
    setRole(userRole);
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
      :
    role === "funcionario"
      ? "/funcionario/dashboard"
      : role === "cliente"
      ? "/cliente/dashboard"
      : "/";

  const loginHref = pathname?.startsWith("/cliente/crear-pedido")
    ? `/login?next=${encodeURIComponent("/cliente/crear-pedido?resume=1")}`
    : "/login";

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
                <Button variant="tertiary">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button>Registrarse</Button>
              </Link>
            </div>
          ) : (
            <div className="relative z-50 flex items-center gap-3">
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