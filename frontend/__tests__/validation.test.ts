import { describe, test, expect } from 'vitest';
import { 
  validatePassword, 
  validateEmail, 
  validateRequired, 
  validatePhone, 
  validateMatch,
  PASSWORD_RULES
} from '@/lib/utils/validation';

describe('Validation Utils', () => {
  describe('PASSWORD_RULES', () => {
    test('length', () => {
      const rule = PASSWORD_RULES.find(r => r.id === 'length');
      expect(rule?.test('1234567')).toBe(false);
      expect(rule?.test('12345678')).toBe(true);
    });
    test('uppercase', () => {
      const rule = PASSWORD_RULES.find(r => r.id === 'uppercase');
      expect(rule?.test('abc')).toBe(false);
      expect(rule?.test('aBc')).toBe(true);
    });
    test('number', () => {
      const rule = PASSWORD_RULES.find(r => r.id === 'number');
      expect(rule?.test('abc')).toBe(false);
      expect(rule?.test('a1c')).toBe(true);
    });
    test('symbol', () => {
      const rule = PASSWORD_RULES.find(r => r.id === 'symbol');
      expect(rule?.test('abc123')).toBe(false);
      expect(rule?.test('abc123!')).toBe(true);
    });
    test('noSpaces', () => {
      const rule = PASSWORD_RULES.find(r => r.id === 'noSpaces');
      expect(rule?.test('ab c')).toBe(false);
      expect(rule?.test('abc')).toBe(true);
    });
  });

  describe('validatePassword', () => {
    test('retorna errores correctos', () => {
      expect(validatePassword('')).toBe('La contraseña es obligatoria.');
      expect(validatePassword(' pass')).toBe('La contraseña no puede contener espacios.');
      expect(validatePassword('pass')).toBe('Debe tener al menos 8 caracteres.');
      expect(validatePassword('password')).toBe('Debe incluir al menos una letra mayúscula.');
      expect(validatePassword('Password')).toBe('Debe incluir al menos un número.');
      expect(validatePassword('Password123')).toBe('Debe incluir al menos un símbolo (!@#$...).');
      expect(validatePassword('Password123!')).toBe('');
    });
  });

  describe('validateEmail', () => {
    test('retorna errores correctos', () => {
      expect(validateEmail('')).toBe('El correo es obligatorio.');
      expect(validateEmail('test')).toBe('Ingresa un correo electrónico válido.');
      expect(validateEmail('test@.com')).toBe('Ingresa un correo electrónico válido.');
      expect(validateEmail('test@test.com')).toBe('');
    });
  });

  describe('validateRequired', () => {
    test('retorna errores correctos', () => {
      expect(validateRequired('', 'Nombre')).toBe('Nombre es obligatorio.');
      expect(validateRequired('John', 'Nombre')).toBe('');
    });
  });

  describe('validatePhone', () => {
    test('retorna errores correctos', () => {
      expect(validatePhone('')).toBe(''); // Opcional
      expect(validatePhone('123 456')).toBe('El teléfono no puede contener espacios.');
      expect(validatePhone('123abc')).toBe('Solo se permiten números.');
      expect(validatePhone('123456')).toBe('Debe tener entre 7 y 15 dígitos.');
      expect(validatePhone('1234567890123456')).toBe('Debe tener entre 7 y 15 dígitos.');
      expect(validatePhone('1234567')).toBe('');
    });
  });

  describe('validateMatch', () => {
    test('retorna errores correctos', () => {
      expect(validateMatch('pass', '')).toBe('Confirma tu contraseña.');
      expect(validateMatch('pass', 'pas')).toBe('Las contraseñas no coinciden.');
      expect(validateMatch('pass', 'pass')).toBe('');
    });
  });
});
