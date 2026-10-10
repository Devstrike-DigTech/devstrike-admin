export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4001';

/** Public website, used for "View on site" links. */
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://www.devstrike.org';

const TOKEN_KEY = 'devstrike-admin-token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_URL}/api${path}`, { ...options, headers });

  // Only an authenticated request can mean "session expired"; a 401 from the
  // login form itself is just wrong credentials and must reach the caller.
  if (res.status === 401 && token && !path.startsWith('/auth/login')) {
    clearToken();
    window.location.href = '/login?expired=1';
    throw new ApiError('Session expired', 401);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? `Request failed (${res.status})`);
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function uploadImage(file: File): Promise<string> {
  const data = new FormData();
  data.append('file', file);
  const res = await api<{ url: string }>('/uploads/image', { method: 'POST', body: data });
  return res.url;
}

export function resolveImage(src?: string) {
  if (!src) return undefined;
  return src.startsWith('/uploads') ? `${API_URL}${src}` : src;
}

export function errorMessage(err: unknown, fallback = 'Something went wrong') {
  return err instanceof Error ? err.message : fallback;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
