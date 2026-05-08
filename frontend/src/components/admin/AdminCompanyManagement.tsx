"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Search, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import Header from "@/components/Header";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminService, CompanyCountsResponse } from "@/services/admin.service";
import { CompanyAdmin } from "@/types/company";

type CompanyFilter = "all" | "pending" | "active" | "inactive";

type CompanyAction = {
  company: CompanyAdmin;
  type: "approve" | "reject" | "delete" | "restore";
};

const filters: { value: CompanyFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "active", label: "Activas" },
  { value: "inactive", label: "Inactivas" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function isPendingCompany(company: CompanyAdmin) {
  return company.status === "PENDING";
}

function isActiveCompany(company: CompanyAdmin) {
  return company.status === "APPROVED" && company.is_active;
}

function isInactiveApprovedCompany(company: CompanyAdmin) {
  return company.status === "APPROVED" && !company.is_active;
}

function getCompanyState(company: CompanyAdmin) {
  if (isPendingCompany(company)) {
    return { label: "Pendiente", className: "border-yellow-200 bg-yellow-50 text-yellow-800" };
  }

  if (isActiveCompany(company)) {
    return { label: "Activa", className: "border-green-200 bg-green-50 text-green-700" };
  }

  if (isInactiveApprovedCompany(company)) {
    return { label: "Inactiva", className: "border-gray-200 bg-gray-50 text-gray-700" };
  }

  if (company.status === "REJECTED") {
    return { label: "Rechazada", className: "border-red-200 bg-red-50 text-red-700" };
  }

  return { label: "Inactiva", className: "border-gray-200 bg-gray-50 text-gray-700" };
}

export function AdminCompanyManagement() {
  const [companies, setCompanies] = useState<CompanyAdmin[]>([]);
  const [counts, setCounts] = useState<CompanyCountsResponse | null>(null);
  const [filter, setFilter] = useState<CompanyFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<CompanyAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [companyList, companyCounts] = await Promise.all([
        AdminService.getCompanies("all"),
        AdminService.getCompanyCounts(),
      ]);

      setCompanies(companyList);
      setCounts(companyCounts);
    } catch {
      setError("No fue posible cargar las empresas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCompanies = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return companies.filter((company) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "pending"
          ? isPendingCompany(company)
          : filter === "active"
          ? isActiveCompany(company)
          : isInactiveApprovedCompany(company) || company.status === "INACTIVE";

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        company.name,
        company.nit,
        company.email,
        company.created_by_user_name || "",
        company.description || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [companies, filter, search]);

  const countsToShow = {
    total: counts?.total ?? companies.length,
    pending: counts?.pending ?? companies.filter((company) => company.status === "PENDING").length,
    active: counts?.active ?? companies.filter((company) => isActiveCompany(company)).length,
    inactive: counts?.inactive ?? companies.filter((company) => isInactiveApprovedCompany(company) || company.status === "INACTIVE").length,
  };

  const handleAction = async () => {
    if (!action) {
      return;
    }

    try {
      setSaving(true);

      if (action.type === "approve") {
        await AdminService.updateCompanyStatus(action.company.id, "APPROVED");
        toast.success("Empresa aprobada");
      } else if (action.type === "restore") {
        await AdminService.updateCompanyStatus(action.company.id, "APPROVED");
        toast.success("Empresa restaurada");
      } else if (action.type === "reject") {
        await AdminService.updateCompanyStatus(action.company.id, "REJECTED");
        toast.success("Empresa rechazada");
      } else {
        await AdminService.deleteCompany(action.company.id);
        toast.success("Empresa eliminada");
      }

      await loadData();
    } catch {
      toast.error("No se pudo completar la acción");
    } finally {
      setSaving(false);
      setAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                <Building2 className="h-4 w-4" />
                Empresas
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">Gestiona solicitudes de empresa</h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Revisa el estado de cada empresa, aprueba las que cumplan los requisitos, rechaza las que no correspondan y elimina registros cuando sea necesario.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[34rem]">
              {[
                { label: "Total", value: countsToShow.total },
                { label: "Pendientes", value: countsToShow.pending },
                { label: "Activas", value: countsToShow.active },
                { label: "Inactivas", value: countsToShow.inactive },
              ].map((item) => (
                <Card key={item.label} className="border-border/70 bg-background/80">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-primary">{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <Button
                  key={item.value}
                  variant={filter === item.value ? "default" : "outline"}
                  className="rounded-full px-5"
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por NIT, empresa, correo o creador"
                className="h-11 rounded-xl border-border/70 bg-background/80 pl-10"
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : loading ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="h-48 animate-pulse rounded-3xl bg-muted/70" />
                <div className="h-48 animate-pulse rounded-3xl bg-muted/70" />
                <div className="h-48 animate-pulse rounded-3xl bg-muted/70" />
                <div className="h-48 animate-pulse rounded-3xl bg-muted/70" />
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredCompanies.map((company) => {
                  const state = getCompanyState(company);
                  const pending = isPendingCompany(company);
                  const active = isActiveCompany(company);
                  const inactiveApproved = isInactiveApprovedCompany(company) || company.status === "INACTIVE";
                  const rejected = company.status === "REJECTED";

                  return (
                    <Card key={company.id} className="border-border/70 bg-background/90 shadow-sm">
                      <CardHeader className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-xl text-primary">{company.name}</CardTitle>
                            <CardDescription className="mt-1">NIT {company.nit}</CardDescription>
                          </div>
                          <Badge variant="outline" className={state.className}>
                            {state.label}
                          </Badge>
                        </div>
                        <CardDescription className="leading-6">{company.description || "Sin descripción registrada."}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Creador</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{company.created_by_user_name || "Sin dato"}</p>
                          </div>
                          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Correo</p>
                            <p className="mt-1 break-all text-sm font-medium text-foreground">{company.email}</p>
                          </div>
                          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dirección</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{company.address || "Sin dirección"}</p>
                          </div>
                          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Teléfono</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{company.phone || "Sin teléfono"}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                          <span>Creada el {formatDate(company.start_date)}</span>
                          <span>{company.is_active ? "Activa" : "Inactiva"}</span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {pending && (
                            <Button
                              className="rounded-xl"
                              onClick={() => setAction({ company, type: "approve" })}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Aprobar
                            </Button>
                          )}
                          {pending && (
                            <Button
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => setAction({ company, type: "reject" })}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Rechazar
                            </Button>
                          )}
                          {active && (
                            <Button
                              variant="destructive"
                              className="rounded-xl"
                              onClick={() => setAction({ company, type: "delete" })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </Button>
                          )}
                          {inactiveApproved && (
                            <Button
                              className="rounded-xl"
                              onClick={() => setAction({ company, type: "restore" })}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Restaurar
                            </Button>
                          )}
                          {rejected && (
                            <Button
                              className="rounded-xl"
                              onClick={() => setAction({ company, type: "approve" })}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Aprobar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 px-6 py-10 text-center text-sm text-muted-foreground">
                No hay empresas para este filtro.
              </div>
            )}
          </div>
        </section>
      </main>

      <AlertDialog open={Boolean(action)} onOpenChange={(open) => !open && setAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action?.type === "approve"
                ? "Aprobar empresa"
                : action?.type === "reject"
                ? "Rechazar empresa"
                : action?.type === "restore"
                ? "Restaurar empresa"
                : "Eliminar empresa"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action?.company.name}
              {action?.type === "delete"
                ? " será desactivada y su usuario creador volverá al rol cliente."
                : action?.type === "restore"
                ? " volverá a estar activa y su usuario creador recuperará el rol funcionario."
                : action?.type === "approve"
                ? " pasará a estado activo y el usuario creador será promovido a funcionario."
                : " quedará marcada como rechazada y desactivada."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={saving}>
              {saving ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
