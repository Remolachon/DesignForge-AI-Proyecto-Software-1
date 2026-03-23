"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { register } from "@/services/auth.service";

export default function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !password) {
      toast.error("Completa todos los campos");
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
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center">
          Crear cuenta
        </h2>

        <Input
          label="Nombre"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <Input
          label="Apellido"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

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

        <Button className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin w-4 h-4" />}
          Registrarse
        </Button>
      </form>
    </div>
  );
}