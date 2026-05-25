import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { adminMarketplaceService } from '@/services/admin-marketplace.service';

vi.mock('@/constants/productCatalog', () => ({
  getCatalogImageByType: vi.fn((type, url) => url || 'default-image.jpg'),
  normalizeProductType: vi.fn((type) => type || 'bordado')
}));

describe('Admin Marketplace Service', () => {
  const mockFetch = vi.fn();
  
  beforeEach(() => {
    mockFetch.mockClear();
    vi.stubGlobal('fetch', mockFetch);
    localStorage.setItem('token', 'fake-admin-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test('arroja error de autorizacion si no hay token', async () => {
    localStorage.removeItem('token');
    await expect(adminMarketplaceService.getProducts()).rejects.toThrow('No autorizado');
  });

  describe('getProducts', () => {
    test('maneja paginacion y concatena resultados', async () => {
      // Mock para la página 1
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ id: 1, name: 'Product 1', productType: 'neon-flex' }],
          totalPages: 2
        })
      });
      // Mock para la página 2
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ id: 2, name: 'Product 2', productType: 'bordado' }],
          totalPages: 2
        })
      });

      const products = await adminMarketplaceService.getProducts('search_term');
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(products).toHaveLength(2);
      expect(products[0].id).toBe('1');
      expect(products[1].id).toBe('2');
    });

    test('rompe el loop si items esta vacio', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          totalPages: 5 // simulamos que el backend dice 5 paginas pero no hay items
        })
      });

      const products = await adminMarketplaceService.getProducts();
      
      expect(mockFetch).toHaveBeenCalledTimes(1); // No continua al break
      expect(products).toHaveLength(0);
    });

    test('lanza error si falla', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      await expect(adminMarketplaceService.getProducts()).rejects.toThrow('Error cargando productos de administrador');
    });
  });

  describe('CRUD Operations', () => {
    const payload = {
      name: 'New Product',
      description: 'Desc',
      basePrice: 100,
      productType: 'acrilico' as any,
      productShape: 'square',
      stock: 10
    };

    test('createProduct exitoso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 99, name: 'New Product' })
      });

      const result = await adminMarketplaceService.createProduct(payload);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/admin'),
        expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
      );
      expect(result.id).toBe('99');
    });

    test('createProduct con error captura detalle', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Creation failed' })
      });
      await expect(adminMarketplaceService.createProduct(payload)).rejects.toThrow('Creation failed');
    });

    test('updateProduct exitoso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 99 })
      });

      await adminMarketplaceService.updateProduct('99', payload);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/admin/99'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    test('setVisibility', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 99, isPublic: true })
      });

      await adminMarketplaceService.setVisibility('99', true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/admin/99/visibility'),
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ is_public: true }) })
      );
    });

    test('deleteProduct', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });
      await adminMarketplaceService.deleteProduct('99');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/admin/99'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    test('deleteProduct lanza error por defecto si no hay json', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => { throw new Error(); } });
      await expect(adminMarketplaceService.deleteProduct('99')).rejects.toThrow('No se pudo eliminar el producto');
    });
  });

  describe('uploadProductMedia', () => {
    test('sube archivo como FormData', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'image.jpg' })
      });

      const file = new File([''], 'test.png', { type: 'image/png' });
      await adminMarketplaceService.uploadProductMedia(1, 2, 'image', 'primary', 0, file);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/admin/1/media'),
        expect.objectContaining({ method: 'POST' })
      );
      
      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.body).toBeDefined();
      expect(callArgs.body.constructor.name).toBe('FormData');
    });
  });
});
