import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { MentorContextSnapshot, MentorMessagePayload, MentorRole } from './mentor.types';

function makeTitle(context?: MentorContextSnapshot, fallback = 'AI Career Mentor') {
  return context?.career ? `${context.career} Mentor` : fallback;
}

function toJsonValue(value: MentorContextSnapshot | Record<string, unknown> | null | undefined): Prisma.InputJsonValue {
  return (value || {}) as Prisma.InputJsonValue;
}

export class MentorMemoryService {
  async createConversation(userId: string, journeyId?: string, context?: MentorContextSnapshot, title?: string) {
    return prisma.mentorConversation.create({
      data: {
        userId,
        journeyId: journeyId || null,
        title: title || makeTitle(context),
        context: toJsonValue(context),
      },
    });
  }

  async getConversation(conversationId: string, userId: string) {
    return prisma.mentorConversation.findFirst({
      where: { id: conversationId, userId },
    });
  }

  async getActiveConversation(userId: string, journeyId?: string) {
    return prisma.mentorConversation.findFirst({
      where: {
        userId,
        ...(journeyId ? { journeyId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async upsertConversation(userId: string, input: { conversationId?: string; journeyId?: string; context?: MentorContextSnapshot; title?: string }) {
    if (input.conversationId) {
      const existing = await this.getConversation(input.conversationId, userId);
      if (existing) {
        return prisma.mentorConversation.update({
          where: { id: existing.id },
          data: {
            journeyId: input.journeyId || existing.journeyId || null,
            title: input.title || existing.title,
            context: toJsonValue(input.context || (existing.context as MentorContextSnapshot) || {}),
          },
        });
      }
    }

    const active = await this.getActiveConversation(userId, input.journeyId);
    if (active) {
      return prisma.mentorConversation.update({
        where: { id: active.id },
        data: {
          journeyId: input.journeyId || active.journeyId || null,
          title: input.title || active.title,
          context: toJsonValue(input.context || (active.context as MentorContextSnapshot) || {}),
        },
      });
    }

    return this.createConversation(userId, input.journeyId, input.context, input.title);
  }

  async appendMessage(conversationId: string, role: MentorRole, content: string, contextSnapshot?: MentorContextSnapshot) {
    return prisma.mentorMessage.create({
      data: {
        conversationId,
        role,
        content,
        contextSnapshot: toJsonValue(contextSnapshot),
      },
    });
  }

  async getHistory(conversationId: string, userId: string, limit = 30): Promise<MentorMessagePayload[]> {
    const conversation = await this.getConversation(conversationId, userId);
    if (!conversation) {
      return [];
    }

    const messages = await prisma.mentorMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse().map((message) => ({
      id: message.id,
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content,
      createdAt: message.createdAt,
      contextSnapshot: (message.contextSnapshot as MentorContextSnapshot) || null,
    }));
  }
}

export const mentorMemoryService = new MentorMemoryService();
