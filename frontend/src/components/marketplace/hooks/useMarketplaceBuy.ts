import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { paymentService } from '@/services/payment.service';
import { ProductAttribute } from '@/types/product';

export function useMarketplaceBuy() {
  const router = useRouter();
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const initAttributes = (attributes: ProductAttribute[]) => {
    if (Object.keys(attrValues).length === 0) {
      setAttrValues(Object.fromEntries(attributes.map(a => [a.code, ''])));
    }
  };

  const validateForm = (attributes: ProductAttribute[]): boolean => {
    const newErrors: Record<string, string> = {};

    attributes.forEach(attr => {
      const val = attrValues[attr.code];
      if (attr.required && (!val || val.trim() === '')) {
        newErrors[attr.code] = `El campo ${attr.label} es obligatorio.`;
      } else if (attr.type === 'number' && val) {
        if (isNaN(Number(val)) || Number(val) <= 0) {
          newErrors[attr.code] = `El campo ${attr.label} debe ser mayor a 0.`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createOrder = async (
    productId: number,
    productTitle: string,
    attributes: ProductAttribute[]
  ): Promise<boolean> => {
    if (!validateForm(attributes)) {
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

      // Format custom_attributes payload
      const customAttributes: Record<string, string> = {};
      attributes.forEach(attr => {
        if (attrValues[attr.code] && attrValues[attr.code].trim() !== '') {
          customAttributes[attr.code] = attrValues[attr.code];
        }
      });

      const result = await paymentService.createMarketplaceOrder({
        product_id: productId,
        quantity: 1,
        attributes: customAttributes,
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

      // Log detailed error for debugging
      console.error('Error creating marketplace order:', error);

      // Show user-friendly error message
      const userMessage = message.includes('body.')
        ? `Datos inválidos: ${message.split('; ').join(', ')}`
        : message;

      toast.error(userMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAttrValues({});
    setErrors({});
  };

  const setField = (code: string, value: string) => {
    setAttrValues((prev) => ({ ...prev, [code]: value }));
    if (errors[code]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[code];
        return next;
      });
    }
  };

  const hasErrors = (): boolean => {
    return Object.values(errors).some(error => error !== '');
  };

  return {
    attrValues,
    errors,
    loading,
    initAttributes,
    setField,
    validateForm,
    createOrder,
    resetForm,
    hasErrors,
  };
}
