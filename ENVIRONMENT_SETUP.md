# 🌍 Configuración de Ambientes - Backend Local vs Render

## 📋 Resumen Rápido

El frontend **ya está configurado** para usar cualquiera de estos dos backends:

| Ambiente | URL | Uso |
|----------|-----|-----|
| **Local** | `http://localhost:8000` | Desarrollo (por defecto) |
| **Render** | `https://designforge-ai-proyecto-software-1.onrender.com` | Producción |

---

## 🔧 Instrucciones Paso a Paso

### Paso 1: Verificar que el Backend esté Disponible

**Para Backend Local:**
```bash
# Asegúrate de que el backend está corriendo
python -m app.main
```

**Para Backend Render:**
- Solo necesita conexión a internet
- El servidor está en la nube, siempre disponible

### Paso 2: Configurar el Frontend

**Archivo:** `frontend/.env.local`

**Opción A: Usar Backend Local** (por defecto)
```env
NEXT_PUBLIC_SUPABASE_URL=https://ttfwjexqplbbcfdfhxsg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Opción B: Usar Backend Render**
```env
NEXT_PUBLIC_SUPABASE_URL=https://ttfwjexqplbbcfdfhxsg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=https://designforge-ai-proyecto-software-1.onrender.com
```

### Paso 3: Reiniciar Frontend (si es necesario)

Next.js recarga automáticamente cuando cambias `.env.local`, pero si no:
```bash
cd frontend
npm run dev
# O si ya estaba corriendo, presiona R para recargar
```

### Paso 4: Verificar Conectividad

Abre DevTools (F12) en el navegador:
- Abre la pestaña **Network**
- Haz una acción que requiera API (ej: login, ver productos)
- Verifica que los requests vayan a la URL correcta

**Debería ver:**
- ✅ `http://localhost:8000/orders` → Backend Local
- ✅ `https://designforge-ai-proyecto-software-1.onrender.com/orders` → Backend Render

---

## 🐛 Solución de Problemas

### "Cannot reach backend"
**Causa:** El backend no está corriendo
**Solución:**
```bash
cd backend
venv\Scripts\activate
python -m app.main
```

### "CORS error - Access-Control-Allow-Origin"
**Causa:** El backend no tiene CORS configurado para tu origen
**Solución:** El backend ya tiene CORS para:
- `http://localhost:3000` ✅
- `http://127.0.0.1:3000` ✅
- Dominios Vercel ✅

Si aún tienes error, verifica `backend/app/main.py` en la sección de CORS.

### "Requests lentos"
**Causa:** Estás usando Render en lugar de Local
**Solución:** Cambia a Backend Local para desarrollo más rápido

### "Frontend listo pero Backend lento"
**Causa:** Render puede estar en modo "sleep" (después de 15 min inactividad)
**Solución:** 
- Espera 30 segundos (está despertando)
- O usa Backend Local para desarrollo

---

## 🚀 Flujos de Trabajo Comunes

### Desarrollo Local (Recomendado)

```bash
# Terminal 1: Backend
cd backend
venv\Scripts\activate
python -m app.main
# Escuchando en http://localhost:8000

# Terminal 2: Frontend
cd frontend
npm run dev
# Abierto en http://localhost:3000

# Configuración:
# frontend/.env.local → NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Ventajas:**
- ⚡ Rápido
- 🔄 Cambios instantáneos
- 🎯 Desarrollo productivo
- 🐛 Fácil debugging

---

### Prueba contra Render

```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# Abierto en http://localhost:3000

# Configuración:
# frontend/.env.local → NEXT_PUBLIC_API_URL=https://designforge-ai-proyecto-software-1.onrender.com

# Resultado: Frontend local → Backend Render
```

**Ventajas:**
- ✅ Prueba contra servidor real
- ✅ Sin necesidad de backend local
- ✅ Prueba de integración

**Desventajas:**
- 🐌 Más lento (latencia de red)
- ⏰ Render puede dormir si no hay actividad

---

### Producción (Deployment)

```bash
# El frontend se deploy a Vercel automáticamente
# frontend/.env.local → NEXT_PUBLIC_API_URL=https://designforge-ai-proyecto-software-1.onrender.com

# El backend se deploy a Render automáticamente
```

---

## 📊 Comparación de Ambientes

| Aspecto | Local | Render |
|--------|-------|--------|
| **Velocidad** | ⚡⚡⚡ Muy rápido | ⚡ Tiene latencia |
| **Disponibilidad** | Mientras ejecutes | 24/7 en nube |
| **Debugging** | 🟢 Fácil | 🔴 Difícil |
| **Base de datos** | Supabase (nube) | Supabase (nube) |
| **Mejor para** | Desarrollo | QA/Pruebas/Prod |
| **Requisitos** | PC + IDE | Navegador |

---

## ⚙️ Variables de Entorno

### Frontend (`frontend/.env.local`)

```env
# Supabase (siempre igual)
NEXT_PUBLIC_SUPABASE_URL=https://ttfwjexqplbbcfdfhxsg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Backend (cambiar según ambiente)
NEXT_PUBLIC_API_URL=http://localhost:8000              # Local
NEXT_PUBLIC_API_URL=https://designforge-ai-proyecto-software-1.onrender.com  # Render
```

### Backend (`backend/.env`)

Requiere:
- `DATABASE_URL` (Supabase)
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `HF_TOKEN` (Hugging Face para IA)
- etc.

---

## 🔍 Verificación Final

**Checklist después de cambiar ambiente:**

- [ ] El frontend carga sin errores
- [ ] Puedes ver la página de inicio
- [ ] Puedes iniciar sesión
- [ ] Puedes ver productos
- [ ] Puedes crear una orden
- [ ] No hay errores de CORS en DevTools
- [ ] Los requests van a la URL correcta

**Si algo falla:**

1. Verifica que el backend esté corriendo
2. Verifica la URL en `.env.local`
3. Limpia caché: `Ctrl+Shift+R` (hard refresh)
4. Revisa DevTools → Console para errores
5. Revisa logs del backend

---

## 💡 Tips Profesionales

✅ **Usa Backend Local durante desarrollo** - Es mucho más rápido

✅ **Guarda comandos útiles** - Crea alias en PowerShell:
```powershell
# En tu perfil PowerShell
function Start-Backend {
    cd backend
    venv\Scripts\activate
    python -m app.main
}

function Start-Frontend {
    cd frontend
    npm run dev
}
```

✅ **Monitorea cambios con watcher** - Next.js ya lo hace, pero verifica:
```bash
npm run dev
# Debe decir: "✓ Ready in XXms"
```

✅ **Documenta cambios de ambiente** - Si trabajas en equipo, deja nota:
```bash
# En git pre-commit hook, recordar actualizar .env.local
git diff --cached | grep NEXT_PUBLIC_API_URL
```

---

## 📞 Preguntas Frecuentes

**P: ¿Necesito reiniciar algo después de cambiar la URL?**
R: No, Next.js recarga automáticamente. Solo actualiza el navegador.

**P: ¿Puedo usar ambos backends simultáneamente?**
R: No, solo uno a la vez. Pero puedes cambiar en segundos.

**P: ¿Mi datos de producción está seguro?**
R: Sí, ambos usan la misma base de datos Supabase, así que sincroniza automáticamente.

**P: ¿Por qué Local es más rápido?**
R: Porque no hay latencia de red. Todo está en tu PC.

**P: ¿Qué pasa si dejo el Backend Local sin ejecutar?**
R: El frontend dará error al conectar. Simplemente ejecuta `python -m app.main`.

---

## 📚 Archivos Relevantes

- **[frontend/.env.local](../frontend/.env.local)** - Configuración frontend
- **[frontend/ENV_SETUP.md](../frontend/ENV_SETUP.md)** - Guía detallada frontend
- **[backend/app/main.py](../backend/app/main.py)** - Configuración CORS backend
- **[README.md](../README.md)** - Guía general del proyecto
- **[test_backends.ps1](../test_backends.ps1)** - Script de verificación (Windows)
- **[test_backends.sh](../test_backends.sh)** - Script de verificación (Linux/Mac)
