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
# ▶️ Ejecución del Frontend

1. Activar el entorno virtual:
   ```bash
   venv\Scripts\activate
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   uvicorn app.main:app --reload
   ```

Una vez iniciado, el proyecto estará disponible en el navegador según la configuración mostrada en la terminal.

---

## 🌿 Estructura de ramas

Este repositorio utiliza el siguiente esquema de ramas:

- **main**  
  Rama estable.  
  Se mantiene limpia y solo recibe cambios cuando el código es considerado estable o entregable.

- **develop**  
  Rama de desarrollo activo.  
  Contiene el estado actual del proyecto y el trabajo en curso.

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
- De nuevo, la rama sobre la que se trabaja es **develop** bajo ninguna circunstancia se ejecutan commits directos a la rama main.
