export type AttributeType = 'text' | 'number' | 'select' | 'color';

export interface CustomAttribute {
  code: string;
  label: string;
  type: AttributeType;
  required: boolean;
  unit?: string;
  options?: string[];
}

// Estos deben hacer match exacto o parcial con el productType.
export const customOrderAttributes: Record<string, CustomAttribute[]> = {
  "neon-flex": [
    { code: "tamano", label: "Tamaño", type: "number", required: true, unit: "cm" },
    { code: "color", label: "Color", type: "color", required: true },
    { code: "material_base", label: "Material base", type: "select", required: true, options: ["PVC", "Silicona", "Acrílico"] }
  ],
  "bordado": [
    { code: "tamano", label: "Tamaño", type: "number", required: true, unit: "cm" },
    { code: "ubicacion", label: "Ubicación", type: "select", required: true, options: ["Pecho", "Espalda", "Manga", "Gorra"] },
    { code: "tipo_hilo", label: "Tipo de hilo", type: "select", required: true, options: ["Estándar", "Metálico", "Reflectivo"] }
  ],
  "acrilico": [
    { code: "tamano", label: "Tamaño", type: "number", required: true, unit: "cm" },
    { code: "grosor", label: "Grosor", type: "select", required: true, options: ["3mm", "5mm", "8mm", "10mm"] },
    { code: "acabado", label: "Acabado", type: "select", required: true, options: ["Brillante", "Mate", "Espejo"] }
  ],
  "vinilo": [
    { code: "tamano", label: "Tamaño", type: "number", required: true, unit: "cm" },
    { code: "color", label: "Color", type: "color", required: true },
    { code: "tipo_vinilo", label: "Tipo de vinilo", type: "select", required: true, options: ["Estándar", "Reflectivo", "Holográfico"] }
  ],
  "sublimacion": [
    { code: "tamano", label: "Tamaño", type: "number", required: true, unit: "cm" },
    { code: "tipo_prenda", label: "Tipo de prenda", type: "text", required: true },
    { code: "numero_colores", label: "Número de colores", type: "number", required: true }
  ]
};
