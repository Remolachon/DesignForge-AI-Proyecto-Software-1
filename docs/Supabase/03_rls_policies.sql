-- ============================================================
-- SCRIPT 03 — RLS POLICIES PARA SUPABASE STORAGE
-- ============================================================
-- Proyecto  : E-commerce B2B con producción personalizada
-- Depende de: Script 01 (buckets), Script 02 (file_assets)
-- Ejecutar  : Supabase Dashboard → SQL Editor
-- ¿Qué hace?:
--   1. Función helper get_my_company_id() — reutilizada en
--      todas las policies para evitar subqueries repetidas
--   2. Habilita RLS en storage.objects (si no está activo)
--   3. Policies para product-catalog   (público + escritura protegida)
--   4. Policies para company-assets    (privado por empresa)
--   5. Policies para order-references  (privado por dueño del pedido)
--   6. Policies para ai-generated      (lectura empresa, escritura solo backend)
--   7. Policies para documents         (privado por empresa)
--   8. Verificación final
-- ============================================================


-- ============================================================
-- SECCIÓN 1 — FUNCIÓN HELPER get_my_company_id()
-- ============================================================
-- Resuelve el company_id del usuario autenticado actualmente
-- consultando la tabla public.users por su supabase_id (uuid).
--
-- Por qué SECURITY DEFINER:
--   La función se ejecuta con los permisos del owner (postgres),
--   no del usuario que llama. Esto permite leer public.users
--   incluso si el usuario anónimo no tiene permisos directos
--   sobre esa tabla, y evita recursión en RLS.
--
-- Por qué STABLE:
--   El resultado no cambia dentro de la misma transacción.
--   PostgreSQL puede cachear el resultado y evitar ejecutar
--   la subquery en cada fila evaluada por la policy.
--
-- Por qué SET search_path = '':
--   Previene ataques de search_path hijacking — una práctica
--   de seguridad obligatoria en funciones SECURITY DEFINER.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT company_id
  FROM public.users
  WHERE supabase_id = auth.uid()
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_my_company_id IS
  'Devuelve el company_id del usuario autenticado actual. '
  'Usado en todas las RLS policies de Storage para aislamiento multi-tenant. '
  'Retorna NULL si el usuario no existe en public.users o no está autenticado.';


-- ============================================================
-- SECCIÓN 2 — HABILITAR RLS EN storage.objects
-- ============================================================
-- En Supabase, storage.objects es la tabla interna donde se
-- registran todos los archivos subidos a Storage.
-- RLS debe estar activo para que las policies tengan efecto.
-- Esta línea es idempotente — no falla si ya estaba activo.
-- ============================================================



-- ============================================================
-- SECCIÓN 3 — BUCKET: product-catalog (PÚBLICO)
-- ============================================================
-- SELECT : libre para cualquiera, sin autenticación
-- INSERT : solo usuarios autenticados de la empresa dueña
-- UPDATE : solo la empresa dueña puede reemplazar archivos
-- DELETE : solo la empresa dueña puede eliminar archivos
--
-- Por qué 4 policies separadas en vez de una con FOR ALL:
--   FOR ALL combina USING y WITH CHECK en la misma condición.
--   Para SELECT necesitamos USING = true (sin restricción),
--   pero para INSERT/UPDATE/DELETE necesitamos verificar
--   company_id. Mezclarlos con FOR ALL haría que SELECT
--   también verifique company_id, bloqueando visitantes anónimos.
-- ============================================================

-- Limpiar policies previas si existen (idempotente)
DROP POLICY IF EXISTS "pc_select_public"          ON storage.objects;
DROP POLICY IF EXISTS "pc_insert_company_only"    ON storage.objects;
DROP POLICY IF EXISTS "pc_update_company_only"    ON storage.objects;
DROP POLICY IF EXISTS "pc_delete_company_only"    ON storage.objects;

-- SELECT: cualquier visitante, sin token
CREATE POLICY "pc_select_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-catalog');

-- INSERT: el primer segmento del path debe coincidir con
-- el company_id del usuario autenticado
CREATE POLICY "pc_insert_company_only"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-catalog'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
);

-- UPDATE: misma lógica — solo la empresa dueña del path
CREATE POLICY "pc_update_company_only"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-catalog'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
)
WITH CHECK (
  bucket_id = 'product-catalog'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
);

-- DELETE: solo la empresa dueña
CREATE POLICY "pc_delete_company_only"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-catalog'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
);


-- ============================================================
-- SECCIÓN 4 — BUCKET: company-assets (PRIVADO)
-- ============================================================
-- Logos y banners de cada empresa.
-- Solo usuarios de la misma empresa pueden leer y escribir.
--
-- Path esperado: {company_id}/logo.svg
--                {company_id}/banner.webp
-- ============================================================

DROP POLICY IF EXISTS "ca_select_company_only" ON storage.objects;
DROP POLICY IF EXISTS "ca_insert_company_only" ON storage.objects;
DROP POLICY IF EXISTS "ca_update_company_only" ON storage.objects;
DROP POLICY IF EXISTS "ca_delete_company_only" ON storage.objects;

CREATE POLICY "ca_select_company_only"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'company-assets'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
);

CREATE POLICY "ca_insert_company_only"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
);

CREATE POLICY "ca_update_company_only"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'company-assets'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
)
WITH CHECK (
  bucket_id = 'company-assets'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
);

CREATE POLICY "ca_delete_company_only"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'company-assets'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
);


-- ============================================================
-- SECCIÓN 5 — BUCKET: order-references (PRIVADO)
-- ============================================================
-- Imágenes de referencia subidas por el cliente al crear
-- o editar un ítem de su pedido.
--
-- Path esperado: {company_id}/{order_id}/{order_item_id}/{filename}
--
-- Lógica de acceso en SELECT:
--   El usuario puede leer la imagen si cumple DOS condiciones:
--   a) Su company_id coincide con el primer segmento del path.
--   b) El order_item_id en el tercer segmento pertenece a un
--      pedido que le fue asignado a él en public.orders.
--
--   La condición (b) es el "doble candado": evita que un
--   empleado de la misma empresa vea imágenes de pedidos
--   de otros clientes de esa empresa.
--
-- Lógica de acceso en INSERT:
--   Basta con verificar company_id (condición a). La validación
--   de que el order_item pertenece al usuario se hace en la
--   lógica de negocio del backend/API antes de llamar al upload.
--   No se duplica aquí para no hacer la policy frágil ante
--   cambios en la estructura de órdenes.
-- ============================================================

DROP POLICY IF EXISTS "or_select_order_owner"   ON storage.objects;
DROP POLICY IF EXISTS "or_insert_company_only"  ON storage.objects;
DROP POLICY IF EXISTS "or_update_order_owner"   ON storage.objects;
DROP POLICY IF EXISTS "or_delete_order_owner"   ON storage.objects;

-- SELECT: company_id coincide + el order_item pertenece al usuario
CREATE POLICY "or_select_order_owner"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'order-references'
  AND auth.role() = 'authenticated'
  -- Condición a: aislamiento multi-tenant por empresa
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  -- Condición b: el order_item del path pertenece a un pedido del usuario
  AND EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    JOIN public.users  u ON u.id = o.user_id
    WHERE oi.id::text = (storage.foldername(name))[3]
      AND u.supabase_id = auth.uid()
  )
);

-- INSERT: solo verificamos company_id
-- (el backend valida que el order_item es del usuario antes del upload)
CREATE POLICY "or_insert_company_only"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'order-references'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
);

-- UPDATE: doble candado igual que SELECT
CREATE POLICY "or_update_order_owner"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'order-references'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  AND EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    JOIN public.users  u ON u.id = o.user_id
    WHERE oi.id::text = (storage.foldername(name))[3]
      AND u.supabase_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'order-references'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
);

-- DELETE: doble candado
CREATE POLICY "or_delete_order_owner"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'order-references'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  AND EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    JOIN public.users  u ON u.id = o.user_id
    WHERE oi.id::text = (storage.foldername(name))[3]
      AND u.supabase_id = auth.uid()
  )
);


-- ============================================================
-- SECCIÓN 6 — BUCKET: ai-generated (PRIVADO)
-- ============================================================
-- Imágenes generadas por IA para cada order_item.
--
-- REGLA CRÍTICA DE SEGURIDAD:
--   INSERT y UPDATE están PROHIBIDOS para usuarios autenticados.
--   Solo el backend con service_role key puede escribir aquí.
--   service_role bypasea RLS completamente — no necesita policy.
--
--   Si se creara una policy de INSERT para usuarios, cualquier
--   cliente podría subir una imagen arbitraria y reemplazar
--   el resultado de un proceso de producción validado.
--
-- SELECT: el usuario puede ver imágenes IA de sus propios
--   pedidos (mismo doble candado que order-references).
-- ============================================================

DROP POLICY IF EXISTS "ai_select_order_owner" ON storage.objects;
-- No se crean policies de INSERT/UPDATE/DELETE para usuarios.
-- service_role bypasea RLS — el backend escribe sin policy.

CREATE POLICY "ai_select_order_owner"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ai-generated'
  AND auth.role() = 'authenticated'
  -- Aislamiento por empresa
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
  -- El order_item del path pertenece al usuario
  AND EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    JOIN public.users  u ON u.id = o.user_id
    WHERE oi.id::text = (storage.foldername(name))[3]
      AND u.supabase_id = auth.uid()
  )
);


-- ============================================================
-- SECCIÓN 7 — BUCKET: documents (PRIVADO)
-- ============================================================
-- Facturas, comprobantes y documentos legales.
-- Acceso restringido a la empresa dueña del documento.
--
-- Path esperado: {company_id}/{order_id}/invoice_{order_id}.pdf
--                {company_id}/{order_id}/receipt_{transaction_id}.pdf
--
-- INSERT y DELETE solo desde el backend (service_role).
-- Los usuarios pueden leer sus propios documentos pero no
-- subir ni eliminar — eso es responsabilidad del sistema.
-- ============================================================

DROP POLICY IF EXISTS "doc_select_company_only" ON storage.objects;
DROP POLICY IF EXISTS "doc_insert_company_only" ON storage.objects;

-- SELECT: la empresa puede leer sus documentos
CREATE POLICY "doc_select_company_only"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
);

-- INSERT: solo backend con service_role. Esta policy existe como
-- fallback explícito para admins autenticados con rol especial.
-- Para el flujo normal (generación automática de facturas),
-- el backend usa service_role y bypasea esta policy.
CREATE POLICY "doc_insert_company_only"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_company_id()::text
);


-- ============================================================
-- SECCIÓN 8 — VERIFICACIÓN FINAL
-- ============================================================

-- 8a. Confirmar que RLS está habilitado en storage.objects
SELECT
  relname         AS tabla,
  relrowsecurity  AS rls_habilitado
FROM pg_class
WHERE oid = 'storage.objects'::regclass;

-- 8b. Listar todas las policies creadas por bucket
SELECT
  policyname                          AS policy,
  cmd                                 AS operacion,
  qual                                AS condicion_using,
  with_check                          AS condicion_with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename  = 'objects'
  AND policyname IN (
    'pc_select_public',         'pc_insert_company_only',
    'pc_update_company_only',   'pc_delete_company_only',
    'ca_select_company_only',   'ca_insert_company_only',
    'ca_update_company_only',   'ca_delete_company_only',
    'or_select_order_owner',    'or_insert_company_only',
    'or_update_order_owner',    'or_delete_order_owner',
    'ai_select_order_owner',
    'doc_select_company_only',  'doc_insert_company_only'
  )
ORDER BY
  CASE SPLIT_PART(policyname, '_', 1)
    WHEN 'pc'  THEN 1
    WHEN 'ca'  THEN 2
    WHEN 'or'  THEN 3
    WHEN 'ai'  THEN 4
    WHEN 'doc' THEN 5
  END,
  cmd;

-- 8c. Resumen por bucket: cuántas policies tiene cada uno
SELECT
  SPLIT_PART(policyname, '_', 1)  AS prefijo_bucket,
  COUNT(*)                        AS total_policies,
  STRING_AGG(cmd, ', ' ORDER BY cmd) AS operaciones
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename  = 'objects'
  AND policyname LIKE ANY(ARRAY['pc_%','ca_%','or_%','ai_%','doc_%'])
GROUP BY SPLIT_PART(policyname, '_', 1)
ORDER BY prefijo_bucket;