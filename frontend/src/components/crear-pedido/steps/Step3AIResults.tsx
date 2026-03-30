"use client";

import { Sparkles, CheckCircle } from "lucide-react";

type Props = {
  selectedVariant: number | null;
  setSelectedVariant: (variant: number) => void;
  uploadedImage: string | null;
};

export default function Step3AIResults({
  selectedVariant,
  setSelectedVariant,
  uploadedImage,
}: Props) {
  const variants = [1, 2, 3];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">
        Selecciona una variante
      </h2>

      <p className="text-muted-foreground mb-6">
        La IA ha generado estas variantes de tu diseño
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {variants.map((variant) => (
          <div
            key={variant}
            onClick={() => setSelectedVariant(variant)}
            className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
              selectedVariant === variant
                ? "border-accent shadow-lg scale-105"
                : "border-border hover:border-accent/50"
            }`}
          >
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
              {uploadedImage ? (
                <img
                  src={uploadedImage}
                  alt={`Variante ${variant}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Sparkles className="w-12 h-12 text-muted-foreground" />
              )}

              {selectedVariant === variant && (
                <div className="absolute top-2 right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <div className="p-4">
              <p className="font-semibold">Variante {variant}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}