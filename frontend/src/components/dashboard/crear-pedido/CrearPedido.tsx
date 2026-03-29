"use client";

import { useRouter } from "next/navigation";
import { useCrearPedido } from "@/components/dashboard/crear-pedido/hooks/useCrearPedido";

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

import Step1ProductType from "@/components/dashboard/crear-pedido/Step1ProductType";
import Step2Upload from "@/components/dashboard/crear-pedido/Step2Upload";

export default function CrearPedido() {
  const router = useRouter();

  const {
    currentStep,
    productType,
    uploadedImage,
    loading,
    setProductType,
    handleFileUpload,
    nextStep,
    prevStep,
    canProceed,
    setLoading,
  } = useCrearPedido();

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