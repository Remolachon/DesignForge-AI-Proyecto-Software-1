export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length',    label: 'Mínimo 8 caracteres',       test: (v) => v.length >= 8 },
  { id: 'uppercase', label: 'Al menos una mayúscula',    test: (v) => /[A-Z]/.test(v) },
  { id: 'number',    label: 'Al menos un número',        test: (v) => /[0-9]/.test(v) },
  { id: 'symbol',    label: 'Al menos un símbolo (!@#$…)', test: (v) => /[^A-Za-z0-9]/.test(v) },
  { id: 'noSpaces',  label: 'Sin espacios',              test: (v) => !/\s/.test(v) },
];

export function validatePassword(value: string): string {
  if (!value) return 'La contraseña es obligatoria.';
  if (/\s/.test(value)) return 'La contraseña no puede contener espacios.';
  if (value.length < 8) return 'Debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(value)) return 'Debe incluir al menos una letra mayúscula.';
  if (!/[0-9]/.test(value)) return 'Debe incluir al menos un número.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Debe incluir al menos un símbolo (!@#$...).';
  return '';
}

export function validateEmail(value: string): string {
  if (!value.trim()) return 'El correo es obligatorio.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return 'Ingresa un correo electrónico válido.';
  return '';
}

export function validateRequired(value: string, label: string): string {
  if (!value.trim()) return `${label} es obligatorio.`;
  return '';
}

export function validatePhone(value: string): string {
  if (!value.trim()) return ''; // opcional
  if (/\s/.test(value)) return 'El teléfono no puede contener espacios.';
  if (!/^\d+$/.test(value)) return 'Solo se permiten números.';
  if (value.length < 7 || value.length > 15)
    return 'Debe tener entre 7 y 15 dígitos.';
  return '';
}

export function validateMatch(pass: string, confirm: string): string {
  if (!confirm) return 'Confirma tu contraseña.';
  if (pass !== confirm) return 'Las contraseñas no coinciden.';
  return '';
}