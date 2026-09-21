import { z } from 'zod';

export const PromptChipSchema = z.object({
  id: z.string(),
  icon: z.string(),
  label: z.string(),
  queryText: z.string(),
});

export type PromptChip = z.infer<typeof PromptChipSchema>;

export const SchemeRecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  ministry: z.string(),
  benefitAmount: z.string(),
  benefitDescription: z.string(),
  tags: z.array(z.string()),
  icon: z.string().optional(),
  matchReason: z.string().optional(),
  category: z.string().optional(),
});

export type SchemeRecommendation = z.infer<typeof SchemeRecommendationSchema>;

export const DocumentRequirementSchema = z.object({
  id: z.string(),
  name: z.string(),
  mandatory: z.boolean().default(true),
});

export type DocumentRequirement = z.infer<typeof DocumentRequirementSchema>;

export const ThinkingStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['pending', 'active', 'completed']),
});

export type ThinkingStep = z.infer<typeof ThinkingStepSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  sender: z.enum(['user', 'assistant']),
  text: z.string(),
  timestamp: z.string(),
  recommendations: z.array(SchemeRecommendationSchema).optional(),
  documents: z.array(DocumentRequirementSchema).optional(),
  bullets: z.array(z.string()).optional(),
  sources: z.array(z.string()).optional(),
  suggestedFollowUps: z.array(z.string()).optional(),
  followUpPrompt: z.string().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatSessionSchema = z.object({
  id: z.number(),
  session_uid: z.string(),
  title: z.string(),
  language_code: z.string().default('en'),
  created_at: z.string(),
  updated_at: z.string().optional(),
  message_count: z.number().optional(),
});

export type ChatSession = z.infer<typeof ChatSessionSchema>;

export interface BackendSource {
  title: string;
  slug: string;
  summary?: string;
  category?: string;
  state?: string;
  jurisdiction?: string;
}

export interface BackendChatMessageResponse {
  id: number;
  session_id: number;
  sender: string;
  content: string;
  language_code?: string;
  status?: string;
  intent?: string;
  citations?: string[];
  sources?: BackendSource[];
  recommendations?: SchemeRecommendation[];
  documents?: DocumentRequirement[];
  suggestedFollowUps?: string[];
  created_at: string;
}

export interface BackendChatSessionResponse {
  id: number;
  session_uid?: string;
  user_id?: number | null;
  title: string;
  language_code?: string;
  created_at: string;
  updated_at?: string;
  messages?: BackendChatMessageResponse[];
}

