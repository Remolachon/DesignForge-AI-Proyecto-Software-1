import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import Footer from "@/components/Footer";
import { ReviewModalHost } from "@/components/marketplace/modals/ReviewModalHost";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LukArt",
  description: "Marketplace de productos personalizados",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}
      >
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            {/* Contenido principal */}
            <main className="flex-grow">{children}</main>

            <ReviewModalHost />

            {/* Footer en todas las páginas */}
            <Footer />
          </div>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
