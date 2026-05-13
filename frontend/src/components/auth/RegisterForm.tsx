"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { register, startGoogleAuth } from "@/services/auth.service";
import {
  validateEmail,
  validateMatch,
  validatePassword,
  validatePhone,
  validateRequired,
} from "@/lib/utils/validation";

type FormErrors = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  general: string;
};

export default function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    general: "",
  });

  const router = useRouter();

  useEffect(() => {
    const googleError = localStorage.getItem("google_auth_error");

    if (googleError) {
      localStorage.removeItem("google_auth_error");
      setErrors((prev) => ({
        ...prev,
        general: googleError,
      }));
      toast.error(googleError);
    }
  }, []);

  const clearFieldError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      general: "",
    };

    const firstNameError = validateRequired(firstName, "El nombre");
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateRequired(lastName, "El apellido");
    if (lastNameError) newErrors.lastName = lastNameError;

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    const confirmError = validateMatch(password, confirmPassword);
    if (confirmError) newErrors.confirmPassword = confirmError;

    const phoneError = validatePhone(phone);
    if (phoneError) newErrors.phone = phoneError;

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error !== "");
    if (hasErrors) return;

    setLoading(true);

    try {
      await register(firstName, lastName, phone, email, password, confirmPassword);
      toast.success("Cuenta creada correctamente");
      router.push("/login");
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;

      if (typeof detail === "string") {
        if (detail.toLowerCase().includes("ya está registrado")) {
          setErrors((prev) => ({
            ...prev,
            email: "El correo ya existe",
          }));
          return;
        }

        setErrors((prev) => ({
          ...prev,
          general: detail,
        }));
        return;
      }

      setErrors((prev) => ({
        ...prev,
        general: "Ocurrió un error inesperado",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setErrors((prev) => ({ ...prev, general: "" }));
    setGoogleLoading(true);

    try {
      await startGoogleAuth("register");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo iniciar con Google";
      setErrors((prev) => ({ ...prev, general: message }));
      toast.error(message);
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      title="Registrarse"
      description="Crea tu cuenta en segundos y comienza a hacer pedidos."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {errors.general}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Input
              label="Nombre"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) clearFieldError("firstName");
              }}
              placeholder="Juan"
              disabled={loading || googleLoading}
              className="h-11 rounded-xl border-border/70 bg-background/80"
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
          </div>

          <div>
            <Input
              label="Apellido"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) clearFieldError("lastName");
              }}
              placeholder="Pérez"
              disabled={loading || googleLoading}
              className="h-11 rounded-xl border-border/70 bg-background/80"
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <Input
            label="Teléfono (opcional)"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) clearFieldError("phone");
            }}
            placeholder="3001234567"
            disabled={loading || googleLoading}
            className="h-11 rounded-xl border-border/70 bg-background/80"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <Input
            label="Correo electrónico"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) clearFieldError("email");
            }}
            placeholder="tu@email.com"
            disabled={loading || googleLoading}
            className="h-11 rounded-xl border-border/70 bg-background/80"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) clearFieldError("password");
              }}
              placeholder="••••••••"
              disabled={loading || googleLoading}
              className="h-11 rounded-xl border-border/70 bg-background/80"
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
          </div>

          <div>
            <Input
              label="Confirmar contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) clearFieldError("confirmPassword");
              }}
              placeholder="••••••••"
              disabled={loading || googleLoading}
              className="h-11 rounded-xl border-border/70 bg-background/80"
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>
        </div>

        <Button type="submit" className="h-11 w-full rounded-xl shadow-sm" disabled={loading || googleLoading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-border/60" />
          <span className="px-3 text-xs uppercase tracking-[0.22em] text-muted-foreground bg-card/90">o continúa con</span>
          <div className="flex-1 border-t border-border/60" />
        </div>

        <GoogleAuthButton
          label="Registrarme con Google"
          helperText="Continuar con Google"
          loading={googleLoading}
          onClick={handleGoogleRegister}
        />

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-primary transition-colors hover:text-accent">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}