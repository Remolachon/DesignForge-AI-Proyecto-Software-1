"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { login } from "@/services/auth.service";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);

      localStorage.setItem("token", res.access_token);

      toast.success("¡Bienvenido de vuelta!");

      if (email.includes("funcionario") || email.includes("admin")) {
        router.push("/funcionario/dashboard");
      } else {
        router.push("/cliente/dashboard");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail ||
        error?.message ||
        "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-magenta rounded-lg flex items-center justify-center">
            <Package className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-semibold text-primary">LukArt</span>
        </Link>

        <h2 className="text-center text-3xl font-semibold text-primary">
          Iniciar Sesión
        </h2>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 bg-white p-6 rounded-xl shadow-lg border border-border"
        >
          <Input
            label="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            Iniciar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}