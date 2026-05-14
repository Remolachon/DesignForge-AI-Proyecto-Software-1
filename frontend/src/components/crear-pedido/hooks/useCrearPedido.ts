"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ProductType } from "@/types/types";

type WizardStep = 1 | 2 | 3 | 4;

interface State {
  currentStep: WizardStep;
  productType: ProductType | null;
  uploadedImage: string | null; // 🔥 ahora será URL (no base64)
  generatedImages: string[]; // URLs de imágenes generadas con IA
  selectedGeneratedImage: string | null; // Imagen seleccionada
}

const STORAGE_KEY = "crear-pedido";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const initialState: State = {
  currentStep: 1,
  productType: null,
  uploadedImage: null,
  generatedImages: [],
  selectedGeneratedImage: null,
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
  const latestUploadedImageRef = useRef<string | null>(initialState.uploadedImage);

  useEffect(() => {
    if (!restoreDraft) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [restoreDraft]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // 🔹 PRODUCT TYPE
  const setProductType = (type: ProductType) => {
    setState((prev) => ({
      ...prev,
      productType: type,
      uploadedImage: null,
      generatedImages: [],
      selectedGeneratedImage: null,
    }));
  };

  // 🔹 SET IMAGE DIRECT (para quitar imagen)
  const setUploadedImage = (img: string | null) => {
    latestUploadedImageRef.current = img;
    setState((prev) => ({
      ...prev,
      uploadedImage: img,
      generatedImages: [],
      selectedGeneratedImage: null,
    }));
  };

  const setSelectedGeneratedImage = (image: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedGeneratedImage: image,
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
      const res = await fetch(`${API_URL}/upload-image`, {
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
      latestUploadedImageRef.current = imageUrl;

      toast.success("Imagen subida correctamente");
    } catch (error) {
      toast.error("Error subiendo imagen");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 GENERAR IMÁGENES CON IA
  const generateAIImages = useCallback(async (style: string, reset = false, sourceImageUrl?: string) => {
    const referenceImageUrl = sourceImageUrl || latestUploadedImageRef.current || state.uploadedImage;

    if (!referenceImageUrl) {
      toast.error("Primero sube una imagen");
      return;
    }

    try {
      setLoading(true);

      if (reset) {
        setState((prev) => ({
          ...prev,
          generatedImages: [],
          selectedGeneratedImage: null,
        }));
      }

      const response = await fetch(referenceImageUrl, {
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error("No se pudo descargar la imagen subida");
      }

      const blob = await response.blob();
      const file = new File([blob], "uploaded.png", {
        type: response.type || "image/png",
      });

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/generate-preview?style=${encodeURIComponent(
        style
      )}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error generando imagen");
      }

      const data = await res.json();
      const generatedUrl = data.preview_url;

      setState((prev) => {
        const nextImages = reset
          ? [generatedUrl]
          : [...prev.generatedImages, generatedUrl].slice(-3);

        return {
          ...prev,
          generatedImages: nextImages,
          selectedGeneratedImage: reset ? generatedUrl : prev.selectedGeneratedImage || generatedUrl,
        };
      });

      toast.success("Imagen generada con IA");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error generando imagen";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [state.uploadedImage]);

  const resetGeneratedImages = () => {
    setState((prev) => ({
      ...prev,
      generatedImages: [],
      selectedGeneratedImage: null,
    }));
  };

  const nextStep = () => {
    setState((prev) => {
      if (prev.currentStep === 3) {
        return { ...prev, currentStep: 4 };
      }

      return {
        ...prev,
        currentStep: (prev.currentStep + 1) as WizardStep,
      };
    });
  };

  const prevStep = () => {
    setState((prev) => {
      if (prev.currentStep === 4) {
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
        return state.selectedGeneratedImage !== null;
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
    setUploadedImage, // 🔥 EXPORTADO
    generateAIImages,
    resetGeneratedImages,

    setSelectedGeneratedImage,
  };
}