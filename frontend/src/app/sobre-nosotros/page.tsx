import Header from "@/components/Header";
import { Users, Lightbulb, Target } from "lucide-react";

export default function SobreNosotros() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* Hero Section */}
          <section className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
              Sobre <span className="bg-gradient-to-r from-accent to-accent-magenta bg-clip-text text-transparent">Nosotros</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Somos una plataforma innovadora que democratiza el diseño y la creación de productos personalizados a través de la Inteligencia Artificial.
            </p>
          </section>

          {/* Misión y Visión */}
          <section className="grid md:grid-cols-2 gap-8">
            <div className="bg-card border border-border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                <Target size={24} />
              </div>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Nuestra Misión</h2>
              <p className="text-muted-foreground leading-relaxed">
                Empoderar a creadores y emprendedores conectando la creatividad con fabricantes locales expertos, transformando ideas digitales en productos físicos de alta calidad en tiempo récord.
              </p>
            </div>

            <div className="bg-card border border-border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 text-accent">
                <Lightbulb size={24} />
              </div>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Nuestra Visión</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ser el ecosistema líder a nivel global en la fabricación de productos personalizados on-demand, donde cualquier persona pueda dar vida a sus ideas sin barreras técnicas ni de diseño.
              </p>
            </div>
          </section>

          {/* El Equipo */}
          <section className="bg-muted/30 rounded-3xl p-8 md:p-12 border border-border/50 text-center">
            <div className="inline-flex h-16 w-16 bg-background rounded-full items-center justify-center mb-6 shadow-sm border border-border">
              <Users size={32} className="text-primary" />
            </div>
            <h2 className="text-3xl font-semibold mb-6 text-foreground">Nuestro Equipo</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              DesignForge AI está conformado por un equipo multidisciplinario de ingenieros de Sistemas y Computación. Trabajamos día a día para crear la mejor experiencia en la concepción y producción de tus ideas.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
