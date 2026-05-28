export type MentorRole = 'user' | 'assistant';

export interface MentorContextSnapshot {
  career?: string;
  roadmap?: string;
  currentDay?: string;
  weakSkills?: string[];
  completedSkills?: string[];
  adaptiveMode?: string;
  currentGoal?: string;
  placementReadiness?: number;
  learningStyle?: string;
}

export interface MentorConversationInput {
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

export interface MentorMessagePayload {
  id: string;
  role: MentorRole;
  content: string;
  createdAt: Date;
  contextSnapshot?: MentorContextSnapshot | null;
}

export interface MentorConversationPayload {
  conversationId: string;
  title: string;
  journeyId?: string | null;
  messages: MentorMessagePayload[];
}
