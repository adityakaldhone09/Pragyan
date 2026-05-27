import { createContext } from 'react';
import type { AuthSession, AuthUser } from '@/types/api';

export type AuthStatus = 'initializing' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (input: { email: string; password: string }) => Promise<AuthSession>;
  register: (input: { email: string; password: string; name?: string }) => Promise<AuthSession>;
  refreshToken: (input: { refreshToken: string }) => Promise<AuthSession>;
  updateProfile: typeof import('@/services/authService').authService.updateProfile;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
  setSession: (session: AuthSession | null) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
