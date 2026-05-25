const DEFAULT_PROD_API_BASE_URL = 'https://designforge-ai-proyecto-software-1.onrender.com';

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '') || DEFAULT_PROD_API_BASE_URL;
}