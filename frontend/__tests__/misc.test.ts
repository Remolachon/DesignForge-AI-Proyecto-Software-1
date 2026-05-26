import { describe, test, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProductAttributes } from '@/hooks/useProductAttributes';
import { useProducts } from '@/hooks/useProducts';
import { ProductService } from '@/services/product.service';
import { getStatusColor } from '@/lib/utils/statusColors';
import { getApiBaseUrl } from '@/lib/utils/apiBaseUrl';

describe('getApiBaseUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('returns env variable if set', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://test-url.com/';
    expect(getApiBaseUrl()).toBe('http://test-url.com');
  });

  test('returns default if env variable is not set', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(getApiBaseUrl()).toBe('https://designforge-ai-proyecto-software-1.onrender.com');
  });
});
vi.mock('@/services/product.service');

describe('useProductAttributes Hook', () => {
  const mockProduct = {
    id: 1,
    title: 'Test',
    description: '',
    price: 100,
    rating: 0,
    reviews: 0,
    inStock: true,
    stock: 10,
    productType: 'neon-flex',
    attributes: [
      { id: 1, code: 'color', label: 'Color', required: true, sort_order: 1, input_type: 'select' },
      { id: 2, code: 'size', label: 'Size', required: false, sort_order: 2, input_type: 'select' }
    ]
  };

  test('inicializa valores correctamente', () => {
    const { result } = renderHook(() => useProductAttributes(mockProduct as any));
    expect(result.current.values).toEqual({});
    expect(result.current.totalPrice).toBe(100);
    expect(result.current.isValid).toBe(false);
    expect(result.current.missingRequired).toContain('Color');
  });

  test('setValue actualiza valores y evalua validez', () => {
    const { result } = renderHook(() => useProductAttributes(mockProduct as any));
    
    act(() => {
      result.current.setValue('color', 'red');
    });

    expect(result.current.values.color).toBe('red');
    expect(result.current.isValid).toBe(true);
    expect(result.current.missingRequired).toHaveLength(0);
  });

  test('getPayload retorna payload correcto', () => {
    const { result } = renderHook(() => useProductAttributes(mockProduct as any));
    
    act(() => {
      result.current.setValue('color', 'blue');
    });

    expect(result.current.getPayload()).toEqual({
      productId: 1,
      quantity: 1,
      attributes: { color: 'blue' }
    });
  });
});

describe('useProducts Hook', () => {
  test('carga inicial', async () => {
    vi.mocked(ProductService.getProducts).mockResolvedValueOnce([{ id: 1 } as any]);
    
    const { result } = renderHook(() => useProducts());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.products).toEqual([{ id: 1 }]);
    });
  });
});

describe('statusColors', () => {
  test('retorna colores correctos', () => {
    expect(getStatusColor('Pendiente')).toContain('bg-slate-100');
    expect(getStatusColor('Pendiente de pago')).toContain('bg-yellow-100');
    expect(getStatusColor('En diseño')).toContain('bg-sky-100');
    expect(getStatusColor('En producción')).toContain('bg-orange-100');
    expect(getStatusColor('Listo para entregar')).toContain('bg-emerald-100');
    expect(getStatusColor('Entregado')).toContain('bg-green-600');
    expect(getStatusColor('Otro')).toContain('bg-gray-100');
  });
});
