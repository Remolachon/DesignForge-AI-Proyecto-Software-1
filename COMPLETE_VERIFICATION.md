# ✅ VERIFICACIÓN COMPLETA: Rutas y Funcionalidad

## 🎯 Objetivo
Verificar que el frontend funciona correctamente sin errores en **desarrollo** y **producción**.

---

## 🧪 VERIFICACIÓN 1: Estructura de Rutas

### Terminal (Windows PowerShell)

```powershell
cd frontend
.\verify-routes.ps1
```

**Esperado:**
```
✅ Estructura de rutas CORRECTA!
Ahora ejecuta: npm run dev
```

### Terminal (Linux/Mac)

```bash
cd frontend
bash verify-routes.sh
```

---

## 🚀 VERIFICACIÓN 2: Desarrollo Local

### 1. Limpia caché

```bash
cd frontend
rm -rf .next            # Linux/Mac
# O en PowerShell: Remove-Item -Path ".next" -Recurse -Force
```

### 2. Inicia dev server

```bash
npm run dev
```

**Esperado en consola:**
```
▲ Next.js 15.1.0
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

**NO debería ver:**
```
⨯ You cannot have two parallel pages that resolve to the same path
[browser] ./src/app/login - You cannot have two parallel pages...
```

### 3. Prueba rutas en navegador

Abre DevTools (F12) → Network tab

| Ruta | Status Esperado | Acción |
|------|---|---|
| http://localhost:3000/ | 200 | Debería mostrar landing page |
| http://localhost:3000/login | 200 | Debería mostrar login form |
| http://localhost:3000/register | 200 | Debería mostrar registro form |
| http://localhost:3000/marketplace | 200 | Debería mostrar productos |
| http://localhost:3000/cliente/dashboard | 200 (después de login) | Dashboard cliente |

**Si ves 404 o 500:** Algo está mal. Revisa los pasos anteriores.

### 4. Verifica en Network tab

```
Para cada ruta:
✅ GET /login → 200 OK
✅ GET /_next/... → 200 OK
✅ Ningún 404
✅ Ningún 500
```

---

## 💳 VERIFICACIÓN 3: Flujo de Marketplace

### Antes de esta prueba: Asegurar que el backend está corriendo

```bash
# Terminal separada
cd backend
python -m uvicorn app.main:app --reload
```

**Esperado:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### Pasos de la prueba

1. **Abre marketplace**
   ```
   http://localhost:3000/marketplace
   ```
   - Debería mostrar lista de productos
   - Ningún error en consola

2. **Haz click en un producto**
   ```
   Debería ir a: http://localhost:3000/marketplace/[id]
   Debería mostrar: Detalles del producto
   ```

3. **Compra el producto**
   - Click en botón "Comprar"
   - Debería mostrar modal o redirigir a pago
   - Debería enviar request al backend

4. **Verifica en DevTools Console**
   ```
   NO debería haber errores como:
   ❌ [object Object]
   ❌ Cannot read property 'detail' of undefined
   ❌ Network error
   ```

---

## 🏗️ VERIFICACIÓN 4: Build para Producción

### 1. Haz build

```bash
cd frontend
npm run build
```

**Esperado:**
```
▲ Next.js 15.1.0
✓ Compiled successfully
✓ Collecting page data...
✓ Generating static pages (X/Y)
✓ Finalizing page optimization...

Route (app)                           File
⨳ /                                   page
⨳ /auth/callback                      page
⨳ /(auth)/login                       page
⨳ /(auth)/register                    page
...
...

✓ exported successfully
```

**NO debería ver:**
```
✗ Build failed
Error: You cannot have two parallel pages...
```

### 2. Inicia servidor de producción

```bash
npm run start
```

**Esperado:**
```
▲ Next.js 15.1.0
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 3. Prueba las mismas rutas

```
http://localhost:3000/login      ✅ 200
http://localhost:3000/register   ✅ 200
http://localhost:3000/marketplace ✅ 200
```

---

## 🌐 VERIFICACIÓN 5: Deploy a Vercel

### 1. Verifica que Git está limpio

```bash
git status
# Debería estar limpio o tener solo cambios intentados
```

### 2. Commit y push

```bash
git add .
git commit -m "fix: resolver conflicto de rutas paralelas en Next.js

- Eliminar rutas duplicadas (app/login, app/register)
- Mantener route groups correctos (auth, public)
- Agregar verificación de rutas
- Limpiar caché de Next.js"
git push origin develop
# o git push origin main según tu rama
```

### 3. Vercel auto-deploya

- Ve a https://vercel.com/dashboard
- Verifica que el build está "In Progress"
- Espera a que termine

**Esperado:**
```
✓ Build Successful

Deployments
production → https://designforge-ai-[xxx].vercel.app
```

### 4. Prueba las rutas en producción

```
https://designforge-ai-[xxx].vercel.app/login       ✅ 200
https://designforge-ai-[xxx].vercel.app/register    ✅ 200
https://designforge-ai-[xxx].vercel.app/marketplace ✅ 200
```

**Si ves 404 o 500 en producción pero funciona en local:**
- Verifica que `.env.local` no está siendo usado en producción
- Las env variables de Vercel deben estar correctas
- Intenta forzar rebuild: `vercel rebuild`

---

## 📋 CHECKLIST FINAL

### ✅ Desarrollo

- [ ] `npm run dev` sin errores
- [ ] `/login` carga correctamente (200)
- [ ] `/register` carga correctamente (200)
- [ ] `/marketplace` carga correctamente (200)
- [ ] No hay `[object Object]` en consola
- [ ] No hay errores de "parallel pages"
- [ ] Marketplace compra funciona

### ✅ Producción Local

- [ ] `npm run build` sin errores
- [ ] `npm run start` funciona
- [ ] Todas las rutas cargan (200)
- [ ] Sin 404 o 500

### ✅ Vercel

- [ ] Build en Vercel es "Successful"
- [ ] Deployment completado
- [ ] Rutas funcionan en URL de producción
- [ ] Sin errores en navegador

### ✅ End-to-End

- [ ] Puedo ir a /login desde /
- [ ] Puedo hacer login
- [ ] Puedo acceder a /cliente/dashboard
- [ ] Puedo ir a /marketplace
- [ ] Puedo comprar un producto
- [ ] La transacción se guarda en BD

---

## 🆘 Si Algo Falla

### Error: Still seeing 404

```bash
# Limpia más agresivamente
rm -rf node_modules .next
npm install
npm run dev
```

### Error: 500 después de deploy

```bash
# Verifica env variables en Vercel:
# Settings → Environment Variables
# NEXT_PUBLIC_API_URL debe estar correcta
```

### Error: Marketplace no funciona

```bash
# Verifica que backend está corriendo
# En otra terminal:
cd backend
python -m uvicorn app.main:app --reload

# Verifica URL en frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📞 Soporte Rápido

| Problema | Solución |
|----------|----------|
| Routes 404 | `rm -rf .next && npm run dev` |
| `[object Object]` error | Verifica backend devuelva JSON válido |
| Marketplace sin datos | Verifica BD de Supabase tiene productos |
| 500 en Vercel | Revisa env variables en Vercel |
| Build fails | `npm run build` localmente, revisa errores |

---

## ✨ PRÓXIMOS PASOS

1. **Ahora:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Verifica rutas locales:** `http://localhost:3000/login`

3. **Prueba marketplace completo**

4. **Cuando todo funcione en local:**
   ```bash
   git push
   ```

5. **Cuando Vercel termine, prueba en producción**

---

## 🎉 ÉXITO

Cuando todos los checkpoints están verdes ✅, el proyecto está listo para:
- ✅ Desarrollo continuo
- ✅ Testing QA
- ✅ Deployment a producción
- ✅ Usuarios finales

