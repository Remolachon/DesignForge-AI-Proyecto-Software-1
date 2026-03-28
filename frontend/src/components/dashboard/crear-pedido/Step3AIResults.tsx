"use client";

import { Sparkles, CheckCircle } from "lucide-react";

interface Props {
  selectedVariant: number | null;
  setSelectedVariant: (v: number) => void;
  uploadedImage: string | null;
}

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

      <div className="grid md:grid-cols-3 gap-4">
        {variants.map((variant) => (
          <div
            key={variant}
            onClick={() => setSelectedVariant(variant)}
            className={`cursor-pointer border-2 rounded-lg overflow-hidden ${
              selectedVariant === variant
                ? "border-accent scale-105"
                : ""
            }`}
          >
            <div className="aspect-square flex items-center justify-center bg-gray-100 relative">
              {uploadedImage ? (
                <img
                  src={uploadedImage}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Sparkles />
              )}

              {selectedVariant === variant && (
                <CheckCircle className="absolute top-2 right-2 text-green-500" />
              )}
            </div>

            <div className="p-3 font-semibold">
              Variante {variant}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}