"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { validatePhone, validateRequired } from "@/lib/utils/validation";
import { createCompany } from "@/services/company.service";
import { getDashboardByRole } from "@/services/auth.service";

type FormErrors = {
  nit: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  general: string;
};

const defaultErrors: FormErrors = {
  nit: "",
  name: "",
  description: "",
  address: "",
  phone: "",
  general: "",
};

const nitPattern = /^[A-Za-z0-9.-]+$/;

export function CompanyCreateForm() {
  const [nit, setNit] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<FormErrors>(defaultErrors);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [role, setRole] = useState("cliente");

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace(`/login?next=${encodeURIComponent("/crear-empresa")}`);
      return;
    }

    setRole(localStorage.getItem("role") || "cliente");
    setAuthReady(true);
  }, [router]);

  const clearFieldError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = { ...defaultErrors };

    const nitError = validateRequired(nit, "El NIT");
    if (nitError) {
      nextErrors.nit = nitError;
    } else if (!nitPattern.test(nit.trim())) {
      nextErrors.nit = "El NIT solo puede contener letras, números, puntos o guiones.";
    }

    const nameError = validateRequired(name, "El nombre de la empresa");
    if (nameError) nextErrors.name = nameError;

    const descriptionError = validateRequired(description, "La descripción");
    if (descriptionError) nextErrors.description = descriptionError;

    const addressError = validateRequired(address, "La dirección");
    if (addressError) nextErrors.address = addressError;

    const phoneRequiredError = validateRequired(phone, "El teléfono");
    const phoneFormatError = phoneRequiredError ? "" : validatePhone(phone);
    if (phoneRequiredError) nextErrors.phone = phoneRequiredError;
    else if (phoneFormatError) nextErrors.phone = phoneFormatError;

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors((prev) => ({ ...prev, general: "" }));

    if (!validateForm()) return;

    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setLoading(true);

    try {
      await createCompany({
        nit: nit.trim(),
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        phone: phone.trim(),
      });

      toast.success("Empresa creada correctamente");
      setConfirmOpen(false);
      router.replace(getDashboardByRole(role));
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;

      if (typeof detail === "string") {
        const lower = detail.toLowerCase();

        if (lower.includes("nit")) {
          setErrors((prev) => ({ ...prev, nit: detail }));
        } else if (lower.includes("correo")) {
          setErrors((prev) => ({ ...prev, general: "Ya existe una empresa asociada al correo de tu cuenta." }));
        } else {
          setErrors((prev) => ({ ...prev, general: detail }));
        }
      } else {
        setErrors((prev) => ({ ...prev, general: "No se pudo crear la empresa." }));
      }

      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        <Header />
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 text-sm text-muted-foreground">
          Preparando tu solicitud...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Header />

      <main className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-6rem] top-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute right-[-8rem] top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[-8rem] left-1/3 h-72 w-72 rounded-full bg-accent-magenta/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <section className="rounded-[2rem] border border-border/60 bg-card/90 p-8 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.55)] backdrop-blur-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              <Sparkles className="h-4 w-4" />
              Vincula tu empresa
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
              Queremos trabajar contigo
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Registra tu empresa para que nuestro equipo la revise y, si se aprueba, puedas operar con nosotros y vender tus productos en la plataforma.
            </p>

            <div className="mt-8 space-y-4 rounded-3xl border border-border/60 bg-muted/30 p-6">
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-foreground">Tu solicitud quedará en revisión</p>
                  <p className="text-sm text-muted-foreground">Enviamos tu información para revisarla con cuidado y darte una respuesta lo antes posible.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-foreground">Usaremos el correo de tu cuenta</p>
                  <p className="text-sm text-muted-foreground">Así mantenemos tu registro asociado directamente a tu usuario actual.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-foreground">Si se aprueba, trabajas con nosotros</p>
                  <p className="text-sm text-muted-foreground">Cuando tu empresa sea aceptada, podrás gestionar tu espacio dentro de la plataforma como parte del equipo.</p>
                </div>
              </div>
            </div>

          </section>

          <section className="rounded-[2rem] border border-border/60 bg-card/95 p-6 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.55)] backdrop-blur-md sm:p-8">
            {errors.general && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Input
                    label="NIT"
                    value={nit}
                    onChange={(e) => {
                      setNit(e.target.value);
                      if (errors.nit) clearFieldError("nit");
                    }}
                    placeholder="900123456-7"
                    disabled={loading}
                    className="h-11 rounded-xl border-border/70 bg-background/80"
                  />
                  {errors.nit && <p className="mt-1 text-sm text-red-500">{errors.nit}</p>}
                </div>

                <div>
                  <Input
                    label="Nombre de la empresa"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) clearFieldError("name");
                    }}
                    placeholder="Diseños Premium S.A.S."
                    disabled={loading}
                    className="h-11 rounded-xl border-border/70 bg-background/80"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
                <Textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) clearFieldError("description");
                  }}
                  placeholder="Describe brevemente tu empresa, lo que hace y su propuesta de valor."
                  disabled={loading}
                  className="min-h-28 rounded-xl border-border/70 bg-background/80"
                />
                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
              </div>

              <div>
                <Input
                  label="Dirección"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) clearFieldError("address");
                  }}
                  placeholder="Calle 123 #45-67, Bogotá"
                  disabled={loading}
                  className="h-11 rounded-xl border-border/70 bg-background/80"
                />
                {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Input
                    label="Teléfono"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) clearFieldError("phone");
                    }}
                    placeholder="3001234567"
                    disabled={loading}
                    className="h-11 rounded-xl border-border/70 bg-background/80"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline" className="h-11 w-full rounded-xl sm:w-auto" disabled={loading}>
                  <Link href={getDashboardByRole(role)}>Cancelar</Link>
                </Button>
                <Button type="submit" className="h-11 w-full rounded-xl shadow-sm sm:w-auto" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar solicitud"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deseas enviar tu solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              Al continuar, enviaremos tu solicitud para revisión. Si todo está correcto, tu empresa quedará registrada y te avisaremos cuando sea aceptada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? "Enviando..." : "Sí, enviar solicitud"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}