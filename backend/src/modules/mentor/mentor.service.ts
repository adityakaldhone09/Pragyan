import { aiProvider } from '@/services/aiProvider';
import { mentorMemoryService } from './mentor.memory.service';
import type { MentorChatInput, MentorContextSnapshot, MentorConversationInput, MentorConversationPayload } from './mentor.types';

function buildPrompt(message: string, context: MentorContextSnapshot, history: Array<{ role: string; content: string }>) {
  return [
    'You are Pragyan AI Career Mentor.',
    'Remember the user context and respond like a personal coach, not a generic chatbot.',
    'Be concise, practical, and action-oriented.',
    'When the user asks for revision, give notes plus a tiny quiz and a mini task.',
    'When the user asks about interviews, give interview prep focused on the current journey.',
    context.career ? `Career: ${context.career}` : '',
    context.roadmap ? `Roadmap: ${context.roadmap}` : '',
    context.currentDay ? `Current day: ${context.currentDay}` : '',
    context.currentGoal ? `Current goal: ${context.currentGoal}` : '',
    context.adaptiveMode ? `Adaptive mode: ${context.adaptiveMode}` : '',
    typeof context.placementReadiness === 'number' ? `Placement readiness: ${context.placementReadiness}%` : '',
    Array.isArray(context.completedSkills) && context.completedSkills.length ? `Completed skills: ${context.completedSkills.join(', ')}` : '',
    Array.isArray(context.weakSkills) && context.weakSkills.length ? `Weak skills: ${context.weakSkills.join(', ')}` : '',
    history.length ? `Conversation history:\n${history.map((entry) => `${entry.role === 'assistant' ? 'Assistant' : 'User'}: ${entry.content}`).join('\n')}` : '',
    `User message: ${message}`,
    'Return only the response text.',
  ].filter(Boolean).join('\n\n');
}

export class MentorService {
  async startConversation(userId: string, input: MentorConversationInput): Promise<MentorConversationPayload> {
    const conversation = await mentorMemoryService.upsertConversation(userId, input);
    const messages = await mentorMemoryService.getHistory(conversation.id, userId);

    return {
      conversationId: conversation.id,
      title: conversation.title,
      journeyId: conversation.journeyId,
      messages,
    };
  }

  async chat(userId: string, input: MentorChatInput) {
    const conversation = await mentorMemoryService.upsertConversation(userId, {
      conversationId: input.conversationId,
      journeyId: input.journeyId,
      context: input.context,
      title: input.context?.career ? `${input.context.career} Mentor` : undefined,
    });

    const history = await mentorMemoryService.getHistory(conversation.id, userId, 24);
    const prompt = buildPrompt(input.message, input.context || {}, history.slice(-8));
    const userMessage = await mentorMemoryService.appendMessage(conversation.id, 'user', input.message, input.context || {});

    try {
      const reply = await (await import('@/services/ai-layers')).aiLayers.generateCreative(prompt);
      await mentorMemoryService.appendMessage(conversation.id, 'assistant', reply, input.context || {});

      return {
        conversationId: conversation.id,
        title: conversation.title,
        reply,
        provider: aiProvider.getRuntime().provider,
        fallbackUsed: false,
        userMessageId: userMessage.id,
      };
    } catch {
      const fallback = input.context?.weakSkills?.length
        ? `Focus on ${input.context.weakSkills[0]} first, then try a short practice task and a 3-question quiz.`
        : 'Review the current day, revise the core concept, and ship one small practice task today.';

      await mentorMemoryService.appendMessage(conversation.id, 'assistant', fallback, input.context || {});

      return {
        conversationId: conversation.id,
        title: conversation.title,
        reply: fallback,
        provider: aiProvider.getRuntime().provider,
        fallbackUsed: true,
        userMessageId: userMessage.id,
      };
    }
  }

  async getHistory(userId: string, conversationId: string) {
    return mentorMemoryService.getHistory(conversationId, userId);
  }
}

export const mentorService = new MentorService();
