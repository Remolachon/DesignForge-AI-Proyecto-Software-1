 
import { ProductService } from "@/services/product.service";
import { ProductDetailView } from "./ProductDetailView";
import Header from "@/components/Header";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Opcional: generar metadatos para SEO
export async function generateMetadata({ params }: PageProps) {
  try {
    const resolvedParams = await params;
    const product = await ProductService.getProductById(resolvedParams.id);
    return {
      title: `${product.title} - DesignForge`,
      description: product.description,
    };
  } catch {
    return {
      title: "Producto no encontrado - DesignForge",
    };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  let product = null;

  try {
    const resolvedParams = await params;
    product = await ProductService.getProductById(resolvedParams.id);
  } catch {
    product = null;
  }

  if (!product) {
    return (
      <div className="flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
          <h1 className="text-3xl font-bold mb-4">Producto no encontrado</h1>
          <p className="text-muted-foreground mb-8">
            El producto que buscas no existe o ha sido removido.
          </p>
          <Link
            href="/marketplace"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Volver al Marketplace
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        <ProductDetailView initialProduct={product} />
      </main>
    </div>
  );
}
