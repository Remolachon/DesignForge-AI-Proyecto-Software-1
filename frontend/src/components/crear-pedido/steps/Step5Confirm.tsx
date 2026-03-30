"use client";

import { ProductType } from "@/types/types";

type DesignSettings = {
  color: string;
  size: "small" | "medium" | "large" | "xlarge";
  material: "standard" | "premium" | "deluxe";
};

type Props = {
  productType: ProductType | null;
  designSettings: DesignSettings;
};

export default function Step5Confirm({
  productType,
  designSettings,
}: Props) {
  // 🔥 lógica separada (más limpia)
  const basePrice = 10000;

  const sizeMultiplierMap = {
    small: 1,
    medium: 1.5,
    large: 2,
    xlarge: 2.5,
  };

  const materialMultiplierMap = {
    standard: 1,
    premium: 1.3,
    deluxe: 1.6,
  };

  const totalPrice = Math.round(
    basePrice *
      sizeMultiplierMap[designSettings.size] *
      materialMultiplierMap[designSettings.material]
  );

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">
        Resumen del pedido
      </h2>

      <p className="text-muted-foreground mb-6">
        Revisa los detalles antes de confirmar
      </p>

      <div className="space-y-4">
        <div className="flex justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">
            Tipo de producto
          </span>
          <span className="font-semibold capitalize">
            {productType}
          </span>
        </div>

        <div className="flex justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Tamaño</span>
          <span className="font-semibold capitalize">
            {designSettings.size}
          </span>
        </div>

        <div className="flex justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Material</span>
          <span className="font-semibold capitalize">
            {designSettings.material}
          </span>
        </div>

        <div className="flex justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Color</span>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-border"
              style={{ backgroundColor: designSettings.color }}
            />
            <span className="font-semibold">
              {designSettings.color}
            </span>
          </div>
        </div>

        <div className="flex justify-between py-4 text-lg">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-accent text-2xl">
            ${totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-primary">
          <strong>Tiempo estimado de entrega:</strong> 7-10 días hábiles
        </p>
      </div>
    </div>
  );
}