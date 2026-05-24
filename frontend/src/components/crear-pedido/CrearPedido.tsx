"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import Step5Confirm from "./steps/Step5Confirm";

export default function CrearPedido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restoreDraft = searchParams.get("resume") === "1";

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

  const [isStep5Valid, setIsStep5Valid] = useState(false);
  const {
    currentStep,
    productType,
    quantity,
    uploadedImage,
    loading,
    setProductType,
    setQuantity,
    handleFileUpload,
    nextStep,
    prevStep,
    canProceed,
    setLoading,
    reset,
    setUploadedImage,
    generatedImages,
    selectedGeneratedImage,
    generateAIImages,
    resetGeneratedImages,
    setSelectedGeneratedImage,
    selectedShapeId,
    selectedShapeName,
    shapeAttributes,
    shapeAttributeValues,
    setSelectedShape,
    setShapeAttributes,
    setShapeAttributeValues,
  } = useCrearPedido({ restoreDraft });



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
        localStorage.setItem("redirect_after_login", "/cliente/crear-pedido?resume=1");
        toast.error("Debes iniciar sesión");
        router.replace("/login");
        return;
      }

      if (!productType) {
        toast.error("Selecciona un tipo de producto");
        return;
      }

      if (!selectedShapeId || !selectedShapeName) {
        toast.error("Selecciona un shape para continuar");
        return;
      }

      const attributesPayload: Record<string, { label: string; value: string }> = {};
      for (const attr of shapeAttributes) {
        const value = shapeAttributeValues[attr.code];
        if (value !== undefined && value !== null && String(value).trim()) {
          attributesPayload[attr.code] = { label: attr.label, value: String(value).trim() };
        }
      }

      await paymentService.createCustomOrder({
        product_type: productType,
        image_url: selectedGeneratedImage || uploadedImage,
        quantity,
        shape_id: selectedShapeId,
        shape_name: selectedShapeName,
        attributes: attributesPayload,
      });

      // 🔥 LIMPIAR TODO
      reset();

      toast.success("Pedido creado. Quedará pendiente hasta que una empresa lo acepte.");
      router.push("/cliente/pedidos");
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
      <div className="mb-12 sm:mb-16 relative w-full pt-2">
        {/* Línea de fondo */}
        <div className="absolute top-8 left-6 right-6 sm:left-10 sm:right-10 h-1 bg-gray-200 -z-10 rounded">
          <div
            className="h-full bg-green-500 transition-all duration-300 rounded"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        <div className="flex justify-between w-full">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div key={step.number} className="flex flex-col items-center relative w-12 sm:w-20">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-background transition-all shrink-0 ${
                    isActive
                      ? "bg-accent text-primary-foreground"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span
                  className={`mt-2 text-[10px] sm:text-xs text-center hidden sm:block absolute top-14 w-24 sm:w-32 ${
                    isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
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
            productType={productType}
            uploadedImage={uploadedImage}
            generatedImages={generatedImages}
            selectedGeneratedImage={selectedGeneratedImage}
            setSelectedGeneratedImage={setSelectedGeneratedImage}
            generateAIImages={generateAIImages}
            resetGeneratedImages={resetGeneratedImages}
            loading={loading}
          />
        )}

        {currentStep === 4 && (
          <Step5Confirm
            productType={productType}
            quantity={quantity}
            setQuantity={setQuantity}
            image={selectedGeneratedImage || uploadedImage}
            selectedShapeId={selectedShapeId}
            selectedShapeName={selectedShapeName}
            shapeAttributes={shapeAttributes}
            shapeAttributeValues={shapeAttributeValues}
            setSelectedShape={setSelectedShape}
            setShapeAttributes={setShapeAttributes}
            setShapeAttributeValues={setShapeAttributeValues}
            onValidationChange={setIsStep5Valid}
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

        {currentStep < 4 ? (
          <Button onClick={nextStep} disabled={!canProceed()}>
            Siguiente
            <ChevronRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button onClick={handleConfirmOrder} disabled={loading || !isStep5Valid}>
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Enviar solicitud
          </Button>
        )}
      </div>
    </div>
  );
}