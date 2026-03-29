"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ProductType } from "@/types/types";

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface State {
  currentStep: WizardStep;
  productType: ProductType | null;
  uploadedImage: string | null;
}

const STORAGE_KEY = "crear-pedido";

export function useCrearPedido() {
  
  const [state, setState] = useState<State>(() => {
    if (typeof window === "undefined") {
      return {
        currentStep: 1,
        productType: null,
        uploadedImage: null,
      };
    }

    const saved = localStorage.getItem(STORAGE_KEY);

    return saved
      ? JSON.parse(saved)
      : {
          currentStep: 1,
          productType: null,
          uploadedImage: null,
        };
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // -------------------------
  // Actions
  // -------------------------

  const setProductType = (type: ProductType) => {
    setState((prev) => ({
      ...prev,
      productType: type,
      uploadedImage: null, // limpia imagen
    }));
  };

  const setUploadedImage = (img: string) => {
    setState((prev) => ({ ...prev, uploadedImage: img }));
  };

  const nextStep = () => {
    setState((prev) => ({
      ...prev,
      currentStep: (prev.currentStep + 1) as WizardStep,
    }));
  };

  const prevStep = () => {
    setState((prev) => ({
      ...prev,
      currentStep: (prev.currentStep - 1) as WizardStep,
    }));
  };

  const canProceed = () => {
    switch (state.currentStep) {
      case 1:
        return state.productType !== null;
      case 2:
        return state.uploadedImage !== null;
      default:
        return true;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Máximo 10 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      toast.success("Imagen cargada");
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      currentStep: 1,
      productType: null,
      uploadedImage: null,
    });
  };

  return {
    ...state,
    loading,
    setProductType,
    handleFileUpload,
    nextStep,
    prevStep,
    canProceed,
    reset,
    setLoading,
  };
}