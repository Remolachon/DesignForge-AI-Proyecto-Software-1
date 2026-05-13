"use client";

import { ProductType } from "@/types/types";
import { getCatalogImageByType } from "@/constants/productCatalog";

type Props = {
  productType: ProductType | null;
  setProductType: (type: ProductType) => void;
};

export default function Step1ProductType({
  productType,
  setProductType,
}: Props) {
  const products: {
    type: ProductType;
    title: string;
    description: string;
    imageUrl: string;
  }[] = [
    {
      type: "bordado",
      title: "Bordados",
      description: "Logos y diseños bordados de alta calidad",
      imageUrl: getCatalogImageByType("bordado"),
    },
    {
      type: "neon-flex",
      title: "Neon Flex",
      description: "Letreros luminosos modernos",
      imageUrl: getCatalogImageByType("neon-flex"),
    },
    {
      type: "acrilico",
      title: "Acrílico",
      description: "Placas y letreros acrílicos premium",
      imageUrl: getCatalogImageByType("acrilico"),
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">
        Selecciona el tipo de producto
      </h2>
      <p className="text-muted-foreground mb-6">
        Elige el tipo de producto que deseas crear
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.type}
            onClick={() => setProductType(product.type)}
            className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
              productType === product.type
                ? "border-accent shadow-lg scale-105"
                : "border-border hover:border-accent/50"
            }`}
          >
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold mb-1">{product.title}</h3>
              <p className="text-sm text-muted-foreground">
                {product.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}