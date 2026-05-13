import { getPublicImageUrl } from "@/lib/supabase/getPublicImageUrl";

const DEFAULT_HOME_STORAGE_PATHS = {
  bordado: "1/landing/bordados.webp",
  "neon-flex": "1/landing/neon.webp",
  acrilico: "1/landing/acrilico.webp",
} as const;

export type CatalogProductType = keyof typeof DEFAULT_HOME_STORAGE_PATHS;

export type HomeCatalogProduct = {
  type: CatalogProductType;
  title: string;
  description: string;
  storagePath: string;
  accent?: boolean;
};

export const HOME_CATALOG_PRODUCTS: HomeCatalogProduct[] = [
  {
    type: "bordado",
    title: "Bordados",
    description:
      "Logos y diseños bordados de alta calidad para uniformes, gorras y más",
    storagePath: DEFAULT_HOME_STORAGE_PATHS.bordado,
  },
  {
    type: "neon-flex",
    title: "Neon Flex",
    description: "Letreros luminosos modernos y llamativos para tu negocio",
    storagePath: DEFAULT_HOME_STORAGE_PATHS["neon-flex"],
    accent: true,
  },
  {
    type: "acrilico",
    title: "Acrílico",
    description: "Placas y letreros acrílicos premium con acabado profesional",
    storagePath: DEFAULT_HOME_STORAGE_PATHS.acrilico,
  },
];

export function normalizeProductType(value: string | null | undefined): CatalogProductType | null {
  const normalized = (value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (normalized.includes("neon")) return "neon-flex";
  if (normalized.includes("acri")) return "acrilico";
  if (normalized.includes("bord")) return "bordado";

  return null;
}

export function getCatalogImageByType(
  productType: string | null | undefined,
  fallbackUrl?: string | null
) {
  if (fallbackUrl && fallbackUrl.trim().length > 0) {
    return fallbackUrl;
  }

  const normalizedType = normalizeProductType(productType);

  if (!normalizedType) {
    return "";
  }

  return getPublicImageUrl(DEFAULT_HOME_STORAGE_PATHS[normalizedType]);
}
