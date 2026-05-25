import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";

import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import Footer from "@/components/Footer";
import { RouteProgressBar } from "@/components/navigation/RouteProgressBar";
import { ReviewModalHost } from "@/components/marketplace/modals/ReviewModalHost";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
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
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Suspense fallback={null}>
              <RouteProgressBar />
            </Suspense>
            <div className="flex flex-col min-h-screen">
              {/* Contenido principal */}
              <main className="flex-grow">{children}</main>

              <ReviewModalHost />

              {/* Footer en todas las páginas */}
              <Footer />
            </div>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
