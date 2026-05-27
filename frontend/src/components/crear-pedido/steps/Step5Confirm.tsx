"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductType } from "@/types/types";
import {
  marketplaceCatalogService,
  type MarketplaceShape,
  type MarketplaceShapeAttribute,
} from "@/services/marketplace-catalog.service";

type Props = {
  productType: ProductType | null;
  quantity: number;
  setQuantity: (quantity: number) => void;
  image: string | null;
  selectedShapeId: number | null;
  selectedShapeName: string | null;
  shapeAttributes: MarketplaceShapeAttribute[];
  shapeAttributeValues: Record<string, string>;
  setSelectedShape: (shapeId: number | null, shapeName: string | null) => void;
  setShapeAttributes: (shapeAttributes: MarketplaceShapeAttribute[]) => void;
  setShapeAttributeValues: Dispatch<SetStateAction<Record<string, string>>>;
  onValidationChange?: (isValid: boolean) => void;
};

const getEstimatedBasePrice = (type: ProductType | null) => {
  switch (type) {
    case "bordado":
      return 15000;
    case "neon-flex":
      return 45000;
    case "acrilico":
      return 35000;
    case "vinilo":
      return 20000;
    case "sublimacion":
      return 25000;
    default:
      return 10000;
  }
};

const getTypeLabel = (type: ProductType | null) => {
  if (!type) return "No especificado";
  const labels: Record<ProductType, string> = {
    bordado: "Bordado",
    "neon-flex": "Neon Flex",
    acrilico: "Acrilico",
    vinilo: "Vinilo",
    sublimacion: "Sublimacion",
  };
  return labels[type];
};

const formatShapeAttributeLabel = (label: string, code: string) => {
  const normalized = `${label} ${code}`.toLowerCase();
  if (normalized.includes("color")) return label;
  if (normalized.includes("largo")) return "Largo (cm)";
  if (normalized.includes("ancho")) return "Ancho (cm)";
  if (normalized.includes("alto") || normalized.includes("altura")) return "Alto (cm)";
  if (normalized.includes("profundidad")) return "Profundidad (cm)";
  if (normalized.includes("diametro") || normalized.includes("diámetro")) return "Diámetro (cm)";
  return label;
};

const getShapeAttributePlaceholder = (attribute: MarketplaceShapeAttribute, displayLabel: string) => {
  const normalized = `${attribute.label} ${attribute.code}`.toLowerCase();

  if (attribute.input_type === 'number') {
    if (
      normalized.includes('largo') ||
      normalized.includes('ancho') ||
      normalized.includes('alto') ||
      normalized.includes('altura') ||
      normalized.includes('profundidad') ||
      normalized.includes('diametro') ||
      normalized.includes('diámetro') ||
      displayLabel.toLowerCase().includes('(cm)')
    ) {
      return 'Ej: 12';
    }

    return 'Ej: 1';
  }

  return attribute.placeholder || `Escribe ${displayLabel.toLowerCase()}`;
};

export default function Step5Confirm({
  productType,
  quantity,
  setQuantity,
  image,
  selectedShapeId,
  selectedShapeName,
  shapeAttributes,
  shapeAttributeValues,
  setSelectedShape,
  setShapeAttributes,
  setShapeAttributeValues,
  onValidationChange,
}: Props) {
  const [shapes, setShapes] = useState<MarketplaceShape[]>([]);
  const [loadingShapes, setLoadingShapes] = useState(false);
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  const estimatedPrice = getEstimatedBasePrice(productType);
  const subtotal = estimatedPrice * quantity;
  const tax = Math.round(subtotal * 0.19 * 100) / 100;
  const total = subtotal + tax;

  const visibleShapeAttributes = useMemo(
    () => shapeAttributes.filter((attribute) => attribute.code !== "color" && attribute.input_type !== "color"),
    [shapeAttributes],
  );

  useEffect(() => {
    let mounted = true;

    const loadShapes = async () => {
      try {
        setLoadingShapes(true);
        const data = await marketplaceCatalogService.getShapes();
        if (mounted) {
          setShapes(data);
        }
      } catch {
        if (mounted) {
          setShapes([]);
        }
      } finally {
        if (mounted) {
          setLoadingShapes(false);
        }
      }
    };

    void loadShapes();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadShapeAttributes = async () => {
      if (!selectedShapeId) {
        setShapeAttributes([]);
        setShapeAttributeValues({});
        return;
      }

      try {
        setLoadingAttributes(true);
        const data = await marketplaceCatalogService.getShapeAttributes(selectedShapeId);
        if (!mounted) return;

        setShapeAttributes(data);
        setShapeAttributeValues((prev) => {
          const next: Record<string, string> = {};

          data.forEach((attribute) => {
            next[attribute.code] = prev[attribute.code] ?? attribute.default_value ?? "";
          });

          return next;
        });
      } catch {
        if (mounted) {
          setShapeAttributes([]);
          setShapeAttributeValues({});
        }
      } finally {
        if (mounted) {
          setLoadingAttributes(false);
        }
      }
    };

    void loadShapeAttributes();

    return () => {
      mounted = false;
    };
  }, [selectedShapeId, setShapeAttributes, setShapeAttributeValues]);

  const isValid = useMemo(() => {
    if (!selectedShapeId || !selectedShapeName || loadingAttributes) {
      return false;
    }

    return visibleShapeAttributes.every((attribute) => {
      const currentValue = shapeAttributeValues[attribute.code] || "";

      if (attribute.required && !currentValue.trim()) {
        return false;
      }

      if (attribute.input_type === "number" && currentValue.trim()) {
        return !Number.isNaN(Number(currentValue)) && Number(currentValue) > 0;
      }

      return true;
    });
  }, [selectedShapeId, selectedShapeName, loadingAttributes, visibleShapeAttributes, shapeAttributeValues]);

  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const handleChange = (code: string, value: string) => {
    setShapeAttributeValues({ ...shapeAttributeValues, [code]: value });
  };

  const handleShapeChange = (shapeIdValue: string) => {
    const nextShapeId = shapeIdValue ? Number(shapeIdValue) : null;
    const selectedShape = shapes.find((shape) => shape.id === nextShapeId) || null;
    setLoadingAttributes(Boolean(nextShapeId));
    setSelectedShape(selectedShape?.id ?? null, selectedShape?.name ?? null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Resumen y detalles finales</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Revisa tu pedido, elige la forma que mejor lo represente y completa los datos que te pidamos. Cuando una empresa lo acepte, podrás continuar con el pago.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          Solicitud pendiente de asignacion
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          {image ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-sm">
              <img
                src={image}
                alt="Referencia del pedido"
                className="max-h-[340px] w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
              Sin imagen de referencia
            </div>
          )}

          <Card className="border-border/60 bg-card/90 p-5 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tipo de producto</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{getTypeLabel(productType)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Forma</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{selectedShapeName || "Selecciona una forma"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cantidad</p>
                <div className="mt-2 flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    -
                  </Button>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value) || 1)}
                    className="w-20 rounded-md border border-border bg-transparent px-3 py-2 text-center"
                  />
                  <Button variant="outline" size="icon" onClick={() => setQuantity(Math.min(10, quantity + 1))}>
                    +
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Valor estimado</p>
                <p className="mt-1 text-2xl font-semibold text-primary">${total.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/60 bg-card/90 p-5 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Selecciona una forma</label>
                <select
                  value={selectedShapeId || ""}
                  onChange={(event) => handleShapeChange(event.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                  disabled={loadingShapes}
                >
                  <option value="">Selecciona una forma</option>
                  {shapes.map((shape) => (
                    <option key={shape.id} value={shape.id}>
                      {shape.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">Tu pedido no se pagara ahora</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Primero un funcionario asignara tu solicitud a una empresa. En ese momento recibiras una notificacion y desde alli podras continuar con el pago.
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Especificaciones del shape</h3>
                <p className="text-sm text-muted-foreground">
                  Completa los campos obligatorios. Los campos de color se omiten para este flujo.
                </p>
              </div>
              {loadingAttributes && <span className="text-xs text-muted-foreground">Cargando...</span>}
            </div>

            <div className="mt-4 space-y-4">
              {visibleShapeAttributes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Selecciona una forma para ver sus datos.
                </div>
              ) : (
                visibleShapeAttributes.map((attribute) => {
                  const currentValue = shapeAttributeValues[attribute.code] || "";
                  const displayLabel = formatShapeAttributeLabel(attribute.label, attribute.code);

                  return (
                    <div key={attribute.id} className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        {displayLabel}
                        {attribute.required && <span className="ml-1 text-red-500">*</span>}
                      </label>
                      <input
                        type={attribute.input_type === "number" ? "number" : "text"}
                        value={currentValue}
                        placeholder={getShapeAttributePlaceholder(attribute, displayLabel)}
                        onChange={(event) => handleChange(attribute.code, event.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/30"
                      />
                      {attribute.required && !currentValue.trim() && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">Este campo es obligatorio.</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/80 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-200">Solicitud lista para revisión</p>
                <p className="mt-1 text-sm leading-6 text-emerald-900/80 dark:text-emerald-200/80">
                  Al enviar tu solicitud, quedará en espera hasta que una empresa la tome. Después verás el paso de pago para continuar normalmente.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
