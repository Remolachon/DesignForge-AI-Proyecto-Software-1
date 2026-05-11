"use client";

import { useEffect } from "react";
import { Sparkles, CheckCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductType } from "@/types/types";

type Props = {
  productType: ProductType | null;
  generatedImages: string[];
  selectedGeneratedImage: string | null;
  setSelectedGeneratedImage: (image: string | null) => void;
  generateAIImages: (style: string, reset?: boolean) => void;
  resetGeneratedImages: () => void;
  loading: boolean;
};

const styleForProductType = (productType: ProductType | null) => {
  switch (productType) {
    case "bordado":
      return "bordado";
    case "neon-flex":
      return "neon_flex";
    case "acrilico":
      return "acrilico";
    default:
      return "bordado";
  }
};

export default function Step3AIResults({
  productType,
  generatedImages,
  selectedGeneratedImage,
  setSelectedGeneratedImage,
  generateAIImages,
  resetGeneratedImages,
  loading,
}: Props) {
  const style = styleForProductType(productType);

  useEffect(() => {
    if (!productType) return;
    if (generatedImages.length > 0) return;
    if (loading) return;

    generateAIImages(style);
  }, [productType, generatedImages.length, generateAIImages, loading, style]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Resultados IA</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Elige la versión generada por IA que mejor represente tu diseño. Si no te gusta, puedes generar nuevas variantes hasta 3 opciones.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => generateAIImages(style)}
            disabled={loading || generatedImages.length >= 3}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {generatedImages.length === 0
              ? "Generar IA"
              : generatedImages.length < 3
              ? "Generar otra variante"
              : "Máximo 3 variantes"}
          </Button>

          {generatedImages.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => resetGeneratedImages()}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Volver a generar
            </Button>
          )}
        </div>
      </div>

      {generatedImages.length === 0 && !loading ? (
        <div className="rounded-lg border border-border bg-muted/50 p-8 text-center text-muted-foreground">
          <Sparkles className="mx-auto mb-3 h-12 w-12 opacity-70" />
          <p>Genera tu primera variante IA para continuar.</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {generatedImages.map((imageUrl, index) => (
          <Card
            key={imageUrl}
            className={`cursor-pointer overflow-hidden transition-all p-0 ${
              selectedGeneratedImage === imageUrl
                ? "ring-2 ring-accent shadow-lg"
                : "border border-border hover:shadow-md"
            }`}
            onClick={() => setSelectedGeneratedImage(imageUrl)}
          >
            <div className="aspect-square bg-gray-100">
              <img
                src={imageUrl}
                alt={`Variante IA ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-4 text-center">
              <p className="font-semibold">Variante {index + 1}</p>
              {selectedGeneratedImage === imageUrl && (
                <div className="mt-2 inline-flex items-center gap-1 text-accent">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Seleccionada</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {generatedImages.length >= 1 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Puedes seleccionar hasta 3 variantes para comparar. Una vez elegida una, haz clic en Siguiente para confirmar.
        </p>
      )}
    </div>
  );
}