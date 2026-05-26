import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { randomBytes } from 'crypto';
import { asyncHandler } from '@/middleware/errorHandler';
import { config } from '@/config/env';
import { authService } from '@/services/auth';
import { isGoogleOAuthConfigured, isGitHubOAuthConfigured } from '@/config/passport';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt';
import { prisma } from '@/lib/prisma';
import type { OAuthUserProfile } from '@/types/auth';

function buildFrontendUrl(path: string, query?: Record<string, string>) {
  const url = new URL(path, config.frontendUrl);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

function getOAuthSession(req: Request) {
  return req.session as unknown as {
    oauthState?: Record<string, string>;
    save: (callback: (error?: unknown) => void) => void;
  };
}

function saveSession(req: Request) {
  const session = getOAuthSession(req);
  return new Promise<void>((resolve, reject) => {
    session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function generateOAuthState(req: Request, provider: 'google' | 'github') {
  const state = randomBytes(24).toString('hex');
  const session = getOAuthSession(req);
  session.oauthState = {
    ...(session.oauthState || {}),
    [provider]: state,
  };
  return state;
}

function verifyOAuthState(req: Request, provider: 'google' | 'github') {
  const queryState = typeof req.query.state === 'string' ? req.query.state : '';
  const session = getOAuthSession(req);
  const expectedState = session.oauthState?.[provider] || '';

  return Boolean(expectedState && queryState && expectedState === queryState);
}

function clearOAuthState(req: Request, provider: 'google' | 'github') {
  const session = getOAuthSession(req);
  if (session.oauthState) {
    delete session.oauthState[provider];
    if (Object.keys(session.oauthState).length === 0) {
      delete session.oauthState;
    }
  }
}

function redirectOAuthError(res: Response, message: string, provider?: string) {
  return res.redirect(buildFrontendUrl('/auth', { error: message, provider: provider || '' }));
}

function redirectOAuthSuccess(res: Response, session: { accessToken: string; refreshToken: string }) {
  const url = new URL('/auth/success', config.frontendUrl);
  url.hash = new URLSearchParams({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  }).toString();

  console.log('[OAuth:redirectSuccess]', {
    accessTokenPresent: Boolean(session.accessToken),
    refreshTokenPresent: Boolean(session.refreshToken),
    targetUrl: url.toString(),
  });

  return res.redirect(url.toString());
}

function executePassportCallback(strategy: 'google' | 'github') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (strategy === 'google' && !isGoogleOAuthConfigured()) {
      return redirectOAuthError(res, 'Google OAuth is not configured on this server.', 'google');
    }

    if (strategy === 'github' && !isGitHubOAuthConfigured()) {
      return redirectOAuthError(res, 'GitHub OAuth is not configured on this server.', 'github');
    }

    return passport.authenticate(strategy, { session: false }, async (error: unknown, profile: OAuthUserProfile | false | null, info: { message?: string } | undefined) => {
      if (error) {
        console.error('[OAuth:passportCallback:error]', error);
        if (error instanceof Error && error.stack) {
          console.error(error.stack);
        }

        return res.status(500).type('text/plain').send(error instanceof Error ? error.stack || error.message : String(error));
      }

      if (!profile) {
        const message = info?.message || 'OAuth login was cancelled or denied';
        return redirectOAuthError(res, message, strategy);
      }

      try {
        const sessionObj = getOAuthSession(req);
        const linkUserId = (sessionObj as any).oauthLinkUserId as string | undefined;

        if (linkUserId) {
          // Link this provider to an existing authenticated user
          try {

            const linkedUser = await authService.linkProviderToUser(linkUserId, profile);

            // Issue new tokens for the linked user so frontend can refresh its session
            const accessToken = generateAccessToken({ id: linkedUser.id, email: linkedUser.email, role: linkedUser.role as 'USER' | 'ADMIN' });
            const refreshToken = generateRefreshToken(linkedUser.id);

            // Persist refresh token
            try {
              await prisma.refreshToken.create({
                data: {
                  token: refreshToken,
                  userId: linkedUser.id,
                  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
              });
            } catch (rtErr) {
              console.warn('Failed to persist refresh token during linking:', (rtErr as any)?.message || String(rtErr));
            }

            // clear link intent from session
            delete (sessionObj as any).oauthLinkUserId;
            void saveSession(req).catch(() => undefined);

            const result = { user: linkedUser, accessToken, refreshToken };
            return redirectOAuthSuccess(res, result as any);
          } catch (linkErr: any) {
            console.error('[OAuth:linking:error]', linkErr);
            const message = linkErr instanceof Error ? linkErr.message : 'Unable to link social account';
            return redirectOAuthError(res, message, strategy);
          }
        }

        const session = await authService.loginWithOAuth(profile);
        console.log('[OAuth:passportCallback]', {
          reachedVerifyCallback: true,
          provider: strategy,
          profileId: profile.providerId,
          email: profile.email,
          sessionId: req.sessionID,
        });
        return redirectOAuthSuccess(res, session);
      } catch (oauthError) {
        const message = oauthError instanceof Error ? oauthError.message : 'Unable to complete OAuth login';
        return redirectOAuthError(res, message, strategy);
      }
    })(req, res, next);
  };
}

export const startGoogleAuth = asyncHandler(async (req: Request, res: Response, next) => {
  if (!isGoogleOAuthConfigured()) {
    return redirectOAuthError(res, 'Google OAuth is not configured on this server.', 'google');
  }

  const state = generateOAuthState(req, 'google');
  await saveSession(req);
  
  // Debug logs: session and state before redirecting to provider
  try {
    console.log('[OAuth:startGoogleAuth] Session ID before redirect:', req.sessionID);
    // @ts-ignore
    console.log('[OAuth:startGoogleAuth] OAuth state saved:', (req.session as any)?.oauthState);
    console.log('[OAuth:startGoogleAuth] Request cookies:', req.headers.cookie || null);
    console.log('[OAuth:startGoogleAuth] Request origin:', req.headers.origin || req.headers.referer || null);
  } catch (e) {
    console.warn('[OAuth:startGoogleAuth] Failed to log session info', e);
  }

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
    state,
  })(req, res, next);
});

export const startLinkAuth = asyncHandler(async (req: Request, res: Response) => {
  const provider = typeof req.query.provider === 'string' ? req.query.provider : '';

  if (!['google', 'github'].includes(provider)) {
    return res.status(400).json({ success: false, message: 'Unsupported provider' });
  }

  // Must be authenticated via JWT to initiate linking
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required to link accounts' });
  }

  // decode token to get user id
  const { decodeToken } = require('@/utils/jwt');
  const token = authHeader.substring(7);
  const payload = decodeToken(token);

  if (!payload?.id) {
    return res.status(401).json({ success: false, message: 'Invalid access token' });
  }

  const session = getOAuthSession(req) as any;
  session.oauthLinkUserId = payload.id;
  await saveSession(req);

  // Respond with the start URL client should redirect to
  return res.json({ success: true, redirectUrl: `/api/auth/${provider}` });
});

export const handleGoogleCallback = (req: Request, res: Response, next: NextFunction) => {
  if (!verifyOAuthState(req, 'google')) {
    return redirectOAuthError(res, 'Unable to verify authorization request state.', 'google');
  }
  
  // Debug logs: session info at callback entry
  try {
    console.log('[OAuth:handleGoogleCallback] OAuth callback session ID:', req.sessionID);
    // @ts-ignore
    console.log('[OAuth:handleGoogleCallback] OAuth callback state:', (req.session as any)?.oauthState);
    console.log('[OAuth:handleGoogleCallback] Google state (query):', req.query.state);
    console.log('[OAuth:handleGoogleCallback] Request cookies:', req.headers.cookie || null);
  } catch (e) {
    console.warn('[OAuth:handleGoogleCallback] Failed to log callback session info', e);
  }

  clearOAuthState(req, 'google');
  void saveSession(req).catch(() => undefined);

  return executePassportCallback('google')(req, res, next);
};

export const startGitHubAuth = asyncHandler(async (req: Request, res: Response, next) => {
  if (!isGitHubOAuthConfigured()) {
    return redirectOAuthError(res, 'GitHub OAuth is not configured on this server.', 'github');
  }

  const state = generateOAuthState(req, 'github');
  await saveSession(req);

  return passport.authenticate('github', {
    scope: ['user:email'],
    session: false,
    state,
  })(req, res, next);
});

export const handleGitHubCallback = (req: Request, res: Response, next: NextFunction) => {
  if (!verifyOAuthState(req, 'github')) {
    return redirectOAuthError(res, 'Unable to verify authorization request state.', 'github');
  }

  clearOAuthState(req, 'github');
  void saveSession(req).catch(() => undefined);

  return executePassportCallback('github')(req, res, next);
};

