import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { paymentService } from '@/services/payment.service';

export interface BuyFormData {
  length: string;
  height: string;
  width: string;
  material: string;
}

export interface BuyFormErrors extends BuyFormData {
  [key: string]: string;
}

export function useMarketplaceBuy() {
  const router = useRouter();
  const [formData, setFormData] = useState<BuyFormData>({
    length: '',
    height: '',
    width: '',
    material: '',
  });
  const [errors, setErrors] = useState<Partial<BuyFormErrors>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<BuyFormErrors> = {};

    // Validar length
    if (!formData.length.trim()) {
      newErrors.length = 'La longitud es obligatoria.';
    } else if (isNaN(Number(formData.length)) || Number(formData.length) <= 0) {
      newErrors.length = 'La longitud debe ser un número mayor a 0.';
    }

    // Validar height
    if (!formData.height.trim()) {
      newErrors.height = 'La altura es obligatoria.';
    } else if (isNaN(Number(formData.height)) || Number(formData.height) <= 0) {
      newErrors.height = 'La altura debe ser un número mayor a 0.';
    }

    // Validar width
    if (!formData.width.trim()) {
      newErrors.width = 'El ancho es obligatorio.';
    } else if (isNaN(Number(formData.width)) || Number(formData.width) <= 0) {
      newErrors.width = 'El ancho debe ser un número mayor a 0.';
    }

    // Validar material
    if (!formData.material.trim()) {
      newErrors.material = 'El material es obligatorio.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createOrder = async (
    productId: number,
    productTitle: string
  ): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        localStorage.setItem('redirect_after_login', '/marketplace');
        toast.error('Debes iniciar sesión');
        router.push('/login');
        return false;
      }

      const result = await paymentService.createMarketplaceOrder({
        product_id: productId,
        length: Number(formData.length),
        height: Number(formData.height),
        width: Number(formData.width),
        material: formData.material,
      });

      if (!result.payment_url) {
        throw new Error('No se pudo iniciar el pago con PayU');
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

      toast.success(`Pedido de "${productTitle}" creado. Continúa al checkout seguro.`);
      resetForm();

      router.push(`/pagos/checkout?orderId=${result.order_id}`);
      
      return true;
    } catch (error: any) {
      const message = error?.message || 'Error al crear la orden';

      if (message === 'AUTH_REQUIRED' || message === 'SESSION_EXPIRED') {
        localStorage.setItem('redirect_after_login', '/marketplace');
        toast.error('Tu sesión expiró. Inicia sesión nuevamente.');
        router.push('/login');
        return false;
      }

      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      length: '',
      height: '',
      width: '',
      material: '',
    });
    setErrors({});
  };

  const setField = (field: keyof BuyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando empieza a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const hasErrors = (): boolean => {
    return Object.values(errors).some(error => error !== '');
  };

  return {
    formData,
    errors,
    loading,
    setField,
    validateForm,
    createOrder,
    resetForm,
    hasErrors,
  };
}
