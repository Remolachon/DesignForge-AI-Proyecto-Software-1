import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { marketplaceCatalogService } from '@/services/marketplace-catalog.service';

describe('Marketplace Catalog Service', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getShapes', () => {
    test('retorna shapes exitosamente', async () => {
      const mockData = [{ id: 1, name: 'Round' }];
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

      const res = await marketplaceCatalogService.getShapes();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/products/shapes'));
      expect(res).toEqual(mockData);
    });

    test('arroja error si falla', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      await expect(marketplaceCatalogService.getShapes()).rejects.toThrow('No se pudieron cargar las formas de producto');
    });
  });

  describe('getShapeAttributes', () => {
    test('retorna atributos de shape exitosamente', async () => {
      const mockData = [{ id: 1, code: 'color' }];
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

      const res = await marketplaceCatalogService.getShapeAttributes(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/products/shapes/1/attributes'));
      expect(res).toEqual(mockData);
    });

    test('arroja error si falla', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      await expect(marketplaceCatalogService.getShapeAttributes(1)).rejects.toThrow('No se pudieron cargar los atributos del shape');
    });
  });
});
