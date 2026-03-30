"use client";

import { useRouter } from "next/navigation";
import { useCrearPedido } from "@/components/crear-pedido/hooks/useCrearPedido";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Sparkles,
  Settings,
  CheckCircle,
  Loader2,
} from "lucide-react";

import { toast } from "sonner";

import Step1ProductType from "@/components/crear-pedido/steps/Step1ProductType";
import Step2Upload from "@/components/crear-pedido/steps/Step2Upload";
import Step3AIResults from "@/components/crear-pedido/steps/Step3AIResults"; // Nuevo paso para mostrar resultados de IA, no entra en el MVP pero se deja preparado para el futuro
//import Step5Confirm from "@/components/dashboard/crear-pedido/steps/Step4Confirm"; // Paso de confirmación final, no entra en el MVP pero se deja preparado para el futuro
import Step5Confirm from "@/components/crear-pedido/steps/Step5Confirm";

export default function CrearPedido() {
  const router = useRouter();

  const {
    currentStep,
    productType,
    uploadedImage,
    selectedVariant, 
    loading,
    setProductType,
    handleFileUpload,
    nextStep,
    prevStep,
    canProceed,
    setLoading,
    setSelectedVariant,
  } = useCrearPedido();

  // placeholder temporal solo para saltar el step 4 que no esta en uso y no entra en el MVP, se deja preparado para el futuro
  const designSettings = {
    color: "#00E5C2",
    size: "medium",
    material: "standard",
  } as const;

  const steps = [
    { number: 1, title: "Tipo de Producto", icon: Settings },
    { number: 2, title: "Subir Imagen", icon: Upload },
    { number: 3, title: "Resultados IA", icon: Sparkles },
    { number: 4, title: "Confirmar", icon: CheckCircle },
  ];

  const handleConfirmOrder = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success("¡Pedido creado exitosamente!");
    router.push("/cliente/dashboard");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-accent text-white"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <span
                    className={`mt-2 text-xs text-center hidden sm:block ${
                      isActive ? "font-semibold" : ""
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step.number
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {currentStep === 1 && (
          <Step1ProductType
            productType={productType}
            setProductType={setProductType}
          />
        )}

        {currentStep === 2 && (
          <Step2Upload
            uploadedImage={uploadedImage}
            handleFileUpload={handleFileUpload}
          />
        )}

        {currentStep === 3 && (
          <Step3AIResults
            selectedVariant={selectedVariant}
            setSelectedVariant={setSelectedVariant}
            uploadedImage={uploadedImage}
          />
        )}

        {currentStep === 5 && (
          <Step5Confirm
            productType={productType}
            designSettings={designSettings}
          />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="secondary"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-5 h-5" />
          Anterior
        </Button>

        {currentStep < 5 ? (
          <Button onClick={nextStep} disabled={!canProceed()}>
            Siguiente
            <ChevronRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button onClick={handleConfirmOrder} disabled={loading}>
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Confirmar Pedido
          </Button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   🚀 FUTURAS MEJORAS / FEATURES PENDIENTES

   Este componente actualmente implementa un flujo simplificado:
   1 → Tipo de producto
   2 → Subir imagen
   3 → Selección de variante (simulada)
   5 → Confirmación

   ⚠️ Step 4 (Editor 3D) está temporalmente deshabilitado.

   ---------------------------------------------------------
   🧩 FEATURES PENDIENTES
   ---------------------------------------------------------

   🔹 STEP 3 - RESULTADOS IA (ACTUALMENTE MOCK)
   - Actualmente las variantes (1, 2, 3) son simuladas.
   - Futuro:
     • Integrar generación real con IA
     • Consumir endpoint backend (Stable Diffusion / OpenAI / etc.)
     • Mostrar previews reales de variantes

   ---------------------------------------------------------

   🔹 STEP 4 - EDITOR 3D (DESHABILITADO)
   - Aún no se ha definido si será parte del producto final.
   - Posible implementación futura:
     • Three.js / React Three Fiber
     • Configuración de materiales, tamaños y colores
     • Preview interactivo

   ---------------------------------------------------------

   🔹 STEP 5 - CONFIGURACIÓN REAL
   - Actualmente usa `designSettings` hardcodeado:
     {
       color: "#00E5C2",
       size: "medium",
       material: "standard"
     }

   - Futuro:
     • Conectar con Step 4 (si se implementa)
     • Permitir personalización real del usuario

   ---------------------------------------------------------

   🔹 SUBIDA DE IMÁGENES (IMPORTANTE)
   - Actualmente:
     • Se usa base64 (FileReader)
     • Se guarda en localStorage

   - Futuro (CRÍTICO):
     • Subir imágenes a Supabase Storage
     • Obtener URL pública
     • Guardar solo la URL en el estado
     • Mejorar rendimiento y escalabilidad

   ---------------------------------------------------------

   🔹 PERSISTENCIA / BACKEND
   - Actualmente:
     • Estado guardado en localStorage

   - Futuro:
     • Guardar pedidos en base de datos (Supabase)
     • Asociar pedidos a usuario autenticado
     • Manejar estados de pedido (pendiente, en producción, etc.)

   ---------------------------------------------------------

   🔹 VALIDACIONES
   - Pendiente:
     • Validar tipo de archivo (SVG, PNG, etc.)
     • Manejar errores de subida
     • Feedback visual más robusto

   ---------------------------------------------------------

   🔹 UX / MEJORAS VISUALES
   - Posibles mejoras:
     • Skeleton loaders en Step 3 (IA)
     • Drag & drop real en Step 2
     • Animaciones entre steps
     • Mejor feedback de selección

   ========================================================= */