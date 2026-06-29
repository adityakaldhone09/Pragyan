// src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '@/utils/errors';
import { sendError } from '@/utils/response';
import { config } from '@/config/env';

function isPrismaConnectivityError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }

  const name = (err as { name?: string }).name || '';
  const message = (err as { message?: string }).message || '';
  const lowerMessage = message.toLowerCase();

  return (
    err instanceof Prisma.PrismaClientInitializationError ||
    name.includes('PrismaClientInitializationError') ||
    lowerMessage.includes('dns resolution') ||
    lowerMessage.includes('_mongodb._tcp') ||
    lowerMessage.includes('authentication failed') ||
    lowerMessage.includes('timed out') ||
    lowerMessage.includes('replica')
  );
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isProduction = config.nodeEnv === 'production';

  // In development, surface full error details to help diagnose DB/MongoClient issues
  if (!isProduction) {
    console.error('[FullError]', err);
  }

  if (err instanceof AppError) {
    if (!isProduction || err.statusCode >= 500) {
      console.error(`[AppError] ${req.method} ${req.path} → ${err.statusCode}: ${err.message}`);
    }
    sendError(res, err.statusCode, isProduction && err.statusCode >= 500 ? 'Internal server error' : err.message, err.errors);
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    console.warn(`[ParseError] ${req.method} ${req.path}: Invalid JSON body`);
    sendError(res, 400, 'Invalid request format – malformed JSON');
    return;
  }

  if (isPrismaConnectivityError(err)) {
    console.error(`[DatabaseError] ${req.method} ${req.path}: database temporarily unavailable`);
    sendError(res, 503, 'Database temporarily unavailable');
    return;
  }

  console.error(`[UnhandledError] ${req.method} ${req.path}`, {
    message: err.message,
    stack: isProduction ? undefined : err.stack,
  });

  sendError(
    res,
    500,
    isProduction ? 'Internal server error' : err.message
  );
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
