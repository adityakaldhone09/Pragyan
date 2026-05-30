import type { ApiResponse, PaginatedResponse } from "@/types/api";

const DEFAULT_TIMEOUT = 15_000;
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api";
const AUTH_SESSION_KEY = "pragyan_auth_session";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
  retryCount?: number;
  skipAuth?: boolean;
};

function resolveUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${BASE_URL}${path}`;
  }

  return `${BASE_URL}/${path}`;
}

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as { accessToken?: string; refreshToken?: string };
  } catch {
    return null;
  }
}

function getAccessToken() {
  return readStoredAuth()?.accessToken || null;
}

export function setStoredAuthSession(session: unknown) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearStoredAuthSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function normalizeErrorMessage(payload: unknown, fallback = "Request failed") {
  if (payload && typeof payload === "object") {
    const candidate = payload as { message?: string; error?: string; errors?: Record<string, string[]> };
    if (candidate.message) return candidate.message;
    if (candidate.error) return candidate.error;
    if (candidate.errors) {
      const firstKey = Object.keys(candidate.errors)[0];
      const firstMessage = firstKey ? candidate.errors[firstKey]?.[0] : undefined;
      if (firstMessage) return firstMessage;
    }
  }

  return fallback;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT, retryCount = 1, skipAuth = false, headers, body, signal, ...rest } = options;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const mergedHeaders = new Headers(headers);

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      mergedHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  if (body !== undefined && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const response = await fetch(resolveUrl(path), {
        ...rest,
        signal: signal ?? controller.signal,
        credentials: "include",
        headers: mergedHeaders,
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
      });

      const text = await response.text();
      const parsed = text ? JSON.parse(text) : null;

      if (!response.ok || (parsed && typeof parsed === "object" && "success" in parsed && parsed.success === false)) {
        throw new Error(normalizeErrorMessage(parsed, response.statusText || "Request failed"));
      }

      if (parsed && typeof parsed === "object" && "data" in parsed) {
        return (parsed as ApiResponse<T>).data as T;
      }

      return parsed as T;
    } catch (error) {
      lastError = error;
      if (attempt < retryCount && (rest.method === undefined || String(rest.method).toUpperCase() === "GET")) {
        continue;
      }
      break;
    }
  }

  clearTimeout(timeout);

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Request failed");
}

export async function apiPaginatedRequest<T>(path: string, options: RequestOptions = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT, retryCount = 1, skipAuth = false, headers, body, signal, ...rest } = options;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const mergedHeaders = new Headers(headers);

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) mergedHeaders.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(resolveUrl(path), {
      ...rest,
      signal: signal ?? controller.signal,
      credentials: 'include',
      headers: mergedHeaders,
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });

    const text = await response.text();
    const parsed = text ? JSON.parse(text) : null;

    if (!response.ok || (parsed && typeof parsed === 'object' && 'success' in parsed && parsed.success === false)) {
      throw new Error(normalizeErrorMessage(parsed, response.statusText || 'Request failed'));
    }

    // If server wraps with { success, data, pagination }, return the full parsed object
    if (parsed && typeof parsed === 'object' && 'data' in parsed && 'pagination' in parsed) {
      return parsed as PaginatedResponse<T>;
    }

    // Fallback: server may have returned just data array (legacy); wrap into pagination-less shape
    return {
      success: true,
      data: (parsed as any) || [],
      pagination: {
        page: 1,
        limit: Array.isArray(parsed) ? (parsed as any).length : 0,
        total: Array.isArray(parsed) ? (parsed as any).length : 0,
        totalPages: 1,
      },
    } as PaginatedResponse<T>;
  } finally {
    clearTimeout(timeout);
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: "DELETE" }),
};

export { AUTH_SESSION_KEY };