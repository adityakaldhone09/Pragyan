export interface JwtPayload {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
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

export interface OAuthUserProfile {
  provider: 'google' | 'github';
  providerId: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  emailVerified?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    avatar?: string | null;
    provider?: string;
    emailVerified?: boolean;
  };
  accessToken?: string;
  refreshToken?: string;
}
