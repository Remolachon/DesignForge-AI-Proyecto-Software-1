import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/buttonMayus";
import Header from "@/components/Header"; // ✅ NUEVO

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* ✅ HEADER NUEVO */}
      <Header />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-primary mb-6">
            Diseña y crea productos
            <span className="block mt-2 bg-gradient-to-r from-accent to-accent-magenta bg-clip-text text-transparent">
              únicos y personalizados
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Bordados, letreros neon y productos acrílicos diseñados con IA y visualiza.
            Tu imaginación, nuestra artesanía.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/cliente/crear-pedido" className="sm:w-auto w-full">
              <Button size="lg" className="w-full sm:w-auto">
                Crear mi primer pedido
              </Button>
            </Link>
            <Link href="/marketplace" className="sm:w-auto w-full">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Explorar Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Types */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-12 text-primary">
            Nuestros productos
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <ProductCard
              title="Bordados"
              description="Logos y diseños bordados de alta calidad para uniformes, gorras y más"
              imageUrl="https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/.../bordados.jpeg"
            />
            <ProductCard
              title="Neon Flex"
              description="Letreros luminosos modernos y llamativos para tu negocio"
              imageUrl="https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/.../neon.jpeg"
              accent
            />
            <ProductCard
              title="Acrílico"
              description="Placas y letreros acrílicos premium con acabado profesional"
              imageUrl="https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.52.24%20PM.jpeg"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-semibold mb-6">
            ¿Listo para crear algo increíble?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a cientos de clientes satisfechos que ya han creado productos únicos
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Comenzar ahora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2026 LukArt. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ title, description, imageUrl, accent }: { title: string; description: string; imageUrl: string; accent?: boolean }) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white border border-border hover:shadow-lg transition-all duration-300">
      <div className="aspect-[4/3] overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {accent && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm font-medium">
          Popular
        </div>
      )}
    </div>
  );
}