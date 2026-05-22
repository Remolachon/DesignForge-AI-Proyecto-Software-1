import Header from "@/components/Header";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Contacto() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Header */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
              Ponte en <span className="bg-gradient-to-r from-accent to-accent-magenta bg-clip-text text-transparent">Contacto</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ¿Tienes dudas, comentarios o una idea especial? Estamos aquí para ayudarte a hacerla realidad.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-12 mt-12">
            
            {/* Contact Info */}
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground">Información de contacto</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Correo Electrónico</h3>
                    <p className="text-muted-foreground mt-1">contacto@designforge.ai</p>
                    <p className="text-sm text-muted-foreground">Respondemos en menos de 24 horas.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg text-accent">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Teléfono / WhatsApp</h3>
                    <p className="text-muted-foreground mt-1">+57 300 000 0000</p>
                    <p className="text-sm text-muted-foreground">Lunes a Viernes, 9am - 6pm (COT)</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Ubicación</h3>
                    <p className="text-muted-foreground mt-1">Bogotá, Colombia</p>
                    <p className="text-sm text-muted-foreground">Operamos de manera digital en toda la región.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Envíanos un mensaje</h2>
              <form className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">Nombre completo</label>
                  <input 
                    type="text" 
                    id="name"
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tu nombre"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">Correo electrónico</label>
                  <input 
                    type="email" 
                    id="email"
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium text-foreground">Asunto</label>
                  <input 
                    type="text" 
                    id="subject"
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="¿En qué te podemos ayudar?"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-foreground">Mensaje</label>
                  <textarea 
                    id="message"
                    rows={4}
                    className="w-full flex rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Escribe tu mensaje aquí..."
                  />
                </div>

                <Button type="button" className="w-full mt-2 group">
                  <span className="flex items-center gap-2">
                    Enviar mensaje
                    <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </form>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
