import { ProductAttribute } from '@/types/product';

interface Props {
  attribute: ProductAttribute;
  value: string;
  onChange: (code: string, value: string) => void;
  disabled?: boolean;
}

export function AttributeInput({ attribute, value, onChange, disabled }: Props) {
  const { code, label, input_type, required, placeholder } = attribute;

  const baseClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow disabled:opacity-50";

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {input_type === 'number' && (
        <input
          type="number"
          min={0}
          value={value}
          onChange={e => onChange(code, e.target.value)}
          placeholder={placeholder || ''}
          required={required}
          className={baseClass}
          disabled={disabled}
        />
      )}

      {input_type === 'color' && (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value || '#000000'}
            onChange={e => onChange(code, e.target.value)}
            required={required}
            className="h-10 w-14 rounded cursor-pointer border border-gray-300 disabled:opacity-50"
            disabled={disabled}
          />
          <span className="text-sm text-gray-500 font-mono">{value || 'Sin seleccionar'}</span>
        </div>
      )}

      {(input_type === 'text' || input_type === 'select') && (
        <input
          type="text"
          value={value}
          onChange={e => onChange(code, e.target.value)}
          placeholder={placeholder || ''}
          required={required}
          className={baseClass}
          disabled={disabled}
        />
      )}
    </div>
  );
}
