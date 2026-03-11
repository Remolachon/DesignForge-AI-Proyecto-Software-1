import { Link } from 'react-router';
import { Sparkles, Package, Eye, Palette, ShoppingBag, Clock } from 'lucide-react';
import { Button } from '../components/Button';

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
              <span className="text-xl font-semibold text-primary">LukArt</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="tertiary">Iniciar Sesión</Button>
              </Link>
              <Link to="/register">
                <Button>Registrarse</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Crear mi primer pedido
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Explorar Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features 
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-12 text-primary">
            Cómo funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Diseña con IA"
              description="Sube tu imagen y obtén variantes generadas automáticamente con inteligencia artificial"
            />
            <FeatureCard
              icon={<Eye className="w-8 h-8" />}
              title="Visualiza en 3D"
              description="Rota, ajusta iluminación y ve tu producto antes de producirlo con nuestro visor 3D"
            />
            <FeatureCard
              icon={<Palette className="w-8 h-8" />}
              title="Personaliza"
              description="Ajusta colores, materiales, tamaños y detalles en tiempo real"
            />
          </div>
        </div>
      </section>

      */}

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
              imageUrl="https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.53.05%20PM%20(1).jpeg"
            />
            <ProductCard
              title="Neon Flex"
              description="Letreros luminosos modernos y llamativos para tu negocio"
              imageUrl="https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.51.13%20PM.jpeg"
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
          <Link to="/register">
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

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-accent/20 to-accent-magenta/20 text-accent mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
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
