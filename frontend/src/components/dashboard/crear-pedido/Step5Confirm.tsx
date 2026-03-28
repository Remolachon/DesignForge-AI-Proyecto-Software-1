"use client";

import { ProductType, DesignSettings } from "@/types/types";

interface Props {
  productType: ProductType | null;
  designSettings: DesignSettings;
  loading: boolean;
  onConfirm: () => void;
}

export default function Step5Confirm({
  productType,
  designSettings,
}: Props) {
  const base = 10000;

  const sizeMap = {
    small: 1,
    medium: 1.5,
    large: 2,
    xlarge: 2.5,
  };

  const materialMap = {
    standard: 1,
    premium: 1.3,
    deluxe: 1.6,
  };

  const total = Math.round(
    base *
      sizeMap[designSettings.size] *
      materialMap[designSettings.material]
  );

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">
        Resumen del pedido
      </h2>

      <div className="space-y-3">
        <Row label="Producto" value={productType} />
        <Row label="Tamaño" value={designSettings.size} />
        <Row label="Material" value={designSettings.material} />

        <div className="flex justify-between text-xl font-bold mt-4">
          <span>Total</span>
          <span>${total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between border-b py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="capitalize font-medium">{value}</span>
    </div>
  );
}