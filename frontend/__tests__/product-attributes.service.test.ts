import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { productAttributesService } from '@/services/product-attributes.service';

describe('Product Attributes Service', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getProductAttributes', () => {
    test('retorna y mapea atributos exitosamente', async () => {
      const mockData = [
        { id: 1, code: 'color', label: 'Color', input_type: 'select', required: true, placeholder: 'Select', sort_order: 1, extra_field_to_ignore: 'yes' }
      ];
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

      const res = await productAttributesService.getProductAttributes(10);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/products/10/attributes'));
      expect(res).toHaveLength(1);
      expect(res[0]).toEqual({
        id: 1,
        code: 'color',
        label: 'Color',
        input_type: 'select',
        required: true,
        placeholder: 'Select',
        sort_order: 1
      });
      expect((res[0] as any).extra_field_to_ignore).toBeUndefined(); // Verifica el mapeo
    });

    test('arroja error si falla', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      await expect(productAttributesService.getProductAttributes(10)).rejects.toThrow('Failed to fetch product attributes');
    });
  });
});
