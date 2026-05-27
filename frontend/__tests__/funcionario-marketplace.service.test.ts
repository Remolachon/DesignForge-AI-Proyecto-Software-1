import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { funcionarioMarketplaceService } from '@/services/funcionario-marketplace.service';

vi.mock('@/constants/productCatalog', () => ({
  getCatalogImageByType: vi.fn((type, url) => url || 'default-image.jpg'),
  normalizeProductType: vi.fn((type) => type || 'bordado')
}));

describe('Funcionario Marketplace Service', () => {
  const mockFetch = vi.fn();
  
  beforeEach(() => {
    mockFetch.mockClear();
    vi.stubGlobal('fetch', mockFetch);
    localStorage.setItem('token', 'fake-func-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test('arroja error de autorizacion si no hay token', async () => {
    localStorage.removeItem('token');
    await expect(funcionarioMarketplaceService.getProducts()).rejects.toThrow('No autorizado');
  });

  describe('getProducts', () => {
    test('retorna y normaliza la lista de productos', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Prod 1', productType: 'neon-flex' },
          { id: 2, name: 'Prod 2', productType: 'acrilico' }
        ]
      });

      const products = await funcionarioMarketplaceService.getProducts();
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(products).toHaveLength(2);
      expect(products[0].id).toBe('1');
      expect(products[1].id).toBe('2');
    });

    test('lanza error si falla la carga', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      await expect(funcionarioMarketplaceService.getProducts()).rejects.toThrow('Error cargando productos');
    });
  });

  describe('CRUD Operations', () => {
    const payload = {
      name: 'New Product Func',
      description: 'Desc',
      basePrice: 150,
      productType: 'acrilico' as any,
      productShape: 'round',
      stock: 5
    };

    test('createProduct exitoso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 88, name: 'New Product Func' })
      });

      const result = await funcionarioMarketplaceService.createProduct(payload);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/admin'),
        expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
      );
      expect(result.id).toBe('88');
    });

    test('createProduct con error captura detalle', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Creation failed by func' })
      });
      await expect(funcionarioMarketplaceService.createProduct(payload)).rejects.toThrow('Creation failed by func');
    });

    test('updateProduct exitoso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 88 })
      });

      await funcionarioMarketplaceService.updateProduct('88', payload);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/admin/88'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    test('setVisibility', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 88, isPublic: false })
      });

      await funcionarioMarketplaceService.setVisibility('88', false);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/admin/88/visibility'),
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ is_public: false }) })
      );
    });

    test('deleteProduct', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });
      await funcionarioMarketplaceService.deleteProduct('88');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/admin/88'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('uploadProductMedia', () => {
    test('sube archivo como FormData exitosamente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'image-func.jpg' })
      });

      const file = new File([''], 'test.png', { type: 'image/png' });
      await funcionarioMarketplaceService.uploadProductMedia(1, 2, 'image', 'primary', 0, file);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/admin/1/media'),
        expect.objectContaining({ method: 'POST' })
      );
      
      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.body).toBeDefined();
      expect(callArgs.body.constructor.name).toBe('FormData');
    });

    test('arroja error al fallar la subida', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Media upload failed' })
      });

      const file = new File([''], 'test.png', { type: 'image/png' });
      await expect(funcionarioMarketplaceService.uploadProductMedia(1, 2, 'image', 'primary', 0, file))
        .rejects.toThrow('Media upload failed');
    });
  });
});
