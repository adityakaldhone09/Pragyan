// src/services/auth.ts

import { prisma } from '@/lib/prisma';
import { MongoClient, ObjectId } from 'mongodb';
import axios from 'axios';
import { getMongoUrl } from '@/config/mongo';
import { randomBytes, randomInt } from 'crypto';
import { hashPassword, comparePasswords } from '@/utils/password';
import { sendPasswordResetOTP } from '@/services/emailService';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '@/utils/errors';
import { logSecurityEvent } from '@/security/audit.security';
import {
  RegisterInput,
  LoginInput,
  ProfileUpdateInput,
  ForgotPasswordInput,
  VerifyResetOtpInput,
  ResetPasswordInput,
} from '@/validators/auth';
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
  currentTitle: true,
  careerTrack: true,
  xp: true,
  createdAt: true,
  updatedAt: true,
} as const;

type OAuthProviderKey = 'google' | 'github';

type ProviderConnectionStatus = {
  linked: boolean;
  email?: string;
  username?: string;
  verified?: boolean;
  avatar?: string | null;
};

type ProviderStatusMap = Record<OAuthProviderKey, ProviderConnectionStatus>;

const PASSWORD_RESET_GENERIC_MESSAGE =
  'If an account exists with this email, a verification code has been sent.';
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type GitHubRepositoryPayload = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
  default_branch: string;
  pushed_at: string | null;
};

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
  currentTitle?: string | null;
  careerTrack?: string | null;
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
    currentTitle: user.currentTitle,
    careerTrack: user.careerTrack,
    xp: user.xp ?? 0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class AuthService {
  private refreshTokenExpiresAt() {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    let token = generateRefreshToken(userId);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await prisma.refreshToken.create({
          data: {
            token,
            userId,
            expiresAt: this.refreshTokenExpiresAt(),
          },
        });
        return token;
      } catch (err: any) {
        if (err?.code !== 'P2002' || attempt === 1) {
          throw err;
        }
        token = generateRefreshToken(userId);
      }
    }

    throw new Error('Unable to issue refresh token');
  }

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
    currentTitle: string | null;
    careerTrack: string | null;
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
            currentTitle: user.currentTitle,
            careerTrack: user.careerTrack,
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

  private async syncGitHubRepositories(userId: string, accessToken?: string | null) {
    if (!accessToken) {
      return;
    }

    const response = await axios.get<GitHubRepositoryPayload[]>('https://api.github.com/user/repos', {
      params: {
        per_page: 100,
        sort: 'updated',
        affiliation: 'owner,collaborator,organization_member',
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Pragyan',
      },
    });

    const repositories = Array.isArray(response.data) ? response.data : [];

    await prisma.githubRepository.deleteMany({ where: { userId } });

    if (!repositories.length) {
      return;
    }

    await Promise.all(
      repositories.map((repository) =>
        prisma.githubRepository.create({
          data: {
            userId,
            repoId: String(repository.id),
            name: repository.name,
            fullName: repository.full_name,
            htmlUrl: repository.html_url,
            description: repository.description,
            language: repository.language,
            stars: repository.stargazers_count || 0,
            forks: repository.forks_count || 0,
            isPrivate: Boolean(repository.private),
            defaultBranch: repository.default_branch || null,
            pushedAt: repository.pushed_at ? new Date(repository.pushed_at) : null,
          },
        })
      )
    );
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

      const refreshTokenStr = await this.issueRefreshToken(created.id);

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

    let refreshToken = '';

    // Use MongoDB driver directly to avoid transaction requirement
    try {
      refreshToken = await this.issueRefreshToken(user.id);

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
      const normalizedEmail = profile.email.trim();

      // Resolve the login target by email first so we do not create duplicate users.
      let user = null as any;
      console.log('[OAuth:loginWithOAuth:lookup]', {
        provider: profile.provider,
        providerId: profile.providerId,
        email: normalizedEmail,
        sessionId: (globalThis as any)?.sessionID || undefined,
      });
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      console.log('[OAuth:loginWithOAuth:existingUser]', {
        found: Boolean(existingUser),
        userId: existingUser?.id || null,
        provider: existingUser?.provider || null,
        providerId: existingUser?.providerId || null,
      });

      if (existingUser) {
        console.log('[OAuth:loginWithOAuth:attachExistingUser]', {
          userId: existingUser.id,
          email: existingUser.email,
          hasProviderId: Boolean(existingUser.providerId),
        });
        user = await this.attachOAuthAccountToUser(existingUser.id, {
          ...profile,
          email: normalizedEmail,
          avatar,
          emailVerified,
          fullName: existingUser.fullName || fullName,
        });
      } else {
        const hashedPassword = await hashPassword(randomBytes(32).toString('hex'));
        console.log('[OAuth:loginWithOAuth:createUser]', {
          email: normalizedEmail,
          provider: profile.provider,
          providerId: profile.providerId,
        });
        const created = await prisma.user.create({
          data: {
            email: normalizedEmail,
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

        user = await this.attachOAuthAccountToUser(created.id, {
          ...profile,
          email: normalizedEmail,
          avatar,
          emailVerified,
          fullName,
        });
      }

      console.log('[OAuth:loginWithOAuth]', {
        provider: profile.provider,
        providerId: profile.providerId,
        email: normalizedEmail,
        action: existingUser ? 'login-existing-user' : 'created-new-user',
        userId: user.id,
      });

      console.log('[OAuth:loginWithOAuth:refreshTokenCreate]', {
        userId: user.id,
        provider: profile.provider,
        providerId: profile.providerId,
      });
      const refreshToken = await this.issueRefreshToken(user.id);

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

  private async attachOAuthAccountToUser(userId: string, profile: OAuthUserProfile) {
    const now = new Date();
    const existingAccount = await prisma.socialAccount.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
    });

    console.log('[OAuth:attachOAuthAccountToUser]', {
      userId,
      provider: profile.provider,
      providerId: profile.providerId,
      email: profile.email,
      existingAccountUserId: existingAccount?.userId || null,
      willReassign: Boolean(existingAccount && existingAccount.userId !== userId),
    });

    await prisma.socialAccount.upsert({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
      create: {
        userId,
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email,
        username: profile.username ?? null,
        avatar: profile.avatar ?? null,
        accessToken: profile.accessToken ?? null,
        refreshToken: profile.refreshToken ?? null,
        emailVerified: profile.emailVerified ?? true,
      },
      update: {
        userId,
        email: profile.email,
        username: profile.username ?? null,
        avatar: profile.avatar ?? null,
        accessToken: profile.accessToken ?? null,
        refreshToken: profile.refreshToken ?? null,
        emailVerified: profile.emailVerified ?? true,
      },
    });

    if (profile.provider === 'github') {
      try {
        await this.syncGitHubRepositories(userId, profile.accessToken);
      } catch (syncErr) {
        console.warn('GitHub repository sync failed during OAuth login:', (syncErr as any)?.message || String(syncErr));
      }
    }

    await prisma.user.updateMany({
      where: { id: userId },
      data: {
        provider: profile.provider,
        providerId: profile.providerId,
        fullName: profile.fullName || undefined,
        avatar: profile.avatar ?? undefined,
        emailVerified: profile.emailVerified ?? undefined,
        updatedAt: now,
      } as any,
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userProfileSelect,
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async linkProviderToUser(userId: string, profile: OAuthUserProfile) {
    if (!profile.providerId) {
      throw new BadRequestError('OAuth provider did not return a provider identifier');
    }

    // Check if providerId already linked to another user
    const existing = await prisma.socialAccount.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
    });

    if (existing && existing.userId !== userId) {
      console.log('[OAuth:linkProviderToUser:conflict]', {
        userId,
        existingUserId: existing.userId,
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email,
      });
      throw new ConflictError('Account already linked with different user');
    }

    // Upsert social account for this user
    const now = new Date();

    await prisma.socialAccount.upsert({
      where: existing ? { id: existing.id } : { provider_providerId: { provider: profile.provider, providerId: profile.providerId } },
      create: {
        userId,
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email,
        username: profile.username ?? null,
        avatar: profile.avatar ?? null,
        accessToken: profile.accessToken ?? null,
        refreshToken: profile.refreshToken ?? null,
        emailVerified: profile.emailVerified ?? true,
      },
      update: {
        email: profile.email,
        username: profile.username ?? null,
        avatar: profile.avatar ?? null,
        accessToken: profile.accessToken ?? null,
        refreshToken: profile.refreshToken ?? null,
        emailVerified: profile.emailVerified ?? true,
      },
    });

    if (profile.provider === 'github') {
      try {
        await this.syncGitHubRepositories(userId, profile.accessToken);
      } catch (syncErr) {
        console.warn('GitHub repository sync failed during linking:', (syncErr as any)?.message || String(syncErr));
      }
    }

    // Optionally update primary user record with avatar/fullName if missing
    await prisma.user.updateMany({
      where: { id: userId },
      data: {
        fullName: profile.fullName || undefined,
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

  async getProviderStatus(userId: string) {
    const [socialAccounts, user] = await Promise.all([
      prisma.socialAccount.findMany({
        where: { userId },
        select: {
          provider: true,
          email: true,
          username: true,
          avatar: true,
          emailVerified: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, emailVerified: true },
      }),
    ]);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const status: ProviderStatusMap = {
      google: { linked: false },
      github: { linked: false },
    };

    for (const account of socialAccounts) {
      if (account.provider === 'google' || account.provider === 'github') {
        const provider = account.provider as OAuthProviderKey;
        status[provider] = {
          linked: true,
          email: account.email || user.email,
          username: account.username || undefined,
          verified: Boolean(account.emailVerified),
          avatar: account.avatar ?? null,
        };
      }
    }

    return status;
  }

  async unlinkProviderFromUser(userId: string, provider: OAuthProviderKey) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, provider: true, providerId: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const [existing, linkedCount, linkedAccounts] = await Promise.all([
      prisma.socialAccount.findFirst({
        where: { userId, provider },
      }),
      prisma.socialAccount.count({ where: { userId } }),
      prisma.socialAccount.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, provider: true, providerId: true },
      }),
    ]);

    if (!existing) {
      throw new NotFoundError('Linked account not found');
    }

    if (linkedCount <= 1 && user.provider !== 'local') {
      throw new BadRequestError('You must keep at least one login method linked');
    }

    await prisma.socialAccount.delete({ where: { id: existing.id } });

    const remaining = linkedAccounts.filter((account) => account.id !== existing.id);

    await prisma.user.update({
      where: { id: userId },
      data: {
        provider: remaining[0]?.provider || 'local',
        providerId: remaining[0]?.providerId || null,
        updatedAt: new Date(),
      },
    });

    return this.getProviderStatus(userId);
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
    const linked = await prisma.socialAccount.findMany({
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
          ...(input.currentTitle !== undefined ? { currentTitle: input.currentTitle } : {}),
          ...(input.careerTrack !== undefined ? { careerTrack: input.careerTrack } : {}),
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
          avatar: true,
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
          currentTitle: true,
          careerTrack: true,
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
            currentTitle: updated.currentTitle ?? null,
            careerTrack: updated.careerTrack ?? null,
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
        avatar: updated.avatar,
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
        currentTitle: updated.currentTitle,
        careerTrack: updated.careerTrack,
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

    if (!storedToken) {
      await prisma.refreshToken.deleteMany({ where: { userId: decoded.id } }).catch(() => undefined);
      void logSecurityEvent({
        event: 'TOKEN_REPLAY_DETECTED',
        userId: decoded.id,
        metadata: { reason: 'refresh_token_not_found' },
      });
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => undefined);
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
    const newRefreshToken = await this.issueRefreshToken(user.id);
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });

    void logSecurityEvent({
      event: 'TOKEN_REFRESH',
      userId: user.id,
      metadata: { rotated: true },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async requestPasswordReset(input: ForgotPasswordInput) {
    const email = normalizeEmail(input.email);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { message: PASSWORD_RESET_GENERIC_MESSAGE };
    }

    await prisma.passwordResetOTP.deleteMany({ where: { email } });

    const otp = String(randomInt(100000, 1000000));
    const otpHash = await hashPassword(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await prisma.passwordResetOTP.create({
      data: {
        userId: user.id,
        email,
        otpHash,
        expiresAt,
        attempts: 0,
        verified: false,
      },
    });

    void sendPasswordResetOTP(email, otp).catch((error) => {
      console.error('[AuthService.requestPasswordReset] email delivery failed:', error);
    });

    return { message: PASSWORD_RESET_GENERIC_MESSAGE };
  }

  async verifyResetOtp(input: VerifyResetOtpInput) {
    const email = normalizeEmail(input.email);
    const record = await prisma.passwordResetOTP.findFirst({
      where: {
        email,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new UnauthorizedError('Invalid or expired verification code');
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestError('Too many failed attempts. Please request a new code.');
    }

    const isValidOtp = await comparePasswords(input.otp, record.otpHash);

    if (!isValidOtp) {
      await prisma.passwordResetOTP.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedError('Invalid or expired verification code');
    }

    await prisma.passwordResetOTP.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return { message: 'Verification code confirmed. You can now reset your password.' };
  }

  async resetPassword(input: ResetPasswordInput) {
    const email = normalizeEmail(input.email);
    const record = await prisma.passwordResetOTP.findFirst({
      where: {
        email,
        verified: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestError('Password reset verification is required or has expired');
    }

    const [user, hashedPassword] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      hashPassword(input.newPassword),
    ]);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }),
      prisma.passwordResetOTP.deleteMany({ where: { email } }),
    ]);

    return { message: 'Password reset successfully. You can now sign in with your new password.' };
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
