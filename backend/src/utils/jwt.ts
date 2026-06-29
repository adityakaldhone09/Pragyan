// src/utils/jwt.ts

import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '@/config/env';
import { JwtPayload } from '@/types';

export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiry as jwt.SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId, jti: randomUUID() }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): { id: string; jti?: string } | null => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as { id: string; jti?: string };
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  return jwt.decode(token) as JwtPayload | null;
};
