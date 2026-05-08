import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminIncomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full border-border/70 bg-card/90 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.45)]">
          <CardHeader>
            <CardTitle className="text-3xl text-primary">Ingresos</CardTitle>
            <CardDescription>
              Esta sección queda preparada como base para el módulo financiero del administrador.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">
            Aquí puedes conectar reportes, totales por periodo, márgenes y proyecciones sin cambiar la navegación principal del panel.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
