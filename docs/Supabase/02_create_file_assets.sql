-- ============================================================
-- SCRIPT 02 — TABLA file_assets + LIMPIEZA DE COLUMNAS LEGACY
-- ============================================================
-- Proyecto  : E-commerce B2B con producción personalizada
-- Depende de: Script 01 (buckets ya creados)
-- Ejecutar  : Supabase Dashboard → SQL Editor
-- ¿Qué hace?:
--   1. Elimina columnas legacy en order_items (vacías, sin uso)
--   2. Crea el enum file_type_enum
--   3. Crea la tabla central file_assets con constraints robustos
--   4. Crea índices parciales optimizados
--   5. Crea trigger updated_at
--   6. Crea función helper get_public_url()
--   7. Verifica que todo quedó bien
-- ============================================================


-- ============================================================
-- SECCIÓN 1 — LIMPIEZA DE COLUMNAS LEGACY EN order_items
-- ============================================================
-- Se eliminan reference_image_url y ai_generated_image_url
-- porque están vacías, nadie las usa aún, y file_assets
-- reemplaza su función de forma normalizada y escalable.
--
-- PRECAUCIÓN: Este ALTER es irreversible. Solo ejecutar
-- habiendo confirmado que las columnas están vacías con:
--   SELECT COUNT(*) FROM public.order_items
--   WHERE reference_image_url IS NOT NULL
--      OR ai_generated_image_url IS NOT NULL;
-- El resultado debe ser 0 antes de continuar.
-- ============================================================

ALTER TABLE public.order_items
  DROP COLUMN IF EXISTS reference_image_url,
  DROP COLUMN IF EXISTS ai_generated_image_url;

-- Confirmación inmediata del cambio
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'order_items'
      AND column_name  IN ('reference_image_url', 'ai_generated_image_url')
  ) THEN
    RAISE EXCEPTION 'ERROR: Las columnas legacy siguen existiendo. Revisar manualmente.';
  ELSE
    RAISE NOTICE 'OK: Columnas legacy eliminadas correctamente de order_items.';
  END IF;
END $$;


-- ============================================================
-- SECCIÓN 2 — ENUM file_type_enum
-- ============================================================
-- Enum en lugar de VARCHAR libre: PostgreSQL rechaza valores
-- inválidos a nivel de motor sin depender del ORM ni del
-- frontend. Para agregar tipos futuros:
--   ALTER TYPE public.file_type_enum ADD VALUE 'nuevo_tipo';
-- ============================================================

CREATE TYPE public.file_type_enum AS ENUM (
  -- Imágenes de producto (catálogo)
  'product_main',       -- Imagen principal (1 activa por producto)
  'product_gallery',    -- Galería (N por producto, con sort_order)
  'product_thumbnail',  -- Versión reducida para listados (1 activa por producto)

  -- Assets de empresa
  'company_logo',       -- Logo oficial
  'company_banner',     -- Banner o cabecera

  -- Imágenes de pedidos
  'reference_image',    -- Referencia subida por el cliente
  'ai_generated',       -- Generada por IA (1 activa por order_item)

  -- Documentos
  'invoice',            -- Factura PDF
  'payment_receipt'     -- Comprobante de pago
);

COMMENT ON TYPE public.file_type_enum IS
  'Clasificación exhaustiva de archivos en el sistema. '
  'Agregar nuevos valores con ALTER TYPE ... ADD VALUE.';


-- ============================================================
-- SECCIÓN 3 — TABLA file_assets
-- ============================================================
-- Fuente de verdad única para todos los archivos del sistema.
-- Storage guarda los bytes; esta tabla guarda el significado,
-- el contexto y el vínculo con las entidades de negocio.
--
-- Regla de propiedad: exactamente una FK es no-null por fila.
--   company_id     → logos y banners de empresa
--   product_id     → imágenes de catálogo (main/gallery/thumb)
--   order_item_id  → referencias e imágenes IA de pedidos
--   transaction_id → facturas y recibos de pago
-- ============================================================

CREATE TABLE public.file_assets (

  -- ── Identidad ────────────────────────────────────────────
  id                  integer       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- ── Localización en Storage ───────────────────────────────
  -- bucket_name + storage_path = dirección física completa.
  -- Juntos son UNIQUE: no pueden existir dos registros para
  -- el mismo archivo físico.
  bucket_name         text          NOT NULL,
  storage_path        text          NOT NULL,

  -- ── Clasificación ─────────────────────────────────────────
  file_type           public.file_type_enum NOT NULL,
  mime_type           text,
  size_bytes          bigint        CHECK (size_bytes > 0),

  -- ── Orden en galería ──────────────────────────────────────
  -- Solo para file_type = 'product_gallery'.
  -- 0 = primera posición. NULL para todos los demás tipos.
  sort_order          smallint      DEFAULT NULL,

  -- ── Vínculos a entidades de negocio ───────────────────────
  -- El constraint ck_single_owner (abajo) garantiza que
  -- exactamente uno de estos cuatro sea no-null.
  company_id          integer       REFERENCES public.companies(id)    ON DELETE CASCADE,
  product_id          integer       REFERENCES public.products(id)     ON DELETE CASCADE,
  order_item_id       integer       REFERENCES public.order_items(id)  ON DELETE CASCADE,
  transaction_id      integer       REFERENCES public.transactions(id) ON DELETE SET NULL,

  -- ── Auditoría ─────────────────────────────────────────────
  uploaded_by         integer       REFERENCES public.users(id)        ON DELETE SET NULL,
  uploaded_at         timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),
  is_active           boolean       NOT NULL DEFAULT true,

  -- ── Metadata exclusiva de imágenes IA ─────────────────────
  -- Solo se rellenan cuando file_type = 'ai_generated'.
  -- generation_version permite historial de intentos (1, 2, 3…).
  -- Cuando el backend genera una nueva versión, marca la
  -- anterior is_active = false e inserta la nueva.
  generation_prompt   text          DEFAULT NULL,
  generation_version  smallint      DEFAULT NULL
                      CHECK (generation_version > 0),


  -- ══════════════════════════════════════════════════════════
  -- CONSTRAINTS DE INTEGRIDAD
  -- ══════════════════════════════════════════════════════════

  -- C1: Un archivo físico solo puede tener un registro.
  CONSTRAINT uq_file_assets_storage_location
    UNIQUE (bucket_name, storage_path),

  -- C2: Solo una 'product_main' activa por producto.
  CONSTRAINT uq_one_main_per_product
    EXCLUDE USING btree (product_id WITH =)
    WHERE (
      file_type = 'product_main'
      AND is_active = true
      AND product_id IS NOT NULL
    ),

  -- C3: Solo un 'product_thumbnail' activo por producto.
  CONSTRAINT uq_one_thumbnail_per_product
    EXCLUDE USING btree (product_id WITH =)
    WHERE (
      file_type = 'product_thumbnail'
      AND is_active = true
      AND product_id IS NOT NULL
    ),

  -- C4: Solo un 'ai_generated' activo por order_item.
  -- Protocolo al regenerar: UPDATE is_active=false primero,
  -- INSERT la nueva versión después. En ese orden estricto.
  CONSTRAINT uq_one_active_ai_per_order_item
    EXCLUDE USING btree (order_item_id WITH =)
    WHERE (
      file_type = 'ai_generated'
      AND is_active = true
      AND order_item_id IS NOT NULL
    ),

  -- C5: Exactamente UNA entidad propietaria por fila.
  CONSTRAINT ck_single_owner CHECK (
    (
      (company_id     IS NOT NULL)::int +
      (product_id     IS NOT NULL)::int +
      (order_item_id  IS NOT NULL)::int +
      (transaction_id IS NOT NULL)::int
    ) = 1
  ),

  -- C6: Campos de IA solo permitidos en su file_type.
  CONSTRAINT ck_ai_fields_only_for_ai_type CHECK (
    file_type = 'ai_generated'
    OR (generation_prompt IS NULL AND generation_version IS NULL)
  ),

  -- C7: sort_order solo para galerías.
  CONSTRAINT ck_sort_order_only_for_gallery CHECK (
    file_type = 'product_gallery'
    OR sort_order IS NULL
  ),

  -- C8: Tipos de empresa requieren company_id.
  CONSTRAINT ck_company_types_need_company_id CHECK (
    file_type NOT IN ('company_logo', 'company_banner')
    OR company_id IS NOT NULL
  ),

  -- C9: Tipos de pedido requieren order_item_id.
  CONSTRAINT ck_order_types_need_order_item_id CHECK (
    file_type NOT IN ('reference_image', 'ai_generated')
    OR order_item_id IS NOT NULL
  ),

  -- C10: Tipos de documento requieren transaction_id.
  CONSTRAINT ck_document_types_need_transaction_id CHECK (
    file_type NOT IN ('invoice', 'payment_receipt')
    OR transaction_id IS NOT NULL
  )

);

COMMENT ON TABLE public.file_assets IS
  'Fuente de verdad para todos los archivos en Supabase Storage. '
  'Cada fila vincula un archivo físico con exactamente una entidad de negocio. '
  'Las columnas legacy reference_image_url y ai_generated_image_url '
  'fueron eliminadas de order_items en este script.';

COMMENT ON COLUMN public.file_assets.bucket_name IS
  'Nombre del bucket en Supabase Storage. '
  'Valores válidos: product-catalog, company-assets, '
  'order-references, ai-generated, documents.';

COMMENT ON COLUMN public.file_assets.storage_path IS
  'Path completo dentro del bucket, sin slash inicial. '
  'Formato: {company_id}/{entidad_id}/.../{filename}.{ext}. '
  'Ejemplo: 42/187/main.webp';

COMMENT ON COLUMN public.file_assets.sort_order IS
  'Solo para file_type=product_gallery. '
  'Posición en la galería (0-based). NULL para todos los otros tipos.';

COMMENT ON COLUMN public.file_assets.generation_version IS
  'Solo para file_type=ai_generated. '
  'Número de versión (1, 2, 3…). '
  'Versiones anteriores se marcan is_active=false, no se eliminan.';

COMMENT ON COLUMN public.file_assets.is_active IS
  'false = borrado lógico o versión superada (ej: imagen IA reemplazada). '
  'Los registros inactivos se conservan para auditoría e historial.';


-- ============================================================
-- SECCIÓN 4 — ÍNDICES PARCIALES
-- ============================================================
-- Todos usan WHERE is_active=true para excluir registros
-- inactivos. Índices más pequeños, queries más rápidos.
-- ============================================================

-- Catálogo: imágenes activas de un producto (query más frecuente)
CREATE INDEX idx_fa_product_active
  ON public.file_assets (product_id, file_type)
  WHERE product_id IS NOT NULL
    AND is_active = true;

-- Galería: orden visual de imágenes de un producto
CREATE INDEX idx_fa_product_gallery_order
  ON public.file_assets (product_id, sort_order)
  WHERE product_id IS NOT NULL
    AND file_type = 'product_gallery'
    AND is_active = true;

-- Pedidos: referencia e IA activa de un order_item
CREATE INDEX idx_fa_order_item_active
  ON public.file_assets (order_item_id, file_type)
  WHERE order_item_id IS NOT NULL
    AND is_active = true;

-- Assets de empresa: logo y banner por company_id
CREATE INDEX idx_fa_company_active
  ON public.file_assets (company_id, file_type)
  WHERE company_id IS NOT NULL
    AND is_active = true;

-- Documentos: por transacción
CREATE INDEX idx_fa_transaction
  ON public.file_assets (transaction_id)
  WHERE transaction_id IS NOT NULL;

-- Auditoría: actividad de subida por usuario
CREATE INDEX idx_fa_uploaded_by
  ON public.file_assets (uploaded_by, uploaded_at DESC)
  WHERE uploaded_by IS NOT NULL;

-- Historial IA completo (activos e inactivos) por order_item
CREATE INDEX idx_fa_ai_history
  ON public.file_assets (order_item_id, generation_version DESC)
  WHERE order_item_id IS NOT NULL
    AND file_type = 'ai_generated';


-- ============================================================
-- SECCIÓN 5 — TRIGGER updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_set_updated_at IS
  'Trigger reutilizable: actualiza updated_at = now() en cada UPDATE. '
  'Puede reutilizarse en otras tablas.';

CREATE TRIGGER trg_fa_updated_at
  BEFORE UPDATE ON public.file_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_updated_at();


-- ============================================================
-- SECCIÓN 6 — FUNCIÓN HELPER get_public_url()
-- ============================================================
-- Construye la URL pública para archivos en product-catalog.
-- Para buckets privados retorna NULL.
-- Las Signed URLs de buckets privados se generan desde
-- el cliente JS: supabase.storage.from(bucket).createSignedUrl()
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_public_url(
  p_bucket       text,
  p_storage_path text
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT CASE
    WHEN p_bucket = 'product-catalog'
    THEN current_setting('app.supabase_url', true)
         || '/storage/v1/object/public/product-catalog/'
         || p_storage_path
    ELSE NULL
  END;
$$;

COMMENT ON FUNCTION public.get_public_url IS
  'Retorna la URL pública directa para archivos en product-catalog. '
  'Para todos los demás buckets retorna NULL (usar Signed URLs). '
  'Ejemplo: SELECT get_public_url(bucket_name, storage_path) FROM file_assets;';


-- ============================================================
-- SECCIÓN 7 — VERIFICACIÓN FINAL
-- ============================================================

-- 7a. Columnas legacy eliminadas de order_items
SELECT
  'COLUMNAS LEGACY' AS check_nombre,
  CASE
    WHEN COUNT(*) = 0
    THEN '✓ OK — eliminadas correctamente de order_items'
    ELSE '✗ ERROR — aún existen ' || COUNT(*) || ' columnas legacy'
  END AS resultado
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'order_items'
  AND column_name  IN ('reference_image_url', 'ai_generated_image_url');

-- 7b. Columnas de file_assets
SELECT
  ordinal_position AS pos,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'file_assets'
ORDER BY ordinal_position;

-- 7c. Índices
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename  = 'file_assets'
ORDER BY indexname;

-- 7d. Constraints
SELECT
  conname                   AS constraint_name,
  CASE contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'x' THEN 'EXCLUDE'
  END                       AS tipo,
  pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE conrelid = 'public.file_assets'::regclass
ORDER BY contype, conname;

-- 7e. Valores del enum
SELECT
  enumlabel         AS valor,
  enumsortorder     AS orden
FROM pg_enum
JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
WHERE pg_type.typname = 'file_type_enum'
ORDER BY enumsortorder;
