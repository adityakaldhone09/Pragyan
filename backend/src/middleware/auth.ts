// src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors';
import { verifyAccessToken } from '@/utils/jwt';
import { JwtPayload } from '@/types';
import { readAccessTokenCookie } from '@/security';

declare global {
  namespace Express {
    interface User extends JwtPayload {}

    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const token = bearerToken || readAccessTokenCookie(req.headers.cookie);

    if (!token) {
      throw new UnauthorizedError('No access token provided');
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      throw new UnauthorizedError('Invalid or expired access token');
    }

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};

export const requireAuth = authenticate;

export const requireRole = (...roles: string[]) => authorize(...roles);

export const requireAdmin = authorize('ADMIN');
