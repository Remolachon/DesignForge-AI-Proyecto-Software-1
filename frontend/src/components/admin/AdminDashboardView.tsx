"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  Rocket,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";

import Header from "@/components/Header";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { StatCard } from "@/components/dashboard/StatCard";
import { AdminService, AdminDashboardResponse } from "@/services/admin.service";
import { AdminOrder } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type QuickAction = {
  title: string;
  description: string;
  icon: typeof Building2;
  href?: string;
  disabled?: boolean;
};

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

const quickActions: QuickAction[] = [
  {
    title: "Gestión de empresas",
    description: "Aprueba, rechaza o revisa solicitudes de empresas.",
    icon: Building2,
    href: "/administrador/empresas",
  },
  {
    title: "Gestión de ventas y transacciones",
    description: "Módulo financiero en construcción para el seguimiento de ventas.",
    icon: TrendingUp,
    disabled: true,
  },
  {
    title: "Gestión de marketplace",
    description: "Abre el marketplace operativo que usan los funcionarios.",
    icon: ShoppingBag,
    href: "/administrador/marketplace",
  },
];

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
            <Link href="/administrador/pedidos">Ver detalles</Link>
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
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          setLoading(true);
          setError("");
          const response = await AdminService.getDashboard();
          if (isMounted) {
            setData(response);
          }
          return;
        } catch (err) {
          if (attempt === 0) {
            continue;
          }

          if (isMounted) {
            const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
            const message = typeof detail === "string" ? detail : "No fue posible cargar el tablero de administrador.";
            setError(message);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <DashboardLoading role="administrador" />;
  }

  const stats = data?.stats;
  const recentOrders = data?.orders ?? [];
  const recentThree = recentOrders.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">Panel de administrador</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Administra empresas, revisa ventas y transacciones, y supervisa el movimiento operativo de la plataforma.
            </p>
          </div>

          <Link href="/administrador/empresas">
            <Button>
              Gestionar empresas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>

        <section className="grid w-full gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Ventas ($)"
            value={stats ? formatCurrency(stats.total_sales) : "$128.450.000"}
            icon={<CircleDollarSign />}
            colorClass="bg-rose-100"
          />
          <StatCard
            label="Empresas Activas"
            value={stats ? String(stats.active_companies) : "0"}
            icon={<Building2 />}
            colorClass="bg-blue-100"
          />
          <StatCard
            label="Usuarios Totales"
            value={stats ? String(stats.total_users) : "0"}
            icon={<Users />}
            colorClass="bg-green-100"
          />
          <StatCard
            label="Comisiones ($)"
            value={stats ? formatCurrency(stats.income) : "$9.840.000"}
            icon={<Rocket />}
            colorClass="bg-amber-100"
          />
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Card key={action.title} className="border-border/70 bg-card/90 transition-all hover:-translate-y-1 hover:shadow-lg">
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
                    {action.disabled ? (
                      <Button variant="outline" className="w-full rounded-xl" disabled>
                        Próximamente
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" className="px-0 text-accent hover:bg-transparent hover:text-accent/80">
                        <Link href={action.href!}>
                          Abrir sección
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Pedidos recientes</CardTitle>
              <CardDescription>Los últimos tres pedidos visibles para la administración.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : recentThree.length > 0 ? (
                recentThree.map((order) => <RecentOrderCard key={order.id} order={order} />)
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
                <p className="font-medium text-primary">Ventas predeterminadas</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{stats ? formatCurrency(stats.total_sales) : "$128.450.000"}</p>
              </div>
              <div className="pt-2">
                <Button asChild className="w-full rounded-xl">
                  <Link href="/administrador/pedidos">Ver todos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
