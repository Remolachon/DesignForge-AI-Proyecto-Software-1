"use client";

import { Mail, Phone, MapPin, Github, Linkedin, Instagram } from "lucide-react";

const inactiveLinkClassName =
  "cursor-default text-muted-foreground transition-colors hover:text-accent";

function InactiveFooterLink({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${inactiveLinkClassName} ${className ?? ""}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* LOGO / BRAND */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">
            DesignForge AI
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Plataforma inteligente para la creación de productos personalizados 
            con diseño asistido por inteligencia artificial.
          </p>

          {/* Socials */}
          <div className="flex gap-4 pt-2">
            <InactiveFooterLink aria-label="Instagram">
              <Instagram size={18} />
            </InactiveFooterLink>
            <InactiveFooterLink aria-label="GitHub">
              <Github size={18} />
            </InactiveFooterLink>
            <InactiveFooterLink aria-label="LinkedIn">
              <Linkedin size={18} />
            </InactiveFooterLink>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <div>
          <h3 className="text-sm font-semibold mb-4 text-foreground">
            Navegación
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <InactiveFooterLink>
                Inicio
              </InactiveFooterLink>
            </li>
            <li>
              <InactiveFooterLink>
                Catálogo
              </InactiveFooterLink>
            </li>
            <li>
              <InactiveFooterLink>
                Personalizar producto
              </InactiveFooterLink>
            </li>
            <li>
              <InactiveFooterLink>
                Mis pedidos
              </InactiveFooterLink>
            </li>
          </ul>
        </div>

        {/* EMPRESA */}
        <div>
          <h3 className="text-sm font-semibold mb-4 text-foreground">
            Empresa
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <InactiveFooterLink>
                Sobre nosotros
              </InactiveFooterLink>
            </li>
            <li>
              <InactiveFooterLink>
                Tecnología IA
              </InactiveFooterLink>
            </li>
            <li>
              <InactiveFooterLink>
                Contacto
              </InactiveFooterLink>
            </li>
            <li>
              <InactiveFooterLink>
                Términos y condiciones
              </InactiveFooterLink>
            </li>
          </ul>
        </div>

        {/* CONTACTO */}
        <div>
          <h3 className="text-sm font-semibold mb-4 text-foreground">
            Contacto
          </h3>
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail size={16} />
              contacto@designforge.ai
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} />
              +57 300 000 0000
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={16} />
              Colombia
            </li>
          </ul>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <p>
              © {new Date().getFullYear()} DesignForge AI. Todos los derechos reservados.
            </p>

            <div className="flex gap-6">
              <InactiveFooterLink className="text-xs">
                Privacidad
              </InactiveFooterLink>
              <InactiveFooterLink className="text-xs">
                Cookies
              </InactiveFooterLink>
            </div>
          </div>

          <div className="hidden rounded-full border border-border/70 bg-muted/30 px-4 py-2 text-right text-foreground shadow-sm sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Centro de alertas
              </p>
              <p className="text-sm font-medium text-foreground">
                Seguimiento y reseñas
              </p>
          </div>
        </div>
      </div>
    </footer>
  );
}