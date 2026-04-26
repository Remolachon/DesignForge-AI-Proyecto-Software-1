"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
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
import { paymentService } from "@/services/payment.service";

import Step1ProductType from "@/components/crear-pedido/steps/Step1ProductType";
import Step2Upload from "@/components/crear-pedido/steps/Step2Upload";
import Step3AIResults from "@/components/crear-pedido/steps/Step3AIResults";
import Step5Confirm from "@/components/crear-pedido/steps/Step5Confirm";

export default function CrearPedido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restoreDraft = searchParams.get("resume") === "1";

  const getDashboardByRole = (role: string | null) => {
    const normalizedRole = (role || "").toLowerCase().trim();

    if (normalizedRole === "funcionario") {
      return "/funcionario/dashboard";
    }

    return "/cliente/dashboard";
  };

  // 🔥 FIX navegación hacia atrás (evita bug)
  useEffect(() => {
    const handlePopState = () => {
      window.location.reload();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

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
    reset,
    setUploadedImage,
  } = useCrearPedido({ restoreDraft });

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

  // ✅ FUNCIÓN CORRECTA
  const handleConfirmOrder = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      // 🚨 SI NO ESTÁ LOGUEADO
      if (!token) {
        localStorage.setItem(
          "redirect_after_login",
          "/cliente/crear-pedido?resume=1"
        );

        toast.error("Debes iniciar sesión");

        router.push("/login");
        return;
      }

      if (!productType) {
        toast.error("Selecciona un tipo de producto");
        return;
      }

      const result = await paymentService.createCustomOrder({
        product_type: productType,
        image_url: uploadedImage,
        size: designSettings.size,
        material: designSettings.material,
        color: designSettings.color,
      });

      if (!result.payment_url) {
        throw new Error("No se pudo iniciar el pago con PayU");
      }

      if (result.payment_action_url && result.payment_payload) {
        sessionStorage.setItem(
          `payu_payload_${result.order_id}`,
          JSON.stringify({
            actionUrl: result.payment_action_url,
            payload: result.payment_payload,
          })
        );
      }

      // 🔥 LIMPIAR TODO
      reset();

      toast.success("Pedido creado. Continúa al checkout seguro.");
      router.push(`/pagos/checkout?orderId=${result.order_id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear pedido";

      if (message === "AUTH_REQUIRED" || message === "SESSION_EXPIRED") {
        localStorage.setItem("redirect_after_login", "/cliente/crear-pedido?resume=1");
        toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
        router.push("/login");
        return;
      }

      toast.error(message || "Error al crear pedido");
    } finally {
      setLoading(false);
    }
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
            setUploadedImage={setUploadedImage}
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