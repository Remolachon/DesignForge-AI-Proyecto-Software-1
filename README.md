# DesignForge-AI - Embroidery Marketplace 🚀

![DesignForge-AI Logo](https://img.shields.io/badge/DesignForge-AI-blue.svg)
![Frontend](https://img.shields.io/badge/Frontend-Next.js-black?logo=next.js)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)

DesignForge-AI es una plataforma integral de Marketplace. Está diseñada para conectar a empresas, diseñadores y clientes a través de un sistema unificado que gestiona productos, pedidos, ventas tambien esta pensado para
escalar al diseño de productos con una herramienta avanzada de IA.

---

## 📁 Estructura del Proyecto

El proyecto está organizado en una arquitectura de monorepo con el frontend y el backend claramente separados.

```text
DesignForge-AI-Proyecto-Software-1/
├── frontend/       # Aplicación web construida con Next.js, Tailwind CSS y TypeScript
├── backend/        # API RESTful construida con FastAPI y Python
├── docs/           # Documentación técnica, requisitos, planeación y Supabase
└── README.md       # Este archivo
```

## 🛠️ Tecnologías Principales

### Frontend
- **Framework:** Next.js
- **Estilos:** Tailwind CSS
- **Lenguaje:** TypeScript
- **Entorno:** Node.js

### Backend
- **Framework:** FastAPI
- **Lenguaje:** Python
- **Base de Datos:** Configurada para integración con bases de datos relacionales (Supabase/PostgreSQL)
- **Módulos y Rutas:** Autenticación, Gestión de Usuarios, Productos, Pedidos, IA, Ventas.

---

## 🚀 Requisitos Previos

Asegúrate de tener instalados los siguientes componentes antes de iniciar el proyecto:
- [Node.js](https://nodejs.org/) (versión recomendada LTS)
- [Python 3.9+](https://www.python.org/downloads/)
- [Git](https://git-scm.com/)

---

## ⚙️ Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <https://github.com/Remolachon/DesignForge-AI-Proyecto-Software-1.git>
cd DesignForge-AI-Proyecto-Software-1
```

### 2. Configurar el Frontend

Navega a la carpeta del frontend y ejecuta la instalación de dependencias:

```bash
cd frontend
npm install
```

Para levantar el entorno de desarrollo del frontend:

```bash
npm run dev
```
La aplicación web estará disponible en `http://localhost:3000`.

### 3. Configurar el Backend

Abre una nueva terminal, navega a la carpeta del backend y crea un entorno virtual (opcional pero recomendado):

```bash
cd backend
python -m venv venv
# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate
```

Instala las dependencias y corre el servidor de desarrollo:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```
La API estará disponible en `http://localhost:8000`. Puedes consultar la documentación interactiva (Swagger) en `http://localhost:8000/docs`.

---

## 📚 Documentación

La carpeta `/docs` contiene los recursos más importantes sobre la arquitectura y la toma de decisiones:
- **DOCUMENTACIÓN TÉCNICA — MÓDULO MARKETPLACE.pdf:** Detalles profundos sobre los módulos del marketplace.
- **Requisitos y casos de uso.pdf:** Funcionalidades detalladas que definen la plataforma.
- **planeacion proyecto.pdf:** Hitos de desarrollo.
- **Supabase/:** Archivos de configuración de la base de datos.

## 🤝 Contribuciones

Si deseas contribuir a este proyecto, por favor crea una rama para tu feature o bugfix:
```bash
git checkout -b feature/mi-nueva-funcionalidad
```
Realiza tus cambios y genera un Pull Request.

---

**© 2026 DesignForge-AI Team** - Proyecto de Arquitectura de Software.