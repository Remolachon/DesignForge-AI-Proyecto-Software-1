import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProductService } from '@/services/product.service';

vi.mock('@/constants/productCatalog', () => ({
  normalizeProductType: vi.fn((type) => type || 'bordado')
}));

describe('Product Service', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getProducts', () => {
    test('retorna y normaliza productos exitosamente', async () => {
      const mockData = [
        { id: 1, title: 'P1', price: 10, productType: 'neon-flex' }
      ];
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

      const res = await ProductService.getProducts();
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe(1);
      expect(res[0].productType).toBe('neon-flex');
    });

    test('arroja error si response no es ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      await expect(ProductService.getProducts()).rejects.toThrow('Error fetching products');
    });
  });

  describe('getProductById', () => {
    test('encuentra y retorna producto existente', async () => {
      const mockData = [
        { id: 1, title: 'P1' },
        { id: 2, title: 'P2' }
      ];
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

      const res = await ProductService.getProductById('2');
      expect(res.id).toBe(2);
      expect(res.title).toBe('P2');
    });

    test('arroja error si producto no existe', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      await expect(ProductService.getProductById('99')).rejects.toThrow('Product not found');
    });
  });
});
