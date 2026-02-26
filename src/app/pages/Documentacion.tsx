import { Layout } from '../components/Layout';
import { Card } from '../components/Card';

export default function Documentacion() {
  return (
    <Layout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-semibold text-primary mb-2">
            Documentación del Sistema
          </h1>
          <p className="text-muted-foreground">
            Especificaciones técnicas y mapa de trazabilidad
          </p>
        </div>

        {/* Tokens de Color */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Tokens de Color</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ColorToken name="Primary" color="#0B213F" />
            <ColorToken name="Accent (Neon Cyan)" color="#00E5C2" />
            <ColorToken name="Accent Magenta" color="#FF2D95" />
            <ColorToken name="Gray 900" color="#1a1a1a" />
            <ColorToken name="Gray 700" color="#4a4a4a" />
            <ColorToken name="Gray 400" color="#9ca3af" />
            <ColorToken name="Gray 100" color="#f3f4f6" />
            <ColorToken name="Success" color="#10b981" />
            <ColorToken name="Warning" color="#f59e0b" />
            <ColorToken name="Error" color="#d4183d" />
          </div>
        </Card>

        {/* Tipografías */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Tipografías</h2>
          <div className="space-y-4">
            <div>
              <h1>H1 - Título Principal</h1>
              <p className="text-sm text-muted-foreground">32px, Font Weight: 500</p>
            </div>
            <div>
              <h2>H2 - Título Secundario</h2>
              <p className="text-sm text-muted-foreground">24px, Font Weight: 500</p>
            </div>
            <div>
              <h3>H3 - Título Terciario</h3>
              <p className="text-sm text-muted-foreground">20px, Font Weight: 500</p>
            </div>
            <div>
              <p>Body - Texto normal</p>
              <p className="text-sm text-muted-foreground">16px, Font Weight: 400</p>
            </div>
            <div>
              <p className="text-sm">Small - Texto pequeño</p>
              <p className="text-sm text-muted-foreground">14px, Font Weight: 400</p>
            </div>
          </div>
        </Card>

        {/* Mapa de Trazabilidad */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">
            Mapa de Trazabilidad: Casos de Uso → Pantallas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left">
                  <th className="py-3 px-4 font-semibold">Caso de Uso</th>
                  <th className="py-3 px-4 font-semibold">Pantalla(s)</th>
                  <th className="py-3 px-4 font-semibold">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <TraceRow cu="CU01 - Registro de usuarios" pantalla="Auth: Registro" rol="Todos" />
                <TraceRow cu="CU02 - Inicio de sesión" pantalla="Auth: Login" rol="Todos" />
                <TraceRow cu="CU03 - Gestión roles y permisos" pantalla="Admin: Gestión de roles" rol="Admin" />
                <TraceRow cu="CU04 - Recuperar contraseña" pantalla="Auth: Recuperar contraseña" rol="Todos" />
                <TraceRow cu="CU05 - Crear pedido personalizado" pantalla="Wizard Crear Pedido (5 pasos)" rol="Cliente" />
                <TraceRow cu="CU06 - Carga de imágenes" pantalla="Wizard: Step 2 Upload" rol="Cliente" />
                <TraceRow cu="CU07 - Generación IA" pantalla="Wizard: Step 3 Resultados IA" rol="Cliente" />
                <TraceRow cu="CU08 - Visualización 3D" pantalla="Wizard: Step 4 Editor 3D" rol="Cliente" />
                <TraceRow cu="CU09 - Edición interactiva" pantalla="Editor 3D (panel propiedades)" rol="Cliente" />
                <TraceRow cu="CU10 - Cálculo precio" pantalla="Wizard: Step 5 Resumen" rol="Cliente" />
                <TraceRow cu="CU11 - Confirmación pedido" pantalla="Checkout / Confirmation" rol="Cliente" />
                <TraceRow cu="CU12 - Gestión estado pedido" pantalla="Funcionario: Lista Pedidos" rol="Funcionario" />
                <TraceRow cu="CU13 - Organización horarios" pantalla="Funcionario: Calendario" rol="Funcionario" />
                <TraceRow cu="CU14 - Historial pedidos" pantalla="Cliente: Mis Pedidos" rol="Cliente" />
                <TraceRow cu="CU15 - Marketplace" pantalla="Marketplace (listado + detalle)" rol="Todos" />
                <TraceRow cu="CU16 - Gestión marketplace" pantalla="Funcionario: CRUD Marketplace" rol="Funcionario" />
                <TraceRow cu="CU17 - Valoración productos" pantalla="Marketplace: Detalle producto" rol="Cliente" />
                <TraceRow cu="CU18 - Panel administrativo" pantalla="Admin: Dashboard" rol="Admin" />
                <TraceRow cu="CU19 - Notificaciones" pantalla="Header + Centro notificaciones" rol="Todos" />
              </tbody>
            </table>
          </div>
        </Card>

        {/* Componentes del Sistema */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Componentes Reutilizables</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• <strong>Button:</strong> Primary, Secondary, Tertiary, Destructive</li>
            <li>• <strong>Input:</strong> Text, Email, Password con labels y validación</li>
            <li>• <strong>Card:</strong> Contenedor básico con hover opcional</li>
            <li>• <strong>Badge:</strong> Estados de pedidos y etiquetas</li>
            <li>• <strong>Layout:</strong> Header con navegación y user menu</li>
            <li>• <strong>Modal:</strong> Confirmaciones y diálogos</li>
            <li>• <strong>Toast:</strong> Notificaciones temporales (Sonner)</li>
          </ul>
        </Card>

        {/* Breakpoints */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Breakpoints Responsive</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>• <strong>Mobile:</strong> 375px</p>
            <p>• <strong>Tablet:</strong> 768px</p>
            <p>• <strong>Desktop:</strong> 1440px</p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

function ColorToken({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-12 h-12 rounded-lg border border-border shadow-sm"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground">{color}</p>
      </div>
    </div>
  );
}

function TraceRow({ cu, pantalla, rol }: { cu: string; pantalla: string; rol: string }) {
  return (
    <tr>
      <td className="py-3 px-4">{cu}</td>
      <td className="py-3 px-4">{pantalla}</td>
      <td className="py-3 px-4">
        <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">
          {rol}
        </span>
      </td>
    </tr>
  );
}
