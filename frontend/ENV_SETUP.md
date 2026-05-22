# 🔧 Configuración de Ambiente - Frontend

## Cambiar entre Backend Local y Render

El archivo `.env.local` controla a cuál backend se conecta el frontend.

### 📍 Opción 1: Backend Local (tu PC)

**Cuando:** Estés desarrollando localmente con `npm run dev`

**Paso:**
1. Abre `frontend/.env.local`
2. Busca la línea `NEXT_PUBLIC_API_URL=`
3. Cambia a:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
4. Guarda el archivo
5. **El frontend se recargará automáticamente** (Next.js dev mode)

**Verifica que funcione:**
- Abre DevTools (F12) → Console
- No deberías ver errores de CORS
- Los requests a `/orders`, `/products`, etc. deberían ir a `http://localhost:8000`

---

### ☁️ Opción 2: Backend en Render (servidor remoto)

**Cuando:** Quieras probar contra el servidor en producción

**Paso:**
1. Abre `frontend/.env.local`
2. Busca la línea `NEXT_PUBLIC_API_URL=`
3. Cambia a:
```
NEXT_PUBLIC_API_URL=https://designforge-ai-proyecto-software-1.onrender.com
```
4. Guarda el archivo
5. **El frontend se recargará automáticamente**

---

## ⚠️ Cosas Importantes

### CORS - Si ves errores de "Access-Control-Allow-Origin"

**Con Backend Local:**
- El backend en FastAPI ya tiene CORS configurado para `http://localhost:3000`
- No deberías tener problemas

**Con Backend en Render:**
- El backend en Render también tiene CORS configurado
- Si aún tienes problemas, el backend necesita configuración de CORS

### Caché del Navegador

Si cambias la URL y ves comportamiento extraño:
1. Abre DevTools (F12)
2. Settings → Storage → Clear site data
3. O recarga con `Ctrl+Shift+R` (hard refresh)

---

## 🚀 Flujo Recomendado para Desarrollo

### Desarrollo Local (Recomendado)
```
1. Terminal 1: npm run dev (frontend en :3000)
2. Terminal 2: python -m app.main (backend en :8000)
3. .env.local → NEXT_PUBLIC_API_URL=http://localhost:8000
4. Abre http://localhost:3000
```

### Prueba contra Render
```
1. Terminal 1: npm run dev (frontend en :3000)
2. .env.local → NEXT_PUBLIC_API_URL=https://designforge-ai-proyecto-software-1.onrender.com
3. Abre http://localhost:3000
4. Frontend → Render Backend (Cloud)
```

---

## 📋 Variables de Entorno Disponibles

```env
# SIEMPRE IGUAL (Supabase Storage)
NEXT_PUBLIC_SUPABASE_URL=https://ttfwjexqplbbcfdfhxsg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# CAMBIAR SEGÚN AMBIENTE (Backend API)
NEXT_PUBLIC_API_URL=http://localhost:8000              # ← Local
NEXT_PUBLIC_API_URL=https://designforge-ai-proyecto-software-1.onrender.com  # ← Render
```

---

## ✅ Checklist de Verificación

Después de cambiar la URL, verifica que:

- [ ] El frontend carga sin errores en console
- [ ] Puedes iniciar sesión
- [ ] Puedes ver productos
- [ ] Puedes crear una orden
- [ ] El pago se procesa (o al menos llega a la pantalla de pago)

Si algo falla, revisa:
1. ¿La URL es correcta? (sin espacios, protocolo http/https)
2. ¿El backend está corriendo? (local o está disponible en Render)
3. ¿Hay errores en la consola?
4. Limpia caché: `Ctrl+Shift+R`

---

## 🐛 Troubleshooting

### Error: "Cannot fetch from API"
→ Verifica que el backend esté corriendo
→ Verifica la URL en `.env.local` es correcta

### Error: "CORS error - Access-Control-Allow-Origin"
→ El backend no tiene CORS configurado correctamente
→ Revisa `backend/app/main.py` - debe tener CORSMiddleware

### Frontend lento
→ Si cambias a Render, la latencia es mayor
→ Usa localhost para desarrollo rápido

---

**¿Preguntas?** Revisa los logs del backend con `DEBUG=1 python -m app.main`
