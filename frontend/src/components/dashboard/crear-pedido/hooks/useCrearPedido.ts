"use client";

/* =========================================================
   🧠 HOOK: useCrearPedido
   ---------------------------------------------------------
   Este hook maneja TODA la lógica del flujo de creación
   de pedidos (wizard multi-step).

   ✔ Controla navegación entre pasos
   ✔ Maneja estado global del flujo
   ✔ Persiste datos en localStorage (temporal)
   ✔ Maneja subida de imagen (base64 - temporal)

   ⚠️ IMPORTANTE:
   Este hook actualmente es SOLO FRONTEND (MVP)
   NO está conectado a backend ni a Supabase aún.

   ========================================================= */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ProductType } from "@/types/types";

/* =========================================================
   🔢 TIPOS DE STEPS
   ---------------------------------------------------------
   Definimos los pasos posibles del wizard.

   ⚠️ Step 4 está definido pero actualmente NO se usa
   (editor 3D pendiente de decisión de producto)
   ========================================================= */
type WizardStep = 1 | 2 | 3 | 4 | 5;

/* =========================================================
   📦 ESTADO GLOBAL DEL WIZARD
   ---------------------------------------------------------
   Aquí guardamos todo lo que el usuario selecciona.
   ========================================================= */
interface State {
  currentStep: WizardStep;

  // Tipo de producto (bordado, acrílico, etc.)
  productType: ProductType | null;

  // Imagen subida por el usuario
  // ⚠️ Actualmente es base64 (NO óptimo para producción)
  uploadedImage: string | null;

  // Variante seleccionada en Step 3 (IA)
  // ⚠️ Actualmente es mock (no hay IA real aún)
  selectedVariant: number | null;
}

/* =========================================================
   💾 STORAGE KEY
   ---------------------------------------------------------
   Clave usada para guardar el estado en localStorage
   ========================================================= */
const STORAGE_KEY = "crear-pedido";

/* =========================================================
   🧱 ESTADO INICIAL
   ---------------------------------------------------------
   Usado como fallback seguro
   ========================================================= */
const initialState: State = {
  currentStep: 1,
  productType: null,
  uploadedImage: null,
  selectedVariant: null,
};

/* =========================================================
   🚀 HOOK PRINCIPAL
   ========================================================= */
export function useCrearPedido() {

  /* =======================================================
     🧠 STATE PRINCIPAL
     -------------------------------------------------------
     Inicializa estado desde localStorage si existe.
     
     ✔ Evita perder progreso si el usuario recarga
     ✔ Usa fallback seguro si hay errores
     ======================================================= */
  const [state, setState] = useState<State>(() => {
    if (typeof window === "undefined") return initialState;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return initialState;

      const parsed = JSON.parse(saved);

      // 🛡️ Protección contra datos incompletos o viejos
      return {
        ...initialState,
        ...parsed,
      };
    } catch {
      return initialState;
    }
  });

  /* =======================================================
     ⏳ LOADING STATE
     -------------------------------------------------------
     Usado para acciones async (ej: confirmar pedido)
     ======================================================= */
  const [loading, setLoading] = useState(false);

  /* =======================================================
     💾 PERSISTENCIA (LOCALSTORAGE)
     -------------------------------------------------------
     Guarda automáticamente el estado en el navegador.

     ⚠️ TEMPORAL:
     En producción esto debe reemplazarse por:
     - Base de datos (Supabase)
     - Backend API
     ======================================================= */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  /* =======================================================
     🎯 ACTIONS (ACCIONES DEL USUARIO)
     ======================================================= */

  /* -------------------------------------------------------
     🧩 Seleccionar tipo de producto
     -------------------------------------------------------
     ✔ Guarda selección
     ✔ Limpia pasos posteriores (flujo correcto)
     ------------------------------------------------------- */
  const setProductType = (type: ProductType) => {
    setState((prev) => ({
      ...prev,
      productType: type,
      uploadedImage: null,
      selectedVariant: null,
    }));
  };

  /* -------------------------------------------------------
     🖼️ Guardar imagen subida
     -------------------------------------------------------
     ✔ Guarda imagen en base64
     ✔ Resetea variantes

     ⚠️ IMPORTANTE:
     Esto es TEMPORAL.

     En producción se debe:
     - Subir a Supabase Storage
     - Guardar URL pública
     ------------------------------------------------------- */
  const setUploadedImage = (img: string) => {
    setState((prev) => ({
      ...prev,
      uploadedImage: img,
      selectedVariant: null,
    }));
  };

  /* -------------------------------------------------------
     ✨ Seleccionar variante IA
     -------------------------------------------------------
     ✔ Guarda selección

     ⚠️ Actualmente:
     - Las variantes son simuladas
     - No hay IA real conectada
     ------------------------------------------------------- */
  const setSelectedVariant = (variant: number) => {
    setState((prev) => ({
      ...prev,
      selectedVariant: variant,
    }));
  };

  /* -------------------------------------------------------
     ➡️ Siguiente paso
     -------------------------------------------------------
     ✔ Maneja navegación del wizard

     🔥 LÓGICA ESPECIAL:
     Saltamos Step 4 (Editor 3D)
     3 → 5 directamente
     ------------------------------------------------------- */
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

  /* -------------------------------------------------------
     ⬅️ Paso anterior
     -------------------------------------------------------
     ✔ Permite retroceder

     🔥 LÓGICA ESPECIAL:
     5 → 3 (saltando Step 4)
     ------------------------------------------------------- */
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

  /* -------------------------------------------------------
     ✅ Validación para avanzar
     -------------------------------------------------------
     Controla si el botón "Siguiente" debe habilitarse
     ------------------------------------------------------- */
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

  /* -------------------------------------------------------
     📤 Subida de archivo (INPUT FILE)
     -------------------------------------------------------
     ✔ Valida tamaño
     ✔ Convierte a base64
     ✔ Guarda en estado

     ⚠️ TEMPORAL:
     Debe reemplazarse por subida real a Supabase
     ------------------------------------------------------- */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tamaño (10MB)
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

  /* -------------------------------------------------------
     🔄 Reset completo
     -------------------------------------------------------
     ✔ Limpia estado
     ✔ Borra localStorage

     Útil para:
     - Reiniciar flujo
     - Logout
     ------------------------------------------------------- */
  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  };

  /* =======================================================
     📤 EXPORT DEL HOOK
     ======================================================= */
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
  };
}