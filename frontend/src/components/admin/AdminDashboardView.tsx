"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, CircleDollarSign, Package2, ShieldCheck, Users } from "lucide-react";

import { AdminService, AdminDashboardResponse } from "@/services/admin.service";
import { AdminOrder } from "@/types/order";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
};

const quickActions = [
  {
    href: "/administrador/empresas",
    title: "Gestionar empresas",
    description: "Aprueba, rechaza o elimina solicitudes.",
    icon: Building2,
  },
  {
    href: "/administrador/pedidos",
    title: "Ver pedidos",
    description: "Consulta todos los pedidos con la empresa asociada.",
    icon: Package2,
  },
  {
    href: "/funcionario/marketplace",
    title: "Marketplace",
    description: "Revisa el catálogo compartido desde el flujo operativo.",
    icon: ShieldCheck,
  },
  {
    href: "/administrador/ingresos",
    title: "Ingresos",
    description: "Página base para análisis financiero del panel.",
    icon: CircleDollarSign,
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function StatCard({ icon, label, value, description }: StatCardProps) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardContent className="flex items-start gap-4 pt-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-primary">{value}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentOrderCard({ order }: { order: AdminOrder }) {
  return (
    <Card className="border-border/70 bg-background/80 transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-primary">{order.title}</h3>
            <Badge variant="outline" className="capitalize">
              {order.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {order.clientName} · {order.companyName || "Sin empresa asociada"}
          </p>
          <p className="text-sm text-muted-foreground">Entrega estimada: {formatDate(order.deliveryDate)}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-semibold text-primary">{formatCurrency(order.price)}</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/administrador/pedidos">Ver pedidos</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboardView() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await AdminService.getDashboard();
        if (isMounted) {
          setData(response);
        }
      } catch {
        if (isMounted) {
          setError("No fue posible cargar el tablero de administrador.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = data?.stats;
  const recentOrders = data?.orders ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                <Users className="h-4 w-4" />
                Panel de administrador
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">Controla empresas, pedidos e ingresos</h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Este tablero concentra la operación administrativa: revisa solicitudes de empresas, consulta pedidos y accede a las secciones que completan el flujo del negocio.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-xl">
                <Link href="/administrador/empresas">Gestionar empresas</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/administrador/pedidos">Ver pedidos</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<CircleDollarSign className="h-5 w-5" />}
            label="Ventas estimadas"
            value={stats ? formatCurrency(stats.total_sales) : loading ? "Cargando..." : "-"}
            description="Valor consolidado del tablero"
          />
          <StatCard
            icon={<Building2 className="h-5 w-5" />}
            label="Empresas activas"
            value={stats ? String(stats.active_companies) : loading ? "Cargando..." : "-"}
            description="Cuentas aprobadas y activas"
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Usuarios activos"
            value={stats ? String(stats.total_users) : loading ? "Cargando..." : "-"}
            description="Usuarios disponibles en el sistema"
          />
          <StatCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Ingresos"
            value={stats ? formatCurrency(stats.income) : loading ? "Cargando..." : "-"}
            description="Base para el módulo financiero"
          />
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Card key={action.href} className="border-border/70 bg-background/90 transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-primary">{action.title}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-6">{action.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild variant="ghost" className="px-0 text-accent hover:bg-transparent hover:text-accent/80">
                    <Link href={action.href}>
                      Abrir sección
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Pedidos recientes</CardTitle>
              <CardDescription>Los últimos movimientos visibles para la administración.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : loading ? (
                <div className="space-y-3">
                  <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
                  <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
                  <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
                </div>
              ) : recentOrders.length > 0 ? (
                recentOrders.slice(0, 3).map((order) => <RecentOrderCard key={order.id} order={order} />)
              ) : (
                <div className="rounded-2xl border border-dashed border-border/80 px-6 py-10 text-center text-sm text-muted-foreground">
                  Todavía no hay pedidos recientes para mostrar.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Resumen operativo</CardTitle>
              <CardDescription>Indicadores rápidos para la revisión diaria.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="font-medium text-primary">Empresas pendientes</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{stats ? stats.pending_companies : "-"}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="font-medium text-primary">Empresas inactivas</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{stats ? stats.inactive_companies : "-"}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="font-medium text-primary">Ingresos de referencia</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{stats ? formatCurrency(stats.income) : "-"}</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
