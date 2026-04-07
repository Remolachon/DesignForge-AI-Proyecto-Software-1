"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Github, Linkedin, Instagram } from "lucide-react";

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
            <a href="#" className="hover:text-accent transition">
              <Instagram size={18} />
            </a>
            <a href="https://github.com/Remolachon/DesignForge-AI-Proyecto-Software-1" className="hover:text-accent transition">
              <Github size={18} />
            </a>
            <a href="#" className="hover:text-accent transition">
              <Linkedin size={18} />
            </a>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <div>
          <h3 className="text-sm font-semibold mb-4 text-foreground">
            Navegación
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-accent transition">
                Inicio
              </Link>
            </li>
            <li>
              <Link href="/catalogo" className="hover:text-accent transition">
                Catálogo
              </Link>
            </li>
            <li>
              <Link href="/personalizar" className="hover:text-accent transition">
                Personalizar producto
              </Link>
            </li>
            <li>
              <Link href="/mis-pedidos" className="hover:text-accent transition">
                Mis pedidos
              </Link>
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
              <Link href="/about" className="hover:text-accent transition">
                Sobre nosotros
              </Link>
            </li>
            <li>
              <Link href="/tecnologia" className="hover:text-accent transition">
                Tecnología IA
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="hover:text-accent transition">
                Contacto
              </Link>
            </li>
            <li>
              <Link href="/terminos" className="hover:text-accent transition">
                Términos y condiciones
              </Link>
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
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} DesignForge AI. Todos los derechos reservados.
          </p>

          <div className="flex gap-6">
            <Link href="/privacidad" className="hover:text-accent transition">
              Privacidad
            </Link>
            <Link href="/cookies" className="hover:text-accent transition">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}