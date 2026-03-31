"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { register } from "@/services/auth.service";

export default function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // ✅ VALIDACIONES EN ORDEN (SOLO 1 ERROR)
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setErrorMsg("Hay campos vacíos");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg("Formato de correo incorrecto");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener mínimo 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      await register(firstName, lastName, phone, email, password, confirmPassword);

      toast.success("Cuenta creada correctamente");
      router.push("/login");
    } catch (error: any) {
      const detail = error?.response?.data?.detail;

      if (typeof detail === "string") {
        if (detail.toLowerCase().includes("ya está registrado")) {
          setErrorMsg("El correo ya existe");
          return;
        }

        setErrorMsg(detail);
        return;
      }

      setErrorMsg("Ocurrió un error inesperado");
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-100 text-red-600 text-sm p-3 rounded-md text-center">
                {errorMsg}
              </div>
            )}

            <div className="[&_input]:border-black">
              <Input
                label="Nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Juan"
                disabled={loading}
              />
            </div>

            <div className="[&_input]:border-black">
              <Input
                label="Apellido"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Pérez"
                disabled={loading}
              />
            </div>

            <div className="[&_input]:border-black">
              <Input
                label="Teléfono (opcional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="3001234567"
                disabled={loading}
              />
            </div>

            <div className="[&_input]:border-black">
              <Input
                label="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>

            <div className="[&_input]:border-black">
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div className="[&_input]:border-black">
              <Input
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
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