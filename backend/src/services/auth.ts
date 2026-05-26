// src/services/auth.ts

import { prisma } from '@/lib/prisma';
import { MongoClient, ObjectId } from 'mongodb';
import { getMongoUrl } from '@/config/mongo';
import { randomBytes } from 'crypto';
import { hashPassword, comparePasswords } from '@/utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '@/utils/errors';
import { RegisterInput, LoginInput, ProfileUpdateInput } from '@/validators/auth';
import type { OAuthUserProfile } from '@/types/auth';

const userProfileSelect = {
  id: true,
  fullName: true,
  email: true,
  provider: true,
  providerId: true,
  avatar: true,
  emailVerified: true,
  role: true,
  age: true,
  location: true,
  phone: true,
  linkedin: true,
  skills: true,
  interests: true,
  preferences: true,
  experience: true,
  experienceType: true,
  education: true,
  educationEntries: true,
  skillLevel: true,
  xp: true,
  createdAt: true,
  updatedAt: true,
} as const;

function buildUserSession(user: {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string | null;
  provider?: string;
  emailVerified?: boolean;
  age?: number | null;
  location?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  skills?: string[];
  interests?: string[];
  preferences?: string[];
  experience?: string | null;
  experienceType?: string | null;
  education?: string | null;
  educationEntries?: unknown;
  skillLevel?: string | null;
  xp?: number;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? null,
    provider: user.provider ?? 'local',
    emailVerified: user.emailVerified ?? false,
    age: user.age,
    location: user.location,
    phone: user.phone,
    linkedin: user.linkedin,
    skills: Array.isArray(user.skills) ? user.skills : [],
    interests: Array.isArray(user.interests) ? user.interests : [],
    preferences: Array.isArray(user.preferences) ? user.preferences : [],
    experience: user.experience,
    experienceType: user.experienceType,
    education: user.education,
    educationEntries: user.educationEntries ?? [],
    skillLevel: user.skillLevel,
    xp: user.xp ?? 0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class AuthService {
  private async upsertCurrentUserSnapshot(user: {
    _id: ObjectId;
    email: string;
    fullName: string;
    role: string;
    age: number | null;
    location: string | null;
    phone: string | null;
    linkedin: string | null;
    skills: string[];
    interests: string[];
    preferences: string[];
    experience: string | null;
    experienceType: string | null;
    education: string | null;
    educationEntries: unknown;
    skillLevel: string | null;
    xp: number;
    streak?: number;
    createdAt: Date;
    updatedAt: Date;
  }, active = true, lastLoginAt?: Date) {
    const client = new MongoClient(getMongoUrl());

    try {
      await client.connect();
      const db = client.db('Pragyan');
      const currentUsersCollection = db.collection('CurrentUser');

      await currentUsersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            userId: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            age: user.age,
            location: user.location,
            phone: user.phone,
            linkedin: user.linkedin,
            skills: user.skills,
            interests: user.interests,
            preferences: user.preferences,
            experience: user.experience,
            experienceType: user.experienceType,
            education: user.education,
            educationEntries: user.educationEntries,
            skillLevel: user.skillLevel,
            xp: user.xp,
            streak: user.streak ?? 0,
            active,
            lastLoginAt: lastLoginAt ?? null,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    } finally {
      await client.close();
    }
  }

  async register(input: RegisterInput) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await hashPassword(input.password);
    const now = new Date();

    try {
      // Create user via Prisma to avoid separate MongoClient SRV/DNS resolution paths
      const created = await prisma.user.create({
        data: {
          email: input.email,
          fullName: input.fullName,
          password: hashedPassword,
          provider: 'local',
          providerId: null,
          avatar: null,
          emailVerified: false,
          role: 'USER',
          age: null,
          location: null,
          phone: null,
          linkedin: null,
          skills: [],
          interests: [],
          preferences: [],
          experience: null,
          experienceType: 'fresher',
          education: null,
          educationEntries: [],
          skillLevel: null,
          xp: 0,
          streak: 0,
        },
      });

      // Create refresh token with Prisma (retry once on unlikely token collision)
      let refreshTokenStr = generateRefreshToken(created.id);
      try {
        await prisma.refreshToken.create({
          data: {
            token: refreshTokenStr,
            userId: created.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002') {
          // Token collision - generate a new token and retry once
          refreshTokenStr = generateRefreshToken(created.id);
          await prisma.refreshToken.create({
            data: {
              token: refreshTokenStr,
              userId: created.id,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        } else {
          throw err;
        }
      }

      // Try non-blocking snapshot upsert; do not fail registration if this fails
      try {
        await this.upsertCurrentUserSnapshot(
          {
            _id: new ObjectId(created.id),
            email: created.email,
            fullName: created.fullName,
            role: created.role,
            age: created.age ?? null,
            location: created.location ?? null,
            phone: created.phone ?? null,
            linkedin: created.linkedin ?? null,
            skills: Array.isArray(created.skills) ? created.skills : [],
            interests: Array.isArray(created.interests) ? created.interests : [],
            preferences: Array.isArray(created.preferences) ? created.preferences : [],
            experience: created.experience ?? null,
            experienceType: created.experienceType ?? null,
            education: created.education ?? null,
            educationEntries: created.educationEntries ?? [],
            skillLevel: created.skillLevel ?? null,
            xp: created.xp ?? 0,
            streak: created.streak ?? 0,
            createdAt: created.createdAt ?? now,
            updatedAt: created.updatedAt ?? now,
          } as any,
          true,
          now
        );
      } catch (snapshotErr: any) {
        console.warn('Non-blocking snapshot upsert failed:', snapshotErr?.message || String(snapshotErr));
      }

      const accessToken = generateAccessToken({
        id: created.id,
        email: created.email,
        role: 'USER',
      });

      return {
        user: buildUserSession(created as any),
        accessToken,
        refreshToken: refreshTokenStr,
      };
    } catch (error: any) {
      console.error('[AuthService.register] error while creating user via Prisma:', error);
      if (error?.code === 'P2002' || error?.code === 11000) {
        throw new ConflictError('Email already registered');
      }
      throw error;
    }
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await comparePasswords(input.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN',
    });

    let refreshToken = generateRefreshToken(user.id);

    // Use MongoDB driver directly to avoid transaction requirement
    try {
      // Create refresh token via Prisma to avoid MongoClient SRV DNS issues
      try {
        await prisma.refreshToken.create({
          data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002') {
          // Collision - try once with a fresh token
          refreshToken = generateRefreshToken(user.id);
          await prisma.refreshToken.create({
            data: {
              token: refreshToken,
              userId: user.id,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        } else {
          throw err;
        }
      }

      // Attempt to update snapshot but do not fail login if snapshot upsert fails
      try {
        await this.upsertCurrentUserSnapshot(
          {
            _id: new ObjectId(user.id),
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            age: user.age ?? null,
            location: user.location ?? null,
            phone: user.phone ?? null,
            linkedin: user.linkedin ?? null,
            skills: Array.isArray(user.skills) ? user.skills : [],
            interests: Array.isArray(user.interests) ? user.interests : [],
            preferences: Array.isArray(user.preferences) ? user.preferences : [],
            experience: user.experience ?? null,
            experienceType: user.experienceType ?? null,
            education: user.education ?? null,
            educationEntries: user.educationEntries ?? [],
            skillLevel: user.skillLevel ?? null,
            xp: user.xp ?? 0,
            streak: user.streak ?? 0,
            createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
            updatedAt: new Date(),
          } as any,
          true,
          new Date()
        );
      } catch (snapshotErr) {
        console.warn('Non-blocking snapshot upsert failed during login:', (snapshotErr as any)?.message || snapshotErr);
      }
    } catch (error: any) {
      console.error('Failed to save refresh token via Prisma:', error);
      throw error;
    }

    return {
      user: buildUserSession(user as any),
      accessToken,
      refreshToken,
    };
  }

  async loginWithOAuth(profile: OAuthUserProfile) {
    try {
      console.log('=== OAUTH LOGIN DEBUG ===');
      console.log('prisma:', prisma);
      console.log('prisma.user:', prisma?.user);
      console.log('prisma.socialAccount:', prisma?.socialAccount);
      console.log('profile:', profile);
      console.log('OAuth login entered');

      if (!profile.email) {
        throw new BadRequestError('OAuth provider did not return an email address');
      }

      if (!profile.providerId) {
        throw new BadRequestError('OAuth provider did not return a provider identifier');
      }

      const avatar = profile.avatar ?? null;
      const emailVerified = profile.emailVerified ?? true;
      const fullName = profile.fullName || profile.email.split('@')[0] || 'Pragyan User';
      const now = new Date();

      // First, check for an existing SocialAccount linking this provider id
      let user = null as any;
      console.log(Object.keys(prisma));
      console.log('user:', prisma.user);
      console.log('socialAccount:', (prisma as any).socialAccount);
      console.log('Prisma object:', prisma);
      console.log('prisma.user exists:', !!prisma.user);
      console.log('prisma.socialAccount exists:', !!(prisma as any).socialAccount);
      // @ts-ignore
      console.log('Prisma client version:', (prisma as any)._clientVersion ?? 'unknown');
      const existingSocial = await (prisma as any).socialAccount.findFirst({
        where: { provider: profile.provider, providerId: profile.providerId },
      });

      if (existingSocial) {
        console.log('Prisma object:', prisma);
        console.log('prisma.user exists:', !!prisma.user);
        console.log('prisma.socialAccount exists:', !!(prisma as any).socialAccount);
        // @ts-ignore
        console.log('Prisma client version:', (prisma as any)._clientVersion ?? 'unknown');
        user = await prisma.user.findUnique({ where: { id: existingSocial.userId } });
      }

      // If not found via social account, fall back to matching by email
      if (!user) {
        console.log('Prisma object:', prisma);
        console.log('prisma.user exists:', !!prisma.user);
        console.log('prisma.socialAccount exists:', !!(prisma as any).socialAccount);
        // @ts-ignore
        console.log('Prisma client version:', (prisma as any)._clientVersion ?? 'unknown');
        user = await prisma.user.findFirst({ where: { email: profile.email } });
      }

      if (user) {
        console.log('Prisma object:', prisma);
        console.log('prisma.user exists:', !!prisma.user);
        console.log('prisma.socialAccount exists:', !!(prisma as any).socialAccount);
        // @ts-ignore
        console.log('Prisma client version:', (prisma as any)._clientVersion ?? 'unknown');
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            fullName: user.fullName || fullName,
            provider: profile.provider,
            providerId: profile.providerId,
            avatar,
            emailVerified,
            updatedAt: now,
          },
        });
      } else {
        const hashedPassword = await hashPassword(randomBytes(32).toString('hex'));
        console.log('Prisma object:', prisma);
        console.log('prisma.user exists:', !!prisma.user);
        console.log('prisma.socialAccount exists:', !!(prisma as any).socialAccount);
        // @ts-ignore
        console.log('Prisma client version:', (prisma as any)._clientVersion ?? 'unknown');
        user = await prisma.user.create({
          data: {
            email: profile.email,
            fullName,
            password: hashedPassword,
            provider: profile.provider,
            providerId: profile.providerId,
            avatar,
            emailVerified,
            role: 'USER',
            age: null,
            location: null,
            phone: null,
            linkedin: null,
            skills: [],
            interests: [],
            preferences: [],
            experience: null,
            experienceType: 'fresher',
            education: null,
            educationEntries: [],
            skillLevel: null,
            xp: 0,
            streak: 0,
          },
        });
      }

      console.log('[OAuth:loginWithOAuth]', {
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email,
        action: user ? 'updated' : 'created',
        userId: user.id,
      });

      let refreshToken = generateRefreshToken(user.id);
      try {
        console.log('Prisma object:', prisma);
        console.log('prisma.user exists:', !!prisma.user);
        console.log('prisma.socialAccount exists:', !!(prisma as any).socialAccount);
        // @ts-ignore
        console.log('Prisma client version:', (prisma as any)._clientVersion ?? 'unknown');
        await prisma.refreshToken.create({
          data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002') {
          refreshToken = generateRefreshToken(user.id);
          await prisma.refreshToken.create({
            data: {
              token: refreshToken,
              userId: user.id,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        } else {
          throw err;
        }
      }

      try {
        await this.upsertCurrentUserSnapshot(
          {
            _id: new ObjectId(user.id),
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            age: user.age ?? null,
            location: user.location ?? null,
            phone: user.phone ?? null,
            linkedin: user.linkedin ?? null,
            skills: Array.isArray(user.skills) ? user.skills : [],
            interests: Array.isArray(user.interests) ? user.interests : [],
            preferences: Array.isArray(user.preferences) ? user.preferences : [],
            experience: user.experience ?? null,
            experienceType: user.experienceType ?? null,
            education: user.education ?? null,
            educationEntries: user.educationEntries ?? [],
            skillLevel: user.skillLevel ?? null,
            xp: user.xp ?? 0,
            streak: user.streak ?? 0,
            createdAt: user.createdAt ?? now,
            updatedAt: user.updatedAt ?? now,
          } as any,
          true,
          now
        );
      } catch (snapshotErr) {
        console.warn('Non-blocking snapshot upsert failed during OAuth login:', (snapshotErr as any)?.message || snapshotErr);
      }

      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role as 'USER' | 'ADMIN',
      });

      return {
        user: buildUserSession(user as any),
        accessToken,
        refreshToken,
      };
    } catch (err) {
      console.error('OAUTH LOGIN ERROR');
      console.error(err);
      console.error((err as any)?.stack);
      throw err;
    }
  }

  async linkProviderToUser(userId: string, profile: OAuthUserProfile) {
    if (!profile.providerId) {
      throw new BadRequestError('OAuth provider did not return a provider identifier');
    }

    // Check if providerId already linked to another user
    console.log('Prisma object:', prisma);
    console.log('prisma.user exists:', !!prisma.user);
    console.log('prisma.socialAccount exists:', !!(prisma as any).socialAccount);
    // @ts-ignore
    console.log('Prisma client version:', (prisma as any)._clientVersion ?? 'unknown');
    const existing = await (prisma as any).socialAccount.findFirst({
      where: { provider: profile.provider, providerId: profile.providerId },
    });

    if (existing && existing.userId !== userId) {
      throw new ConflictError('This social account is already linked to another user');
    }

    // Upsert social account for this user
    const now = new Date();

    console.log('Prisma object:', prisma);
    console.log('prisma.user exists:', !!prisma.user);
    console.log('prisma.socialAccount exists:', !!(prisma as any).socialAccount);
    // @ts-ignore
    console.log('Prisma client version:', (prisma as any)._clientVersion ?? 'unknown');
    await (prisma as any).socialAccount.upsert({
      where: existing ? { id: existing.id } : { provider_providerId: { provider: profile.provider, providerId: profile.providerId } },
      create: {
        userId,
        provider: profile.provider,
        providerId: profile.providerId,
        avatar: profile.avatar ?? null,
        emailVerified: profile.emailVerified ?? true,
      },
      update: {
        avatar: profile.avatar ?? null,
        emailVerified: profile.emailVerified ?? true,
      },
    });

    // Optionally update primary user record with avatar/fullName if missing
    console.log('Prisma object:', prisma);
    console.log('prisma.user exists:', !!prisma.user);
    console.log('prisma.socialAccount exists:', !!(prisma as any).socialAccount);
    // @ts-ignore
    console.log('Prisma client version:', (prisma as any)._clientVersion ?? 'unknown');
    await prisma.user.updateMany({
      where: { id: userId },
      data: {
        fullName: { set: profile.fullName || undefined },
        avatar: profile.avatar ?? undefined,
        emailVerified: profile.emailVerified ?? undefined,
        updatedAt: now,
      } as any,
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: userProfileSelect });

    if (!user) throw new NotFoundError('User not found');

    try {
      await this.upsertCurrentUserSnapshot(
        {
          _id: new ObjectId(user.id),
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          age: user.age ?? null,
          location: user.location ?? null,
          phone: user.phone ?? null,
          linkedin: user.linkedin ?? null,
          skills: Array.isArray(user.skills) ? user.skills : [],
          interests: Array.isArray(user.interests) ? user.interests : [],
          preferences: Array.isArray(user.preferences) ? user.preferences : [],
          experience: user.experience ?? null,
          experienceType: user.experienceType ?? null,
          education: user.education ?? null,
          educationEntries: user.educationEntries ?? [],
          skillLevel: user.skillLevel ?? null,
          xp: user.xp ?? 0,
          streak: 0,
          createdAt: user.createdAt ?? now,
          updatedAt: user.updatedAt ?? now,
        } as any,
        true,
        now
      );
    } catch (snapshotErr: any) {
      console.warn('Non-blocking snapshot upsert failed during linking:', snapshotErr?.message || String(snapshotErr));
    }

    return user;
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userProfileSelect,
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Include linked social accounts
    console.log('Prisma object:', prisma);
    console.log('prisma.user exists:', !!prisma.user);
    console.log('prisma.socialAccount exists:', !!(prisma as any).socialAccount);
    // @ts-ignore
    console.log('Prisma client version:', (prisma as any)._clientVersion ?? 'unknown');
    const linked = await (prisma as any).socialAccount.findMany({
      where: { userId },
      select: { provider: true, providerId: true, avatar: true, emailVerified: true },
    });

    return {
      ...user,
      linkedAccounts: linked,
    } as any;
  }

  async updateUserProfile(userId: string, input: ProfileUpdateInput) {
    const data: ProfileUpdateInput = {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.age !== undefined ? { age: input.age } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.linkedin !== undefined ? { linkedin: input.linkedin } : {}),
      ...(input.skills !== undefined ? { skills: input.skills } : {}),
      ...(input.interests !== undefined ? { interests: input.interests } : {}),
      ...(input.preferences !== undefined ? { preferences: input.preferences } : {}),
      ...(input.educationEntries !== undefined ? { educationEntries: input.educationEntries } : {}),
      ...(input.experience !== undefined ? { experience: input.experience } : {}),
      ...(input.experienceType !== undefined ? { experienceType: input.experienceType } : {}),
      ...(input.education !== undefined ? { education: input.education } : {}),
      ...(input.skillLevel !== undefined ? { skillLevel: input.skillLevel } : {}),
    };

    if (Object.keys(data).length === 0) {
      throw new BadRequestError('At least one profile field is required');
    }

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          updatedAt: new Date(),
        } as any,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          age: true,
          location: true,
          phone: true,
          linkedin: true,
          skills: true,
          interests: true,
          preferences: true,
          experience: true,
          experienceType: true,
          education: true,
          skillLevel: true,
          xp: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Non-blocking snapshot upsert
      try {
        await this.upsertCurrentUserSnapshot(
          {
            _id: new ObjectId(updated.id),
            email: updated.email,
            fullName: updated.fullName,
            role: updated.role,
            age: updated.age ?? null,
            location: updated.location ?? null,
            phone: updated.phone ?? null,
            linkedin: updated.linkedin ?? null,
            skills: Array.isArray(updated.skills) ? updated.skills : [],
            interests: Array.isArray(updated.interests) ? updated.interests : [],
            preferences: Array.isArray(updated.preferences) ? updated.preferences : [],
            experience: updated.experience ?? null,
            experienceType: updated.experienceType ?? null,
            education: updated.education ?? null,
            educationEntries: [],
            skillLevel: updated.skillLevel ?? null,
            xp: updated.xp ?? 0,
            streak: 0,
            createdAt: updated.createdAt ?? new Date(),
            updatedAt: updated.updatedAt ?? new Date(),
          } as any,
          true,
          new Date()
        );
      } catch (snapshotErr) {
        console.warn('Non-blocking snapshot upsert failed during profile update:', (snapshotErr as any)?.message || snapshotErr);
      }

      return {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        age: updated.age,
        location: updated.location,
        phone: updated.phone,
        linkedin: updated.linkedin,
        skills: Array.isArray(updated.skills) ? updated.skills : [],
        interests: Array.isArray(updated.interests) ? updated.interests : [],
        preferences: Array.isArray(updated.preferences) ? updated.preferences : [],
        experience: updated.experience,
        experienceType: updated.experienceType,
        education: updated.education,
        skillLevel: updated.skillLevel,
        xp: updated.xp,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        throw new NotFoundError('User not found');
      }
      throw err;
    }
  }

  async refreshAccessToken(refreshToken: string) {
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN',
    });

    return {
      accessToken: newAccessToken,
    };
  }

  async logout(refreshToken: string) {
    // Use MongoDB client directly to avoid transaction requirement
    try {
      const tokenPayload = verifyRefreshToken(refreshToken);

      if (tokenPayload?.id) {
        // Non-blocking snapshot update
        try {
          await this.upsertCurrentUserSnapshot(
            {
              _id: new ObjectId(tokenPayload.id),
              email: '',
              fullName: '',
              role: '',
              age: null,
              location: null,
              phone: null,
              linkedin: null,
              skills: [],
              interests: [],
              preferences: [],
              experience: null,
              experienceType: null,
              education: null,
              educationEntries: [],
              skillLevel: null,
              xp: 0,
              streak: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any,
            false,
            new Date()
          );
        } catch (snapshotErr) {
          console.warn('Non-blocking snapshot update failed during logout:', (snapshotErr as any)?.message || snapshotErr);
        }
      }

      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    } catch (err) {
      console.error('Error during logout token cleanup:', err);
      throw err;
    }
  }
}

export const authService = new AuthService();
