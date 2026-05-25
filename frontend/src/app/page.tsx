import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/buttonMayus";
import Header from "@/components/Header";
import { getPublicImageUrl } from "@/lib/supabase/getPublicImageUrl";
import { HOME_CATALOG_PRODUCTS } from "@/constants/productCatalog";
import { InfiniteGrid } from "@/components/ui/infinite-grid";
import { Magnetic } from "@/components/core/magnetic";
import { BackgroundLines } from "@/components/ui/animated-svg-background";
import { TextEffect } from '@/components/core/text-effect';
import { FadeIn } from '@/components/core/fade-in';
import { CardStack } from '@/components/ui/card-stack';
import LightRays from '@/components/ui/light-rays';
export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-chillax">
      <Header />

      {/* Hero Section */}
      <InfiniteGrid className="py-24 sm:py-32 px-4 min-h-[85vh]">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-primary mb-6 tracking-tight drop-shadow-sm flex flex-col items-center justify-center space-y-2">
            <TextEffect
              per='char'
              delay={0}
              variants={{
                container: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } },
                item: { hidden: { opacity: 0, rotateX: 90, y: 10 }, visible: { opacity: 1, rotateX: 0, y: 0, transition: { duration: 0.2 } } },
              }}
            >
              Diseña y crea productos
            </TextEffect>
            <TextEffect
              per='char'
              delay={0.3}
              className="bg-gradient-to-r from-accent to-accent-magenta bg-clip-text text-transparent"
              as="span"
            >
              únicos y personalizados
            </TextEffect>
          </h1>
          <div className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto font-medium flex flex-col items-center">
            <TextEffect per='char' delay={0.8} preset='blur'>
              Bordados, letreros neon y productos acrílicos diseñados IA.
            </TextEffect>
            <TextEffect per='char' delay={1} preset='blur'>
              Tu imaginación, nuestra artesanía.
            </TextEffect>
          </div>
          <FadeIn delay={2.5} className="flex flex-col sm:flex-row gap-4 justify-center items-center pointer-events-auto">
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
          </FadeIn>
        </div>
      </InfiniteGrid>

      {/* Product Types */}
      <section className="py-24 px-4 overflow-hidden relative flex flex-col justify-center min-h-[80vh]">
        {/* Light Rays Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <LightRays
            raysOrigin="bottom-center"
            lightColor="#a78bfa"
            darkColor="#ffffff" // Blanco LED para modo oscuro
            raysSpeed={1.2}
            lightSpread={1.5}
            rayLength={1.5}
            fadeDistance={0.6}
            followMouse={true}
            mouseInfluence={0.1}
            noiseAmount={0.02}
            distortion={0.05}
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 w-full">
          <h2 className="text-3xl font-semibold text-center mb-16 text-primary drop-shadow-sm">
            Nuestros productos
          </h2>

          <div className="flex justify-center w-full">
            <CardStack
              items={HOME_CATALOG_PRODUCTS.map((product) => ({
                id: product.title,
                title: product.title,
                description: product.description,
                imageSrc: getPublicImageUrl(product.storagePath),
                tag: product.accent ? 'Popular' : undefined,
              }))}
              autoAdvance
              intervalMs={3000}
              cardWidth={340}
              cardHeight={400}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full">
        <BackgroundLines className="py-20 px-4 flex items-center justify-center flex-col bg-primary dark:bg-background text-white h-[30rem] md:h-[35rem] overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-20 pointer-events-auto">
            <h2 className="text-4xl font-semibold mb-6 drop-shadow-sm">
              ¿Quieres vender tus productos con nosotros?
            </h2>
            <p className="text-xl mb-8 opacity-90 font-medium">
              Registra tu empresa y empieza a publicar tu catálogo en nuestra plataforma.
            </p>
            <Link href="/crear-empresa" className="inline-block relative z-50 mt-8 pointer-events-auto">
              <Magnetic intensityX={0.35} intensityY={0.08} actionArea='global' range={250} springOptions={{ stiffness: 80, damping: 10, mass: 0.5 }}>
                <Button size="lg" className="group relative overflow-hidden bg-accent text-accent-foreground hover:brightness-110 shadow-lg hover:shadow-2xl transition-all duration-500 pointer-events-auto">
                  {/* Shine effect div */}
                  <div className="pointer-events-none absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 group-hover:[animation:shine-sweep_2.5s_ease-in-out_infinite] z-0" />

                  <Magnetic intensity={0.06} actionArea='global' range={250} springOptions={{ stiffness: 80, damping: 10, mass: 0.5 }}>
                    <span className="relative z-10">Comenzar ahora</span>
                  </Magnetic>
                </Button>
              </Magnetic>
            </Link>
          </div>
        </BackgroundLines>
      </section>
    </div>
  );
}

