import { apiClient } from './apiClient';
import type { MentorChatResponse, MentorConversation, MentorContextSnapshot, MentorMessage } from '@/types/api';

export interface MentorConversationInput {
  conversationId?: string;
  journeyId?: string;
  title?: string;
  context?: MentorContextSnapshot;
}

export interface MentorChatInput {
  conversationId?: string;
  journeyId?: string;
  message: string;
  context?: MentorContextSnapshot;
}

export const mentorService = {
  startConversation(input: MentorConversationInput) {
    return apiClient.post<MentorConversation>('/mentor/conversation', input);
  },

  chat(input: MentorChatInput) {
    return apiClient.post<MentorChatResponse>('/mentor/chat', input);
  },

  getHistory(conversationId: string) {
    return apiClient.get<MentorMessage[]>(`/mentor/history/${encodeURIComponent(conversationId)}`);
  },
};
