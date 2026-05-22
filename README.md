# Web Platform Mockups

Este repositorio contiene el código base del proyecto **Web Platform Mockups**, desarrollado a partir de un diseño inicial en Figma.

El diseño original se encuentra disponible en el siguiente enlace:  
https://www.figma.com/design/Sy7XkFWKQcMYtuX6wW9ozD/Web-platform-mockups

---

## 📌 Descripción del proyecto

El objetivo de este proyecto es servir como base para el desarrollo de una plataforma web, partiendo de mockups definidos previamente.  
El repositorio se encuentra en una etapa temprana de desarrollo y seguirá evolucionando de forma incremental.

---

## ▶️ Ejecución del proyecto

# ▶️ Ejecución del Frontend

Antes de ejecutar el proyecto, asegúrate de tener instalado **Node.js**.

1. Instalar las dependencias:
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 🔄 Cambiar entre Backend Local y Render

El frontend puede conectarse a dos backends diferentes:

### 📍 Backend Local (tu PC - Recomendado para desarrollo)
```bash
# 1. Edita frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000

# 2. Frontend se recargará automáticamente en http://localhost:3000
```

### ☁️ Backend en Render (Servidor remoto)
```bash
# 1. Edita frontend/.env.local
NEXT_PUBLIC_API_URL=https://designforge-ai-proyecto-software-1.onrender.com

# 2. Frontend se recargará automáticamente en http://localhost:3000
```

✅ **Ambos funcionan sin problemas** - El CORS está configurado en el backend.

### 🔍 Verificar Conectividad
Windows (PowerShell):
```bash
.\test_backends.ps1
```

Linux/Mac (Bash):
```bash
bash test_backends.sh
```

---

# ▶️ Ejecución del Backend

1. Activar el entorno virtual:
   ```bash
   venv\Scripts\activate
   ```

2. Instalar las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   python -m app.main
   ```
   O con uvicorn:
   ```bash
   uvicorn app.main:app --reload
   ```

El backend estará disponible en **http://localhost:8000**
- Documentación interactiva: http://localhost:8000/docs
- Documentación alternativa: http://localhost:8000/redoc

---

## 🚀 Flujo Recomendado para Desarrollo

**Terminal 1 (Frontend):**
```bash
cd frontend
npm run dev
# Abierto en http://localhost:3000
```

**Terminal 2 (Backend):**
```bash
cd backend
venv\Scripts\activate
python -m app.main
# Abierto en http://localhost:8000
```

**Configuración:**
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Resultado:**
- Frontend en `http://localhost:3000` ✅
- Backend en `http://localhost:8000` ✅
- Base de datos: Supabase ✅
- Todo funcionando localmente 🎉

---

## 🌿 Estructura de ramas

Este repositorio utiliza el siguiente esquema de ramas:

- **main**  
  Rama estable.  
  Se mantiene limpia y solo recibe cambios cuando el código es considerado estable o entregable.

- **develop**  
  Rama de desarrollo activo.  
  Contiene el estado actual del proyecto y el trabajo en curso.

- **Features**  
  Ramas de desarrollo activo para cada funcion.  
  Contiene los ultimos avances individuales de cada desarrollador.

---

## 📂 Estructura de carpetas Backend

   ```bash
    backend/
    │
    ├── app/                     
    │   ├── config/              
    │   │   └── settings.py       # Configuración global (variables de entorno, DB, API keys)
    │   │
    │   ├── controllers/          
    │   │   ├── auth_controller.py # Endpoints de autenticación (login, registro, tokens)
    │   │   └── user_controller.py # Endpoints relacionados con usuarios
    │   │
    │   ├── database/             
    │   │   └── database.py        # Conexión a la base de datos y sesión SQLAlchemy
    │   │
    │   ├── models/               
    │   │   ├── user.py            # Modelo de usuario
    │   │   ├── role.py            # Modelo de roles
    │   │   ├── user_role.py       # Relación usuario-rol
    │   │   └── company.py         # Modelo de empresa
    │   │
    │   ├── providers/             
    │   │   └── supabase_provider.py # Integración con Supabase (auth, storage, realtime)
    │   │
    │   ├── schemas/               
    │   │   └── user_schema.py     # Esquemas Pydantic para validación de datos de usuario
    │   │
    │   ├── security/              
    │   │   └── token_validator.py # Validación de JWT y lógica de seguridad
    │   │
    │   ├── services/              
    │   │   ├── main.py            # Punto de entrada alternativo / servicios generales
    │   │   └── user_service.py    # Lógica de negocio para usuarios
    │   │
    │   └── __pycache__/           # Archivos compilados automáticamente
    │
    ├── venv/                      # Entorno virtual con dependencias instaladas
    │   ├── Lib/site-packages/     # Librerías externas (FastAPI, SQLAlchemy, Supabase, etc.)
    │   └── Scripts/               # Ejecutables del entorno virtual
    │
    ├── requirements.txt           # Lista de dependencias del proyecto
    └── .env                       # Variables de entorno (configuración sensible)
                          # Variables de entorno (configuración sensible)
   ```
---

## 🔁 Flujo de trabajo

- No se realizan commits directos a la rama **main**.
- Todo el desarrollo se realiza sobre la rama **develop**.
- Las ramas de nuevas funcionalidades (feature branches) deben crearse a partir de **develop**.
- La rama **main** solo recibe merges cuando el código es estable.

Este flujo permite mantener una base estable mientras el proyecto se encuentra en desarrollo.

---

## 🧪 Comandos útiles de Git

- Ver el estado del repositorio:  
  ```bash
  git status
  ```
- Ver las ramas y su estado:  
  ```bash
  git branch -vv
  ```
- Ver el historial de commits:  
  ```bash
  git log --oneline --graph --all
  ```
---

## 📄 Consideraciones finales

- La rama **main** puede no contener código funcional hasta que se alcance una versión estable.
- Todas las contribuciones deben seguir el flujo de trabajo descrito anteriormente.
- De nuevo, la rama sobre la que se trabaja es **develop** bajo ninguna circunstancia se ejecutan commits directos a la rama **main**.
