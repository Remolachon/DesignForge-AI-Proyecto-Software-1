import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/buttonMayus";
import Header from "@/components/Header";
import { getPublicImageUrl } from "@/lib/supabase/getPublicImageUrl";
import { HOME_CATALOG_PRODUCTS } from "@/constants/productCatalog";
import { InfiniteGrid } from "@/components/ui/infinite-grid";
import { Magnetic } from "@/components/core/magnetic";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <InfiniteGrid className="py-24 sm:py-32 px-4 min-h-[85vh]">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-primary mb-6 tracking-tight drop-shadow-sm">
            Diseña y crea productos
            <span className="block mt-2 bg-gradient-to-r from-accent to-accent-magenta bg-clip-text text-transparent">
              únicos y personalizados
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto font-medium">
            Bordados, letreros neon y productos acrílicos diseñados con IA.
            <br className="hidden sm:block" /> Tu imaginación, nuestra artesanía.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pointer-events-auto">
            <Link href="/cliente/crear-pedido" className="sm:w-auto w-full">
              <Button size="lg" className="w-full sm:w-auto text-md px-8 py-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1">
                Crear mi primer pedido
              </Button>
            </Link>
            <Link href="/marketplace" className="sm:w-auto w-full">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto text-md px-8 py-6 bg-background/80 backdrop-blur-md border border-border shadow-md hover:shadow-lg hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:-translate-y-1">
                Explorar Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </InfiniteGrid>

      {/* Product Types */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-12 text-primary">
            Nuestros productos
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {HOME_CATALOG_PRODUCTS.map((product) => (
              <ProductCard key={product.title} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-semibold mb-6">
            ¿Quieres vender tus productos con nosotros?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Registra tu empresa y empieza a publicar tu catálogo en nuestra plataforma.
          </p>
          <Link href="/crear-empresa" className="inline-block relative z-50 mt-8">
            <Magnetic intensityX={0.35} intensityY={0.08} actionArea='global' range={250} springOptions={{ stiffness: 80, damping: 10, mass: 0.5 }}>
              <Button size="lg" className="group relative overflow-hidden bg-accent text-accent-foreground hover:brightness-110 shadow-lg hover:shadow-2xl transition-all duration-500">
                {/* Shine effect div */}
                <div className="pointer-events-none absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 group-hover:[animation:shine-sweep_2.5s_ease-in-out_infinite] z-0" />

                <Magnetic intensity={0.06} actionArea='global' range={250} springOptions={{ stiffness: 80, damping: 10, mass: 0.5 }}>
                  <span className="relative z-10">Comenzar ahora</span>
                </Magnetic>
              </Button>
            </Magnetic>
          </Link>
        </div>
      </section>
    </div>
  );
}

// 🔹 Componente desacoplado y limpio
function ProductCard({
  title,
  description,
  storagePath,
  accent,
}: {
  title: string;
  description: string;
  storagePath: string;
  accent?: boolean;
}) {
  const imageUrl = getPublicImageUrl(storagePath);

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white border border-border hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          loading="lazy"
          unoptimized
          className="object-cover group-hover:scale-105 transition-transform duration-300"
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