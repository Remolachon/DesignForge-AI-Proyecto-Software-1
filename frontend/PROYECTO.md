# LukArt - Plataforma de Productos Personalizados

## 📋 Descripción del Proyecto

LukArt es una plataforma web completa que permite a clientes diseñar, personalizar y ordenar productos personalizados (bordados, letreros neon-flex y productos acrílicos) con generación de diseños por IA, visualización 3D interactiva, y un sistema completo de gestión de producción.

## 🎯 Funcionalidades Principales

### Para Clientes
- ✨ **Creación de Pedidos con IA**: Wizard de 5 pasos con upload de imagen, generación de variantes con IA, y editor 3D
- 🛍️ **Marketplace**: Catálogo de productos pre-diseñados listos para comprar
- 📦 **Gestión de Pedidos**: Historial completo con timeline de estados
- 👤 **Autenticación**: Login, registro y recuperación de contraseña

### Para Funcionarios/Staff
- 📊 **Dashboard de Producción**: Vista general de pedidos activos
- 📋 **Gestión de Pedidos**: Lista completa con filtros y actualización de estados
- 📅 **Calendario de Producción**: Vista semanal/diaria para organizar entregas
- 🏪 **Gestión de Marketplace**: CRUD de productos

### Para Administradores
- 👥 **Gestión de Usuarios y Roles**
- 📈 **Reportes y Métricas**
- ⚙️ **Configuración del Sistema**

## 🎨 Sistema de Diseño

### Colores
- **Primary**: `#0B213F` (azul oscuro profesional)
- **Accent Cyan**: `#00E5C2` (neon cyan para CTAs y simulación)
- **Accent Magenta**: `#FF2D95` (neon magenta)
- **Grays**: `#1a1a1a`, `#4a4a4a`, `#9ca3af`, `#f3f4f6`
- **Success**: `#10b981`
- **Warning**: `#f59e0b`
- **Error**: `#d4183d`

### Tipografías
- **H1**: 32px, Font Weight 500
- **H2**: 24px, Font Weight 500
- **H3**: 20px, Font Weight 500
- **Body**: 16px, Font Weight 400
- **Small**: 14px, Font Weight 400

### Componentes Reutilizables
- **Button**: Primary, Secondary, Tertiary, Destructive
- **Input**: Con labels y validación
- **Card**: Contenedor con hover opcional
- **Badge**: Para estados de pedidos
- **Layout**: Header con navegación responsive

## 🗺️ Estructura de Rutas

```
/                          → Landing Page
/login                     → Inicio de sesión
/register                  → Registro de usuarios
/recuperar-contrasena      → Recuperación de contraseña
/marketplace               → Marketplace público
/documentacion             → Documentación técnica

/cliente/
  └─ dashboard             → Dashboard del cliente
  └─ crear-pedido          → Wizard de creación (5 pasos)
  └─ pedidos               → Historial de pedidos

/funcionario/
  └─ dashboard             → Dashboard de producción
  └─ pedidos               → Lista y gestión de pedidos
  └─ calendario            → Calendario de producción
  └─ marketplace           → Gestión de productos

/admin/
  └─ dashboard             → Panel administrativo
```

## 📊 Mapa de Trazabilidad (Casos de Uso → Pantallas)

| Caso de Uso | Pantalla(s) | Rol |
|------------|-------------|-----|
| CU01 - Registro de usuarios | Auth: Registro | Todos |
| CU02 - Inicio de sesión | Auth: Login | Todos |
| CU04 - Recuperar contraseña | Auth: Recuperar contraseña | Todos |
| CU05 - Crear pedido personalizado | Wizard Crear Pedido (5 pasos) | Cliente |
| CU06 - Carga de imágenes | Wizard: Step 2 Upload | Cliente |
| CU07 - Generación IA | Wizard: Step 3 Resultados IA | Cliente |
| CU08 - Visualización 3D | Wizard: Step 4 Editor 3D | Cliente |
| CU09 - Edición interactiva | Editor 3D (panel propiedades) | Cliente |
| CU10 - Cálculo precio | Wizard: Step 5 Resumen | Cliente |
| CU11 - Confirmación pedido | Checkout / Confirmation | Cliente |
| CU12 - Gestión estado pedido | Funcionario: Lista Pedidos | Funcionario |
| CU13 - Organización horarios | Funcionario: Calendario | Funcionario |
| CU14 - Historial pedidos | Cliente: Mis Pedidos | Cliente |
| CU15 - Marketplace | Marketplace (listado + detalle) | Todos |
| CU16 - Gestión marketplace | Funcionario: CRUD Marketplace | Funcionario |
| CU19 - Notificaciones | Header + Centro notificaciones | Todos |

## 🚀 Tecnologías Utilizadas

- **React 18.3** con TypeScript
- **React Router 7** para navegación multi-página
- **Tailwind CSS v4** para estilos
- **Motion (Framer Motion)** para animaciones
- **Lucide React** para iconografía
- **Sonner** para notificaciones toast
- **Recharts** para gráficas y reportes
- **date-fns** para manejo de fechas
- **React DnD** para drag & drop

## 👥 Cuentas de Prueba

Para probar diferentes roles, usa estos correos en el login:

**Cliente**:
- Email: `cliente@test.com`
- Password: cualquier contraseña

**Funcionario/Staff**:
- Email: `funcionario@test.com`
- Password: cualquier contraseña

**Admin**:
- Email: `admin@test.com`
- Password: cualquier contraseña

> 💡 El rol se determina automáticamente según el email para fines de demostración

## 📱 Responsive Design

La aplicación es completamente responsive con breakpoints:
- **Mobile**: 375px
- **Tablet**: 768px  
- **Desktop**: 1440px

## 🎭 Wizard de Crear Pedido (5 Pasos)

1. **Seleccionar Tipo de Producto**: Bordado, Neon Flex o Acrílico
2. **Upload de Imagen**: Drag & drop con validación (max 10MB)
3. **Resultados IA**: Selección entre 3 variantes generadas
4. **Editor 3D**: Personalización de colores, tamaño y materiales con visor 3D
5. **Resumen y Confirmación**: Cálculo de precio dinámico y confirmación final

## 📦 Tipos de Productos

- **Bordado**: Logos y diseños bordados para uniformes
- **Neon Flex**: Letreros luminosos modernos
- **Acrílico**: Placas y letreros acrílicos premium

## 🔄 Estados de Pedidos

- 🔵 **En diseño**: Pedido recién creado, pendiente de revisión
- 🟡 **En producción**: Pedido en proceso de fabricación
- 🟢 **Listo para entrega**: Pedido terminado
- ⚪ **Entregado**: Pedido completado y entregado

## 🎨 Estética y Filosofía de Diseño

- **Limpia y profesional** con toques tech
- **Acento neon** usado estratégicamente para CTAs y simulaciones
- **Iconografía lineal** con bordes redondeados
- **Fotografías reales** de productos con fondo neutro
- **Balance entre artesanía y tecnología**

## 📚 Documentación Técnica

Visita `/documentacion` en la aplicación para ver:
- Tokens de color completos
- Guía de tipografías
- Mapa de trazabilidad detallado
- Lista de componentes reutilizables
- Breakpoints responsive

## 🔮 Próximas Funcionalidades (Pendientes)

- [ ] Integración real con generación IA de imágenes
- [ ] Visor 3D interactivo real (Three.js)
- [ ] Sistema de pagos
- [ ] Chat interno entre cliente y funcionario
- [ ] Sistema de valoraciones y reseñas
- [ ] Notificaciones push en tiempo real
- [ ] Panel de analíticas para admin
- [ ] Gestión de inventario
- [ ] Sistema de envíos y tracking
- [ ] Multi-idioma (i18n)

## 💡 Notas de Implementación

- Los datos son **mock/simulados** para demostración
- La "generación IA" es simulada (placeholders)
- El visor 3D es un placeholder con controles de ejemplo
- Las notificaciones son locales (no persisten)
- Sin backend real - todo funciona en frontend

## 🎯 Accesibilidad

- Contraste mínimo WCAG AA
- Tamaño de botones 44x44px (touch targets)
- Navegación por teclado soportada
- Labels semánticas en formularios
- Estados de loading y error claros

---

**LukArt** - Donde tu imaginación se encuentra con nuestra artesanía ✨
