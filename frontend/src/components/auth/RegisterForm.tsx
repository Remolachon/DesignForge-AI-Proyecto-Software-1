"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { register } from "@/services/auth.service";
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
    } catch (error: any) {
      const detail = error?.response?.data?.detail;

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-magenta rounded-lg flex items-center justify-center">
            <Package className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-semibold text-primary">LukArt</span>
        </Link>

        <h2 className="text-center text-3xl font-semibold text-primary">
          Crear Cuenta
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-border min-h-[520px]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="bg-red-100 text-red-600 text-sm p-3 rounded-md text-center">
                {errors.general}
              </div>
            )}

            <div>
              <div className="[&_input]:border-black">
                <Input
                  label="Nombre"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) clearFieldError("firstName");
                  }}
                  placeholder="Juan"
                  disabled={loading}
                />
              </div>
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div>
              <div className="[&_input]:border-black">
                <Input
                  label="Apellido"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) clearFieldError("lastName");
                  }}
                  placeholder="Pérez"
                  disabled={loading}
                />
              </div>
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>

            <div>
              <div className="[&_input]:border-black">
                <Input
                  label="Teléfono (opcional)"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) clearFieldError("phone");
                  }}
                  placeholder="3001234567"
                  disabled={loading}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div>
              <div className="[&_input]:border-black">
                <Input
                  label="Correo electrónico"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) clearFieldError("email");
                  }}
                  placeholder="tu@email.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="[&_input]:border-black">
                <Input
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) clearFieldError("password");
                  }}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <div className="[&_input]:border-black">
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) clearFieldError("confirmPassword");
                  }}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}