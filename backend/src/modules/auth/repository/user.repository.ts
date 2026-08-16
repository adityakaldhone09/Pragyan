/**
 * User Repository
 * Handles all user-related database operations
 * Only CRUD operations - business logic belongs in service
 */

import { PrismaClient, UserRole } from "@prisma/client";
import type { CreateUserData } from "@/shared/auth";

const prisma = new PrismaClient();

export class UserRepository {
  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        recruiterProfile: true,
        placementOfficerProfile: true,
      },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        recruiterProfile: true,
        placementOfficerProfile: true,
      },
    });
  }

  /**
   * Create new user
   * Business rules handled in service (accountStatus, etc)
   */
  async create(data: CreateUserData) {
    const { email, fullName, passwordHash, userRole, accountStatus, organizationId } = data;

    return prisma.user.create({
      data: {
        email,
        fullName,
        password: passwordHash,
        userRole,
        role: this.mapUserRoleToLegacy(userRole), // Temporary for v0.1.0
        accountStatus,
        organizationId,
      },
      include: {
        studentProfile: true,
        recruiterProfile: true,
        placementOfficerProfile: true,
      },
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        studentProfile: true,
        recruiterProfile: true,
        placementOfficerProfile: true,
      },
    });
  }

  /**
   * Update password
   */
  async updatePassword(id: string, passwordHash: string) {
    await prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  }

  /**
   * Verify email - update accountStatus
   */
  async verifyEmail(id: string) {
    return prisma.user.update({
      where: { id },
      data: {
        accountStatus: "ACTIVE",
        status: "ACTIVE",
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      include: {
        studentProfile: true,
        recruiterProfile: true,
        placementOfficerProfile: true,
      },
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Temporary: Map UserRole enum to legacy role string
   * Delete in v0.2.0
   */
  private mapUserRoleToLegacy(userRole: UserRole): string {
    const map: Record<UserRole, string> = {
      ADMIN: "admin",
      PLACEMENT_OFFICER: "placement_officer",
      RECRUITER: "recruiter",
      STUDENT: "student",
    };
    return map[userRole];
  }
}

export const userRepository = new UserRepository();
