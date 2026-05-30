import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { authService } from '@/services/auth';
import { sendError, sendSuccess } from '@/utils/response';
import { decodeToken } from '@/utils/jwt';

type OAuthProviderKey = 'google' | 'github';

function getProviderFromPath(req: Request): OAuthProviderKey | null {
  const provider = req.params.provider;
  if (provider === 'google' || provider === 'github') {
    return provider;
  }
  return null;
}

function getOAuthSession(req: Request) {
  return req.session as unknown as {
    oauthState?: Record<string, string>;
    oauthLinkUserId?: string;
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

export const getProviders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const providers = await authService.getProviderStatus(req.user.id);
  return sendSuccess(res, providers, 200, 'Provider status fetched successfully');
});

export const startLink = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const provider = getProviderFromPath(req);
  if (!provider) {
    return sendError(res, 400, 'Unsupported provider');
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Authentication required to link accounts');
  }

  const token = authHeader.substring(7);
  const payload = decodeToken(token);
  if (!payload?.id) {
    return sendError(res, 401, 'Invalid access token');
  }

  const session = getOAuthSession(req);
  session.oauthLinkUserId = payload.id;
  await saveSession(req);

  return sendSuccess(res, { redirectUrl: `/api/auth/${provider}` }, 200, 'OAuth link started');
});

export const unlinkProvider = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const provider = getProviderFromPath(req);
  if (!provider) {
    return sendError(res, 400, 'Unsupported provider');
  }

  const providers = await authService.unlinkProviderFromUser(req.user.id, provider);
  return sendSuccess(res, providers, 200, `${provider} account unlinked successfully`);
});
