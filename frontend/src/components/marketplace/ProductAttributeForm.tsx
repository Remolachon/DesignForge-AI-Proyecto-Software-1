import React from "react";
import { Product, ProductAttribute, CreateOrderItemPayload } from "@/types/product";
import { useProductAttributes } from "@/hooks/useProductAttributes";

interface Props {
  attribute: ProductAttribute;
  value: string;
  onChange: (value: string) => void;
}

function AttributeInput({ attribute, value, onChange }: Props) {
  switch (attribute.input_type) {
    case "select":
      return (
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {attribute.label}
            {attribute.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={attribute.placeholder || `Ingresa ${attribute.label.toLowerCase()}`}
          />
        </div>
      );

    case "number":
      return (
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {attribute.label}
            {attribute.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="number"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={attribute.placeholder || `Ingresa ${attribute.label.toLowerCase()}`}
          />
        </div>
      );

    case "color":
      return (
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {attribute.label}
            {attribute.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              className="w-10 h-10 rounded cursor-pointer border border-gray-200"
              value={value || "#000000"}
              onChange={(e) => onChange(e.target.value)}
            />
            <span className="text-sm text-gray-500 font-mono">
              {value || "#000000"}
            </span>
          </div>
        </div>
      );

    default: // 'text'
      return (
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {attribute.label}
            {attribute.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={attribute.placeholder || `Ingresa ${attribute.label.toLowerCase()}`}
          />
        </div>
      );
  }
}

interface ProductFormProps {
  product: Product & { attributes?: ProductAttribute[] };
  onSubmit: (payload: CreateOrderItemPayload) => void;
}

export function ProductAttributeForm({ product, onSubmit }: ProductFormProps) {
  const { values, setValue, totalPrice, isValid, missingRequired, getPayload } =
    useProductAttributes(product);

  const attributes = product.attributes || [];

  // Ordenar atributos por sort_order
  const sortedAttributes = [...attributes].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">{product.title}</h2>

      {/* Formulario dinámico — agrega/quita atributos desde la BD sin tocar este código */}
      {sortedAttributes.map((attribute) => (
        <AttributeInput
          key={attribute.id}
          attribute={attribute}
          value={values[attribute.code] ?? ""}
          onChange={(val) => setValue(attribute.code, val)}
        />
      ))}

      {/* Resumen dinámico de valores seleccionados */}
      <div className="my-4 p-3 bg-gray-50 rounded-lg text-sm divide-y">
        {sortedAttributes.map((attribute) => (
          <div key={attribute.id} className="flex justify-between py-1.5">
            <span className="text-gray-500">{attribute.label}</span>
            <span className="font-medium text-gray-800">
              {values[attribute.code] || "—"}
            </span>
          </div>
        ))}
        <div className="flex justify-between py-2 font-semibold text-base pt-3">
          <span>Total</span>
          <span>
            {totalPrice.toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
      </div>

      {/* Advertencia de campos faltantes */}
      {!isValid && missingRequired.length > 0 && (
        <p className="text-xs text-red-500 mb-3">
          Faltan campos requeridos: {missingRequired.join(", ")}
        </p>
      )}

      <button
        disabled={!isValid}
        onClick={() => onSubmit(getPayload())}
        className="w-full py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
      >
        Agregar al carrito
      </button>
    </div>
  );
}
