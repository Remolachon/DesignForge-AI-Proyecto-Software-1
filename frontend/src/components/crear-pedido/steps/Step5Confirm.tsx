"use client";

import { useEffect, useMemo } from "react";
import { ProductType } from "@/types/types";
import { customOrderAttributes } from "@/config/customOrderAttributes";

type Props = {
  productType: ProductType | null;
  quantity: number;
  setQuantity: (quantity: number) => void;
  image: string | null;
  attributeValues: Record<string, string>;
  setAttributeValues: (values: Record<string, string>) => void;
  onValidationChange?: (isValid: boolean) => void;
};

export default function Step5Confirm({
  productType,
  quantity,
  setQuantity,
  image,
  attributeValues,
  setAttributeValues,
  onValidationChange,
}: Props) {
  // Estimated base price for custom design
  const getEstimatedBasePrice = (type: ProductType | null) => {
    switch (type) {
      case "bordado": return 15000;
      case "neon-flex": return 45000;
      case "acrilico": return 35000;
      case "vinilo": return 20000;
      case "sublimacion": return 25000;
      default: return 10000;
    }
  };

  const estimatedPrice = getEstimatedBasePrice(productType);
  const subtotal = estimatedPrice * quantity;
  const tax = Math.round(subtotal * 0.19 * 100) / 100;
  const total = subtotal + tax;
  const attributes = productType ? customOrderAttributes[productType] || [] : [];

  const isValid = useMemo(() => {
    return attributes.every(attr => {
      if (attr.required) {
        return !!attributeValues[attr.code];
      }
      return true;
    });
  }, [attributes, attributeValues]);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [isValid, onValidationChange]);

  const handleChange = (code: string, value: string) => {
    setAttributeValues({ ...attributeValues, [code]: value });
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">
        Resumen y Detalles del Pedido
      </h2>

      <p className="text-muted-foreground mb-6">
        Revisa la imagen y configura los detalles finales para la cotización.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          {image ? (
            <div className="border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              <img src={image} alt="Referencia de diseño" className="w-full h-auto max-h-[300px] object-contain" />
            </div>
          ) : (
            <div className="border rounded-lg bg-gray-50 flex items-center justify-center h-48 text-muted-foreground">
              Sin imagen
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Tipo de producto</span>
            <span className="font-semibold capitalize">
              {productType || "No especificado"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 py-3 border-b border-border">
            <span className="text-muted-foreground">Cantidad</span>
            <input
              type="number"
              min={1}
              max={10}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value) || 1)}
              className="w-24 p-2 border rounded-md bg-transparent text-right"
            />
          </div>

          {attributes.map(attr => (
            <div key={attr.code} className="py-2 border-b border-border">
              <label className="block text-sm text-muted-foreground mb-1">
                {attr.label}
                {attr.unit && ` (${attr.unit})`}
                {attr.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {attr.type === "select" && (
                <select 
                  className="w-full p-2 border rounded-md bg-transparent"
                  value={attributeValues[attr.code] || ""}
                  onChange={(e) => handleChange(attr.code, e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {attr.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
              
              {attr.type === "number" && (
                <input 
                  type="number"
                  className="w-full p-2 border rounded-md bg-transparent"
                  value={attributeValues[attr.code] || ""}
                  onChange={(e) => handleChange(attr.code, e.target.value)}
                  placeholder={`Ej: 50`}
                />
              )}
              
              {attr.type === "text" && (
                <input 
                  type="text"
                  className="w-full p-2 border rounded-md bg-transparent"
                  value={attributeValues[attr.code] || ""}
                  onChange={(e) => handleChange(attr.code, e.target.value)}
                  placeholder={`Escribe el ${attr.label.toLowerCase()}`}
                />
              )}
              
              {attr.type === "color" && (
                <div className="flex items-center gap-3">
                  <input 
                    type="color"
                    className="w-10 h-10 rounded cursor-pointer border border-border"
                    value={attributeValues[attr.code] || "#000000"}
                    onChange={(e) => handleChange(attr.code, e.target.value)}
                  />
                  <span className="text-sm font-mono">{attributeValues[attr.code] || "#000000"}</span>
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-between py-4 text-lg">
            <span className="font-semibold">Precio base estimado</span>
            <span className="font-bold text-accent text-2xl">
              ${subtotal.toLocaleString()}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span>IVA</span>
              <span>${tax.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-primary">
              <strong>Aviso:</strong> El pago a continuación es un adelanto. El costo final dependerá de los atributos seleccionados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}