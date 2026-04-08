// Función mejorada para obtener URLs de imágenes desde Supabase
// con soporte para múltiples buckets y mejor manejo de timeouts

import { supabaseClient } from '@/lib/supabase/supabaseClient';

/**
 * Obtiene URL pública de un archivo en product-catalog (acceso público)
 */
export function getPublicImageUrl(path: string) {
  const { data } = supabaseClient.storage
    .from("product-catalog")
    .getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Obtiene URL pública definitiva con caché de imágenes mejorado
 * Agrega parámetros para evitar problemas de timeout
 */
export function getOptimizedImageUrl(path: string) {
  try {
    const url = getPublicImageUrl(path);
    // Agregar parámetros para mejor caché
    const urlObj = new URL(url);
    urlObj.searchParams.set('v', Date.now().toString());
    return urlObj.toString();
  } catch {
    return '';
  }
}

/**
 * Obtiene URL firmada para archivos privados con expiración más larga
 * Útil para order-references y otros buckets privados
 */
export async function getSignedImageUrl(
  bucket: string,
  path: string,
  expirationSeconds: number = 86400 // 24 horas por defecto
): Promise<string | null> {
  try {
    if (!bucket || !path) return null;

    // Para evitar timeouts, usar getPublicUrl primero si es posible
    try {
      const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    } catch {
      // Si getPublicUrl falla, intentar con getSignedUrl
    }

    // Generar URL firmada con expiración larga
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .createSignedUrl(path, expirationSeconds, {
        transform: {
          width: 800,
          height: 600,
          quality: 80,
        },
      });

    if (error || !data?.signedUrl) {
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Obtiene URL de imagen con fallback y mejor manejo de timeouts
 * Intentar primero pública, luego firmada
 */
export async function getImageUrlWithFallback(
  bucket: string,
  path: string,
  fallbackUrl?: string
): Promise<string> {
  if (!bucket || !path) {
    return fallbackUrl || '/images/placeholder.png';
  }

  try {
    // Intentar URL pública primero (más rápida)
    try {
      const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    } catch {
      // Ignorar error y continuar
    }

    // Intentar URL firmada con timeout
    const signedUrl = await Promise.race([
      getSignedImageUrl(bucket, path),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      ),
    ]);

    if (signedUrl) {
      return signedUrl;
    }
  } catch {
    // Ignorar errores
  }

  return fallbackUrl || '/images/placeholder.png';
}
