// src/services/auth.ts

import { prisma } from '@/lib/prisma';
import { MongoClient, ObjectId } from 'mongodb';
import axios from 'axios';
import { getMongoUrl } from '@/config/mongo';
import { randomBytes, randomInt } from 'crypto';
import { PasswordUtil } from '@/utils/password';
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
  tenthBoard: true,
  tenthScore: true,
  twelfthBoard: true,
  twelfthScore: true,
  currentCourse: true,
  cgpa: true,
  xp: true,
  // Phase 1 profile fields
  gender: true,
  country: true,
  state: true,
  city: true,
  username: true,
  bio: true,
  githubUrl: true,
  portfolioWebsite: true,
  dateOfBirth: true,
  preferredCareerDomain: true,
  firstName: true,
  lastName: true,
  currentStatus: true,
  collegeName: true,
  university: true,
  degree: true,
  branch: true,
  currentYear: true,
  expectedGraduationYear: true,
  programmingExperience: true,
  previouslyWorked: true,
  yearsOfExperience: true,
  currentCompany: true,
  currentRole: true,
  careerGoal: true,
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
  tenthBoard?: string | null;
  tenthScore?: string | null;
  twelfthBoard?: string | null;
  twelfthScore?: string | null;
  currentCourse?: string | null;
  cgpa?: string | null;
  xp?: number;
  gender?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  currentStatus?: string | null;
  collegeName?: string | null;
  university?: string | null;
  degree?: string | null;
  branch?: string | null;
  currentYear?: string | null;
  expectedGraduationYear?: number | null;
  programmingExperience?: string | null;
  previouslyWorked?: boolean | null;
  yearsOfExperience?: number | null;
  currentCompany?: string | null;
  currentRole?: string | null;
  careerGoal?: string | null;
  username?: string | null;
  bio?: string | null;
  githubUrl?: string | null;
  portfolioWebsite?: string | null;
  dateOfBirth?: Date | string | null;
  preferredCareerDomain?: string | null;
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
    tenthBoard: user.tenthBoard,
    tenthScore: user.tenthScore,
    twelfthBoard: user.twelfthBoard,
    twelfthScore: user.twelfthScore,
    currentCourse: user.currentCourse,
    cgpa: user.cgpa,
    xp: user.xp ?? 0,
    gender: user.gender,
    country: user.country,
    state: user.state,
    city: user.city,
    firstName: user.firstName,
    lastName: user.lastName,
    currentStatus: user.currentStatus,
    collegeName: user.collegeName,
    university: user.university,
    degree: user.degree,
    branch: user.branch,
    currentYear: user.currentYear,
    expectedGraduationYear: user.expectedGraduationYear,
    programmingExperience: user.programmingExperience,
    previouslyWorked: user.previouslyWorked,
    yearsOfExperience: user.yearsOfExperience,
    currentCompany: user.currentCompany,
    currentRole: user.currentRole,
    careerGoal: user.careerGoal,
    username: user.username,
    bio: user.bio,
    githubUrl: user.githubUrl,
    portfolioWebsite: user.portfolioWebsite,
    dateOfBirth: user.dateOfBirth,
    preferredCareerDomain: user.preferredCareerDomain,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class AuthService {
  private refreshTokenExpiresAt() {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    const crypto = require('crypto');
    let token = generateRefreshToken(userId);
    const familyId = crypto.randomBytes(16).toString('hex');

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await prisma.refreshToken.create({
          data: {
            tokenHash,
            familyId,
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

    const hashedPassword = await PasswordUtil.hash(input.password);
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
          role: input.role || 'STUDENT',
          userRole: (input.role as any) || 'STUDENT',
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
        role: (created.role as 'USER' | 'ADMIN') || 'USER',
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

    const isPasswordValid = await PasswordUtil.verify(input.password, user.password);

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
        const hashedPassword = await PasswordUtil.hash(randomBytes(32).toString('hex'));
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
    // Build update data from all known profile fields including Phase 1
    const data: Record<string, unknown> = {};

    const scalar: (keyof ProfileUpdateInput)[] = [
      'fullName', 'age', 'location', 'phone', 'linkedin', 'experience',
      'experienceType', 'education', 'skillLevel', 'currentTitle', 'careerTrack',
      'tenthBoard', 'tenthScore', 'twelfthBoard', 'twelfthScore',
      'currentCourse', 'cgpa', 'avatar',
      // Phase 1 fields
      'gender', 'country', 'state', 'city', 'firstName', 'lastName',
      'currentStatus', 'collegeName', 'university', 'degree', 'branch',
      'currentYear', 'expectedGraduationYear', 'programmingExperience',
      'previouslyWorked', 'yearsOfExperience', 'currentCompany', 'currentRole',
      'careerGoal', 'username', 'bio', 'githubUrl', 'portfolioWebsite',
      'preferredCareerDomain', 'dateOfBirth',
    ];

    for (const key of scalar) {
      if ((input as any)[key] !== undefined) {
        const value = (input as any)[key];
        if (key === 'dateOfBirth' && value) {
          data[key] = value instanceof Date ? value : new Date(value);
        } else {
          data[key] = value;
        }
      }
    }

    // Array fields
    if (input.skills !== undefined)           data.skills = input.skills;
    if (input.interests !== undefined)        data.interests = input.interests;
    if (input.preferences !== undefined)      data.preferences = input.preferences;
    if (input.educationEntries !== undefined) data.educationEntries = input.educationEntries;

    // Derive fullName from firstName + lastName if fullName not explicitly provided
    if (!data.fullName && (data.firstName || data.lastName)) {
      const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, fullName: true },
      });
      const first = String(data.firstName ?? existing?.firstName ?? '').trim();
      const last  = String(data.lastName  ?? existing?.lastName  ?? '').trim();
      if (first || last) data.fullName = `${first} ${last}`.trim();
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestError('At least one profile field is required');
    }

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { ...data, updatedAt: new Date() } as any,
        select: {
          id: true, fullName: true, email: true, avatar: true, role: true,
          age: true, location: true, phone: true, linkedin: true,
          skills: true, interests: true, preferences: true,
          experience: true, experienceType: true, education: true,
          skillLevel: true, currentTitle: true, careerTrack: true,
          tenthBoard: true, tenthScore: true, twelfthBoard: true, twelfthScore: true,
          currentCourse: true, cgpa: true, xp: true,
          gender: true, country: true, state: true, city: true,
          firstName: true, lastName: true, currentStatus: true,
          collegeName: true, university: true, degree: true, branch: true,
          currentYear: true, expectedGraduationYear: true,
          programmingExperience: true, previouslyWorked: true,
          yearsOfExperience: true, currentCompany: true, currentRole: true,
          careerGoal: true,
          username: true,
          bio: true,
          githubUrl: true,
          portfolioWebsite: true,
          dateOfBirth: true,
          preferredCareerDomain: true,
          createdAt: true, updatedAt: true,
        },
      });

      // Non-blocking snapshot upsert
      void this.upsertCurrentUserSnapshot({
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
      } as any, true, new Date()).catch((e: unknown) =>
        console.warn('[updateUserProfile] snapshot upsert failed:', (e as any)?.message)
      );

      // Invalidate AI context cache
      void import('@/services/contextAggregator')
        .then(({ contextAggregator }) => contextAggregator.invalidate(userId))
        .catch(() => undefined);

      return { ...updated, skills: Array.isArray(updated.skills) ? updated.skills : [] };
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        throw new NotFoundError('User not found');
      }
      throw err;
    }
  }

  async refreshAccessToken(refreshToken: string) {
    const crypto = require('crypto');
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash },
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

    if (!storedToken.expiresAt || storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } }).catch(() => undefined);
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
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

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
    const otpHash = await PasswordUtil.hash(otp);
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

    const isValidOtp = await PasswordUtil.verify(input.otp, record.otpHash);

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
      PasswordUtil.hash(input.newPassword),
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
      const crypto = require('crypto');
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

      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const tokenRecord = await prisma.refreshToken.findFirst({ 
        where: { tokenHash },
        select: { id: true },
      });
      if (tokenRecord) {
        await prisma.refreshToken.delete({ where: { id: tokenRecord.id } }).catch(() => undefined);
      }
    } catch (err) {
      console.error('Error during logout token cleanup:', err);
      throw err;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    // OAuth-only accounts have a random password — disallow change
    if (user.provider !== 'local' && !user.password) {
      throw new BadRequestError('Password cannot be changed for OAuth accounts.');
    }

    const isValid = await PasswordUtil.verify(currentPassword, user.password);
    if (!isValid) throw new UnauthorizedError('Current password is incorrect.');

    const isSame = await PasswordUtil.verify(newPassword, user.password);
    if (isSame) throw new BadRequestError('New password must be different from the current password.');

    // Policy: min 8 chars
    if (newPassword.length < 8) throw new BadRequestError('New password must be at least 8 characters.');

    const hashed = await PasswordUtil.hash(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed, updatedAt: new Date() } });

    // Invalidate all refresh tokens to log out other sessions
    await prisma.refreshToken.deleteMany({ where: { userId } });

    return { message: 'Password updated successfully.' };
  }

  async deleteAccount(userId: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    // Verify password for local accounts
    if (user.provider === 'local') {
      const isValid = await PasswordUtil.verify(password, user.password);
      if (!isValid) throw new UnauthorizedError('Password is incorrect. Account not deleted.');
    }

    // Revoke all tokens first
    await prisma.refreshToken.deleteMany({ where: { userId } });

    // Delete the user (Prisma onDelete: Cascade handles related records)
    await prisma.user.delete({ where: { id: userId } });

    return { message: 'Account permanently deleted.' };
  }
}

export const authService = new AuthService();
