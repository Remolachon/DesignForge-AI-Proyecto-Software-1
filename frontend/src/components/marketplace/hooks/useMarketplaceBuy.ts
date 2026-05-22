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
  const [quantity, setQuantity] = useState(1);

  const initAttributes = (attributes: ProductAttribute[]) => {
    setAttrValues((prev) => {
      const next = { ...prev };

      attributes.forEach((attribute) => {
        if (next[attribute.code] && next[attribute.code].trim() !== '') {
          return;
        }

        if (attribute.default_value && attribute.default_value.trim() !== '') {
          next[attribute.code] = attribute.default_value.trim();
          return;
        }

        if (attribute.input_type === 'color') {
          next[attribute.code] = '#000000';
          return;
        }

        next[attribute.code] = (attribute.placeholder || '').trim();
      });

      return next;
    });
  };

  const validateForm = (attributes: ProductAttribute[], stock?: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      newErrors.quantity = 'La cantidad debe estar entre 1 y 10.';
    } else if (typeof stock === 'number' && quantity > stock) {
      newErrors.quantity = 'La cantidad no puede superar el stock disponible.';
    }

    attributes.forEach(attr => {
      const val = attrValues[attr.code] || attr.default_value || '';
      if (attr.required && (!val || val.trim() === '')) {
        newErrors[attr.code] = `El campo ${attr.label} es obligatorio.`;
      } else if (attr.input_type === 'number' && val) {
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
    attributes: ProductAttribute[],
    stock?: number
  ): Promise<boolean> => {
    if (!validateForm(attributes, stock)) {
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
        const value = (attrValues[attr.code] || attr.default_value || '').trim();
        if (value !== '') {
          customAttributes[attr.code] = value;
        }
      });

      const result = await paymentService.createMarketplaceOrder({
        product_id: productId,
        quantity,
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
    setQuantity(1);
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
    quantity,
    setQuantity,
    initAttributes,
    setField,
    validateForm,
    createOrder,
    resetForm,
    hasErrors,
  };
}
