import express, { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '@/utils/errors';

const DANGEROUS_KEY = /(^\$)|(\.)/;

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const clean: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (DANGEROUS_KEY.test(key)) {
      continue;
    }
    clean[key] = sanitizeValue(entry);
  }

  return clean;
}

function hasPollutedQuery(value: unknown): boolean {
  if (Array.isArray(value)) {
    return true;
  }

  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.values(value as Record<string, unknown>).some(hasPollutedQuery);
}

export const requestSizeLimits = [
  express.json({ limit: process.env.REQUEST_JSON_LIMIT || '2mb' }),
  express.urlencoded({ limit: process.env.REQUEST_FORM_LIMIT || '512kb', extended: true, parameterLimit: 200 }),
];

export function sanitizeRequest(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params) as any;
  }

  if (req.query && typeof req.query === 'object') {
    if (hasPollutedQuery(req.query)) {
      next(new BadRequestError('Duplicate query parameters are not allowed'));
      return;
    }
    req.query = sanitizeValue(req.query) as any;
  }

  next();
}
