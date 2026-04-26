import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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

  const getDashboardByRole = (role: string | null): string => {
    if (!role) return '/cliente/dashboard';
    const normalizedRole = role.toLowerCase().trim();
    return normalizedRole === 'funcionario' ? '/funcionario/dashboard' : '/cliente/dashboard';
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

      const response = await fetch('http://localhost:8000/orders/marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          length: Number(formData.length),
          height: Number(formData.height),
          width: Number(formData.width),
          material: formData.material,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al crear la orden');
      }

      const result = await response.json();
      toast.success(`¡Pedido de "${productTitle}" creado exitosamente!`);
      resetForm();
      
      // 🔥 REDIRIGIR AL DASHBOARD SEGÚN EL ROL (IGUAL QUE CREAR-PEDIDO)
      const role = localStorage.getItem('role');
      const dashboardPath = getDashboardByRole(role);
      router.push(dashboardPath);
      
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la orden');
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
