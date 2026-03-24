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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast.error("Completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await register(firstName, lastName, email, password);

      toast.success("Cuenta creada correctamente");
      router.push("/login");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail ||
        "Error al registrarse"
      );
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
        <p className="mt-2 text-center text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nombre"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Juan"
              disabled={loading}
            />

            <Input
              label="Apellido"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Pérez"
              disabled={loading}
            />

            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              disabled={loading}
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />

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
