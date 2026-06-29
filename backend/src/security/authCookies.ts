import { Response } from 'express';

import { config } from '@/config/env';

const accessCookieName = 'pragyan_access';
const refreshCookieName = 'pragyan_refresh';

const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
): void {
  res.cookie(accessCookieName, tokens.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(refreshCookieName, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(accessCookieName, cookieOptions);
  res.clearCookie(refreshCookieName, cookieOptions);
}

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) {
    return null;
  }

  const cookies = header.split(';').map((part) => part.trim());
  for (const cookie of cookies) {
    const [cookieName, ...valueParts] = cookie.split('=');
    if (cookieName === name) {
      return decodeURIComponent(valueParts.join('='));
    }
  }
  return null;
}

export function readAccessTokenCookie(header: string | undefined): string | null {
  return readCookie(header, accessCookieName);
}

export function readRefreshTokenCookie(header: string | undefined): string | null {
  return readCookie(header, refreshCookieName);
}
