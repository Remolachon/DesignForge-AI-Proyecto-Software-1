import Header from "@/components/Header";
import { Shield, FileText, AlertCircle } from "lucide-react";

export default function TerminosYCondiciones() {
  const lastUpdated = "22 de Mayo, 2026";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          
          <div className="mb-12 text-center md:text-left border-b border-border pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Términos y Condiciones
            </h1>
            <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
              <FileText size={16} />
              Última actualización: {lastUpdated}
            </p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section className="bg-card border border-border p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-accent" size={24} />
                <h2 className="text-xl font-semibold m-0 text-foreground">1. Aceptación de los Términos</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Al acceder y utilizar DesignForge AI, aceptas estar sujeto a estos términos y condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio. Nuestra plataforma actúa como intermediario entre diseñadores/creadores y fabricantes.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Uso de la Inteligencia Artificial</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nuestra plataforma utiliza modelos de inteligencia artificial para asistir en la creación de diseños. Los usuarios son responsables de los prompts (instrucciones) proporcionados a la IA. DesignForge AI no se hace responsable por diseños generados que infrinjan derechos de autor de terceros o contengan material ofensivo.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. Propiedad Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Los diseños finales creados a través de nuestra plataforma y pagados por el usuario, pertenecen al usuario. Sin embargo, DesignForge AI retiene el derecho de utilizar imágenes de los productos finales para fines promocionales, a menos que se acuerde explícitamente lo contrario (NDA).
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Fabricación y Calidad</h2>
              <div className="bg-muted p-4 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground">
                  Al tratarse de productos físicos personalizados (letreros neón, acrílicos, bordados):
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Pueden existir ligeras variaciones entre el render digital y el producto final.</li>
                  <li>Los tiempos de fabricación son estimados y pueden variar según la complejidad.</li>
                  <li>No se aceptan devoluciones por "cambio de opinión" en productos personalizados.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. Política de Reembolsos y Garantías</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ofrecemos garantía contra defectos de fabricación por 30 días a partir de la recepción del producto. Si tu producto llega dañado o no coincide sustancialmente con el diseño aprobado, evaluaremos el caso para ofrecer una reparación, reemplazo o reembolso parcial/total.
              </p>
            </section>

            <section className="bg-primary/5 border border-primary/20 p-6 rounded-xl mt-12">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="text-primary" size={24} />
                <h2 className="text-xl font-semibold m-0 text-foreground">6. Privacidad y Datos</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Nos tomamos en serio tu privacidad. La información recopilada se utiliza exclusivamente para procesar pedidos y mejorar nuestros servicios. Para más detalles, consulta nuestra Política de Privacidad.
              </p>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
