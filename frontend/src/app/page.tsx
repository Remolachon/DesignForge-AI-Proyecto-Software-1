import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/buttonMayus";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-magenta rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-primary">
                LukArt
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="tertiary">Iniciar Sesión</Button>
              </Link>

              <Link href="/register">
                <Button>Registrarse</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Diseña productos únicos
        </h1>

        <div className="flex justify-center gap-4">
          <Link href="/register">
            <Button size="lg">Crear pedido</Button>
          </Link>

          <Link href="/marketplace">
            <Button variant="secondary" size="lg">
              Ver marketplace
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
