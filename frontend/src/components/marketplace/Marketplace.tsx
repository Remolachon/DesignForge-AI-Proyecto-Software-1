"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Star } from "lucide-react";
import { toast } from "sonner";

type ProductType = "bordado" | "neon-flex" | "acrilico";

const mockProducts = [
  {
    id: "1",
    title: "Logo Bordado",
    description: "Alta calidad",
    price: 25000,
    rating: 4.8,
    reviews: 12,
    productType: "bordado" as ProductType,
    imageUrl: "https://via.placeholder.com/300",
    inStock: true,
  },
];

function getProductTypeLabel(type: ProductType) {
  if (type === "bordado") return "Bordado";
  if (type === "neon-flex") return "Neon";
  return "Acrílico";
}

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = mockProducts.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-primary mb-2">
          Marketplace
        </h1>
        <p className="text-muted-foreground">
          Explora productos disponibles
        </p>
      </div>

      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg"
          />
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="flex flex-col p-4">
            <img
              src={product.imageUrl}
              className="rounded-lg mb-4"
            />

            <Badge>{getProductTypeLabel(product.productType)}</Badge>

            <h3 className="font-semibold mt-2">{product.title}</h3>

            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>

            <div className="flex justify-between mt-4">
              <span className="font-bold">
                ${product.price.toLocaleString()}
              </span>

              <Button
                onClick={() => toast.success("Agregado")}
              >
                Comprar
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}