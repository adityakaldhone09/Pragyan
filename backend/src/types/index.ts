// src/types/auth.ts

export interface JwtPayload {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'RECRUITER';
  iat?: number;
  exp?: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  fullName: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  accessToken?: string;
  refreshToken?: string;
}

// src/types/api.ts

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// src/types/index.ts

export * from './auth';
export * from './api';
