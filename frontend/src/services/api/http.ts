import { config } from '@/config';

const API_BASE_URL = `${config.apiUrl}/api`;

const buildHeaders = (
  body: BodyInit | null | undefined,
  headers?: HeadersInit
): HeadersInit | undefined => {
  if (body instanceof FormData) {
    return headers;
  }
  return {
    'Content-Type': 'application/json',
    ...(headers || {}),
  };
};

export const fetchWithAuth = (path: string, options: RequestInit = {}) => {
  const url = path.startsWith('http')
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  return fetch(url, {
    credentials: 'include',
    ...options,
    headers: buildHeaders(options.body, options.headers),
  });
};

export const parseJsonResponse = async <T = any>(
  response: Response,
  defaultError = 'Request failed'
): Promise<T> => {
  let payload: any = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorMessage = payload?.error?.message || payload?.error || payload?.message || defaultError;
    throw new Error(errorMessage);
  }

  // Handle our API response format: { success: true, data: ... }
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }

  return payload as T;
};

export { API_BASE_URL };

