import { describe, test, expect, vi, beforeEach } from 'vitest';
import { 
  getPublicImageUrl, 
  getOptimizedImageUrl, 
  getSignedImageUrl, 
  getImageUrlWithFallback 
} from '@/lib/supabase/image-utils';
import { supabaseClient } from '@/lib/supabase/supabaseClient';

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    storage: {
      from: vi.fn()
    }
  }
}));

describe('image-utils', () => {
  const mockGetPublicUrl = vi.fn();
  const mockCreateSignedUrl = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseClient.storage.from).mockReturnValue({
      getPublicUrl: mockGetPublicUrl,
      createSignedUrl: mockCreateSignedUrl
    } as any);
  });

  describe('getPublicImageUrl', () => {
    test('retorna publicUrl', () => {
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'http://public.url' } });
      expect(getPublicImageUrl('path')).toBe('http://public.url');
      expect(supabaseClient.storage.from).toHaveBeenCalledWith('product-catalog');
    });
  });

  describe('getOptimizedImageUrl', () => {
    test('retorna URL con parametro de cache', () => {
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'http://public.url/img.jpg' } });
      const url = getOptimizedImageUrl('path');
      expect(url).toContain('v=');
      expect(url).toContain('http://public.url/img.jpg?v=');
    });

    test('retorna string vacio si falla al parsear URL', () => {
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'invalid-url' } }); // new URL('invalid-url') lanza error
      expect(getOptimizedImageUrl('path')).toBe('');
    });
  });

  describe('getSignedImageUrl', () => {
    test('retorna null si no hay bucket o path', async () => {
      expect(await getSignedImageUrl('', 'path')).toBeNull();
      expect(await getSignedImageUrl('bucket', '')).toBeNull();
    });

    test('retorna publicUrl si getPublicUrl tiene exito', async () => {
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'http://public.url' } });
      expect(await getSignedImageUrl('bucket', 'path')).toBe('http://public.url');
    });

    test('retorna signedUrl si falla public pero signed funciona', async () => {
      mockGetPublicUrl.mockImplementation(() => { throw new Error(); });
      mockCreateSignedUrl.mockResolvedValue({ data: { signedUrl: 'http://signed.url' }, error: null });
      
      expect(await getSignedImageUrl('bucket', 'path')).toBe('http://signed.url');
      expect(mockCreateSignedUrl).toHaveBeenCalledWith(
        'path', 86400, expect.any(Object)
      );
    });

    test('retorna null si error en createSignedUrl', async () => {
      mockGetPublicUrl.mockImplementation(() => { throw new Error(); });
      mockCreateSignedUrl.mockResolvedValue({ data: null, error: new Error('Error') });
      expect(await getSignedImageUrl('bucket', 'path')).toBeNull();
    });
  });

  describe('getImageUrlWithFallback', () => {
    test('retorna fallbackUrl si no hay bucket o path', async () => {
      expect(await getImageUrlWithFallback('', 'path', 'http://fallback')).toBe('http://fallback');
      expect(await getImageUrlWithFallback('bucket', '')).toBe('/images/placeholder.png');
    });

    test('retorna publicUrl si es exitoso', async () => {
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'http://public.url' } });
      expect(await getImageUrlWithFallback('bucket', 'path')).toBe('http://public.url');
    });

    test('retorna signedUrl si publicUrl falla', async () => {
      // Mock para getPublicUrl
      mockGetPublicUrl.mockImplementation(() => { throw new Error(); });
      // mock para createSignedUrl ya que getSignedImageUrl internamente lo usa
      mockCreateSignedUrl.mockResolvedValue({ data: { signedUrl: 'http://signed.url' }, error: null });

      expect(await getImageUrlWithFallback('bucket', 'path')).toBe('http://signed.url');
    });

    test('retorna fallbackUrl si todo falla', async () => {
      mockGetPublicUrl.mockImplementation(() => { throw new Error(); });
      mockCreateSignedUrl.mockImplementation(() => { throw new Error(); });

      expect(await getImageUrlWithFallback('bucket', 'path', 'http://fallback')).toBe('http://fallback');
    });
  });
});
