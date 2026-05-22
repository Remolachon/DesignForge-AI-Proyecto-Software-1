const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type MarketplaceShape = {
  id: number;
  name: string;
};

export type MarketplaceShapeAttribute = {
  id: number;
  code: string;
  label: string;
  input_type: string;
  required: boolean;
  placeholder?: string | null;
  default_value?: string | null;
  sort_order: number;
};

export const marketplaceCatalogService = {
  async getShapes(): Promise<MarketplaceShape[]> {
    const response = await fetch(`${API_URL}/products/shapes`);

    if (!response.ok) {
      throw new Error('No se pudieron cargar las formas de producto');
    }

    return response.json();
  },

  async getShapeAttributes(shapeId: number): Promise<MarketplaceShapeAttribute[]> {
    const response = await fetch(`${API_URL}/products/shapes/${shapeId}/attributes`);

    if (!response.ok) {
      throw new Error('No se pudieron cargar los atributos del shape');
    }

    return response.json();
  },
};