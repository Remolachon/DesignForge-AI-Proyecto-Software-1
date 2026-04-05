"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ProductType } from "@/types/types";

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface State {
  currentStep: WizardStep;
  productType: ProductType | null;
  uploadedImage: string | null; // 🔥 ahora será URL (no base64)
  selectedVariant: number | null;
}

const STORAGE_KEY = "crear-pedido";

const initialState: State = {
  currentStep: 1,
  productType: null,
  uploadedImage: null,
  selectedVariant: null,
};

export function useCrearPedido({
  restoreDraft = false,
}: {
  restoreDraft?: boolean;
} = {}) {
  const [state, setState] = useState<State>(() => {
    if (typeof window === "undefined" || !restoreDraft) return initialState;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return initialState;

      const parsed = JSON.parse(saved);

      return {
        ...initialState,
        ...parsed,
      };
    } catch {
      return initialState;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restoreDraft) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [restoreDraft]);

  useEffect(() => {
    console.log("uploadedImage:", state.uploadedImage); // 🔥 AQUÍ

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // 🔹 PRODUCT TYPE
  const setProductType = (type: ProductType) => {
    setState((prev) => ({
      ...prev,
      productType: type,
      uploadedImage: null,
      selectedVariant: null,
    }));
  };

  // 🔹 SET IMAGE DIRECT (para quitar imagen)
  const setUploadedImage = (img: string | null) => {
    setState((prev) => ({
      ...prev,
      uploadedImage: img,
      selectedVariant: null,
    }));
  };

  // 🔹 VARIANT
  const setSelectedVariant = (variant: number) => {
    setState((prev) => ({
      ...prev,
      selectedVariant: variant,
    }));
  };

  // 🔥 SUBIDA REAL A SUPABASE STORAGE
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Máximo 10 MB");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      // 🔥 SIN TOKEN → subida pública o con service role backend
      const res = await fetch("http://localhost:8000/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      console.log("RESPUESTA BACK:", data); // 🔥 DEBUG CLAVE

      // 🔥 soporta distintos formatos del backend
      const imageUrl = data.url || data.image_url || data.publicUrl;

      if (!imageUrl) {
        throw new Error("No llegó URL de imagen");
      }

      setUploadedImage(imageUrl);

      toast.success("Imagen subida correctamente");
    } catch (error) {
      toast.error("Error subiendo imagen");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setState((prev) => {
      if (prev.currentStep === 3) {
        return { ...prev, currentStep: 5 };
      }

      return {
        ...prev,
        currentStep: (prev.currentStep + 1) as WizardStep,
      };
    });
  };

  const prevStep = () => {
    setState((prev) => {
      if (prev.currentStep === 5) {
        return { ...prev, currentStep: 3 };
      }

      return {
        ...prev,
        currentStep: (prev.currentStep - 1) as WizardStep,
      };
    });
  };

  const canProceed = () => {
    switch (state.currentStep) {
      case 1:
        return state.productType !== null;
      case 2:
        return state.uploadedImage !== null;
      case 3:
        return state.selectedVariant !== null;
      default:
        return true;
    }
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
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
    setSelectedVariant,
    setUploadedImage, // 🔥 EXPORTADO
  };
}