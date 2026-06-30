import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiResponse, AuthSession, PaginatedResponse } from "@/types/api";

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "/api";
const AUTH_SESSION_KEY = "pragyan_auth_session";

type RequestConfig = AxiosRequestConfig & {
  skipRefresh?: boolean;
};

let refreshPromise: Promise<AuthSession | null> | null = null;
const loadingListeners = new Set<(loading: boolean) => void>();
let pendingRequests = 0;

function notifyLoading() {
  const loading = pendingRequests > 0;
  loadingListeners.forEach((listener) => listener(loading));
}

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function setStoredAuthSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
}

export function clearStoredAuthSession() {
  setStoredAuthSession(null);
}

function normalizeMessage(payload: unknown, fallback = "Request failed") {
  if (payload && typeof payload === "object") {
    const body = payload as ApiResponse<unknown>;
    if (body.message) return body.message;
    if (body.error) return body.error;
    if (body.errors) {
      const firstKey = Object.keys(body.errors)[0];
      const first = firstKey ? body.errors[firstKey]?.[0] : undefined;
      if (first) return first;
    }
  }
  return fallback;
}

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  pendingRequests += 1;
  notifyLoading();

  const session = readSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    notifyLoading();
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    notifyLoading();

    const original = (error.config || {}) as RequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 401 && !original._retry && !original.skipRefresh) {
      original._retry = true;
      const session = readSession();

      if (session?.refreshToken || axiosInstance.defaults.withCredentials) {
        refreshPromise ??= axiosInstance
          .post<ApiResponse<AuthSession>>(
            "/auth/refresh-token",
            session?.refreshToken ? { refreshToken: session.refreshToken } : {},
            { skipRefresh: true } as RequestConfig
          )
          .then((response) => {
            const refreshed = response.data.data;
            if (!refreshed) return null;
            const nextSession: AuthSession = {
              ...(session || {}),
              ...refreshed,
              user: refreshed.user || session?.user,
            };
            if (!nextSession.user) return null;
            setStoredAuthSession(nextSession);
            return nextSession;
          })
          .catch(() => {
            clearStoredAuthSession();
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });

        const refreshed = await refreshPromise;
        if (refreshed) {
          original.headers = {
            ...original.headers,
            ...(refreshed.accessToken ? { Authorization: `Bearer ${refreshed.accessToken}` } : {}),
          };
          return axiosInstance(original);
        }
      }
    }

    throw new ApiError(
      normalizeMessage(error.response?.data, error.message || "Request failed"),
      status,
      error.response?.data
    );
  }
);

function unwrap<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    return (payload as ApiResponse<T>).data as T;
  }
  return payload as T;
}

export const api = {
  async get<T>(url: string, config?: RequestConfig) {
    const response = await axiosInstance.get<ApiResponse<T> | T>(url, config);
    return unwrap<T>(response.data);
  },
  async post<T>(url: string, data?: unknown, config?: RequestConfig) {
    const response = await axiosInstance.post<ApiResponse<T> | T>(url, data, config);
    return unwrap<T>(response.data);
  },
  async put<T>(url: string, data?: unknown, config?: RequestConfig) {
    const response = await axiosInstance.put<ApiResponse<T> | T>(url, data, config);
    return unwrap<T>(response.data);
  },
  async patch<T>(url: string, data?: unknown, config?: RequestConfig) {
    const response = await axiosInstance.patch<ApiResponse<T> | T>(url, data, config);
    return unwrap<T>(response.data);
  },
  async delete<T>(url: string, config?: RequestConfig) {
    const response = await axiosInstance.delete<ApiResponse<T> | T>(url, config);
    return unwrap<T>(response.data);
  },
  async paginated<T>(url: string, config?: RequestConfig) {
    const response = await axiosInstance.get<PaginatedResponse<T>>(url, config);
    return response.data;
  },
  onLoadingChange(listener: (loading: boolean) => void) {
    loadingListeners.add(listener);
    listener(pendingRequests > 0);
    return () => loadingListeners.delete(listener);
  },
};

export { AUTH_SESSION_KEY, API_BASE_URL };
