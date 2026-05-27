/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useMemo } from "react";
import { Product, ProductAttribute, AttributeValues, CreateOrderItemPayload } from "@/types/product";

export function useProductAttributes(product: Product & { attributes?: ProductAttribute[] }) {
  const [values, setValues] = useState<AttributeValues>({});

  const setValue = useCallback((code: string, value: string) => {
    setValues((prev) => ({ ...prev, [code]: value }));
  }, []);

  const attributes = product.attributes || [];

  // Calcula el precio final sumando los modificadores de las opciones seleccionadas
  const totalPrice = useMemo(() => {
    return product.price;
  }, [product, values, attributes]);

  // Validación: devuelve los campos requeridos sin valor
  const missingRequired = useMemo(() => {
    return attributes
      .filter((a) => a.required && !values[a.code])
      .map((a) => a.label);
  }, [attributes, values]);

  const isValid = missingRequired.length === 0;

  const getPayload = (): CreateOrderItemPayload => ({
    productId: product.id,
    quantity: 1,
    attributes: values,
  });

  return { values, setValue, totalPrice, isValid, missingRequired, getPayload };
}
