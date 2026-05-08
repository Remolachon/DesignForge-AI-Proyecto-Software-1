-- ============================================================
-- SCRIPT 01 — CREACIÓN DE BUCKETS EN SUPABASE STORAGE
-- ============================================================
-- Proyecto  : E-commerce B2B con producción personalizada
-- Ejecutar  : Supabase Dashboard → SQL Editor
-- Orden     : Este es el PRIMER script. No depende de ningún otro.
-- ¿Qué hace?: Crea los 5 buckets con su configuración correcta
--             de visibilidad, tamaño máximo y tipos permitidos.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- BUCKET 1: product-catalog
-- ─────────────────────────────────────────────────────────────
-- Visibilidad : PÚBLICO (cualquier visitante puede ver imágenes)
-- Contenido   : Imágenes del catálogo de productos de cada empresa
-- Quién sube  : Usuarios autenticados de la empresa dueña
-- Tamaño max  : 10 MB por archivo
-- Tipos       : Solo imágenes web-safe
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-catalog',
  'product-catalog',
  true,                    -- PÚBLICO: URL directa, sin auth, apto para CDN
  10485760,                -- 10 MB en bytes (10 * 1024 * 1024)
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- BUCKET 2: company-assets
-- ─────────────────────────────────────────────────────────────
-- Visibilidad : PRIVADO
-- Contenido   : Logos, banners y branding de cada empresa
-- Quién sube  : Administradores de la empresa (via service_role
--               o RLS por rol — se configura en script 02)
-- Tamaño max  : 10 MB por archivo
-- Tipos       : Imágenes + SVG para logos vectoriales
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  false,                   -- PRIVADO: requiere autenticación o Signed URL
  10485760,                -- 10 MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml'        -- SVG permitido solo aquí (logos vectoriales)
  ]
)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- BUCKET 3: order-references
-- ─────────────────────────────────────────────────────────────
-- Visibilidad : PRIVADO
-- Contenido   : Imágenes de referencia que el cliente sube
--               al crear/editar un ítem de su pedido
-- Quién sube  : El cliente dueño del pedido (desde el browser)
-- Tamaño max  : 10 MB por archivo
-- Tipos       : Solo imágenes (el cliente no sube documentos aquí)
-- Mapeo DB    : order_items.reference_image_url → file_assets
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-references',
  'order-references',
  false,                   -- PRIVADO: solo el dueño del pedido y su empresa
  10485760,                -- 10 MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- BUCKET 4: ai-generated
-- ─────────────────────────────────────────────────────────────
-- Visibilidad : PRIVADO
-- Contenido   : Imágenes generadas por IA para cada order_item
-- Quién sube  : SOLO el backend con service_role key
--               (NUNCA el cliente directamente)
-- Tamaño max  : 10 MB por archivo
-- Tipos       : WebP preferido (mejor compresión para imágenes IA)
--               + PNG/JPEG como fallback
-- Mapeo DB    : order_items.ai_generated_image_url → file_assets
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-generated',
  'ai-generated',
  false,                   -- PRIVADO: lectura solo para empresa/dueño del pedido
  10485760,                -- 10 MB
  ARRAY[
    'image/webp',          -- Formato principal para output de IA
    'image/png',
    'image/jpeg',
    'image/jpg'
  ]
)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- BUCKET 5: documents
-- ─────────────────────────────────────────────────────────────
-- Visibilidad : PRIVADO
-- Contenido   : Facturas, comprobantes de pago, PDFs legales
-- Quién sube  : Backend con service_role (generación automática)
--               o admins de la empresa para documentos manuales
-- Tamaño max  : 25 MB (PDFs pueden ser más pesados que imágenes)
-- Tipos       : Documentos únicamente, sin imágenes sueltas
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,                   -- PRIVADO: acceso estrictamente por empresa
  26214400,                -- 25 MB en bytes (25 * 1024 * 1024)
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  -- .xlsx
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' -- .docx
  ]
)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- VERIFICACIÓN — Ejecutar después del INSERT
-- ─────────────────────────────────────────────────────────────
-- Corre esta consulta para confirmar que los 5 buckets
-- fueron creados correctamente con su configuración.
-- ─────────────────────────────────────────────────────────────
SELECT
  id                                                    AS bucket_id,
  name                                                  AS bucket_name,
  CASE WHEN public THEN 'PÚBLICO' ELSE 'PRIVADO' END    AS visibilidad,
  ROUND(file_size_limit / 1024.0 / 1024.0, 0)::text || ' MB' AS tamano_max,
  array_length(allowed_mime_types, 1)                   AS tipos_permitidos,
  created_at
FROM storage.buckets
WHERE id IN (
  'product-catalog',
  'company-assets',
  'order-references',
  'ai-generated',
  'documents'
)
ORDER BY
  CASE id
    WHEN 'product-catalog'  THEN 1
    WHEN 'company-assets'   THEN 2
    WHEN 'order-references' THEN 3
    WHEN 'ai-generated'     THEN 4
    WHEN 'documents'        THEN 5
  END;
