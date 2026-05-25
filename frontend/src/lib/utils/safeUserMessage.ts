export function sanitizeUserMessage(message: unknown, fallback = 'Paso algo inesperado'): string {
  if (typeof message !== 'string') {
    return fallback;
  }

  const cleaned = message
    .replace(/\berrores\b/gi, 'inconvenientes')
    .replace(/\berror\b/gi, 'inconveniente')
    .trim();

  return cleaned || fallback;
}
