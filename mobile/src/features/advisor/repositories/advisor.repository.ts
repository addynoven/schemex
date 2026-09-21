import { AppError } from '../../../core/errors/error-handler';
import { type Result } from '../../../core/errors/result';
import type {
  BackendChatSessionResponse,
  ChatMessage,
  PromptChip,
} from '../models/advisor.model';
import { apiAdvisorRepository } from './advisor.api';

export interface AdvisorRepository {
  getPromptChips(): Promise<Result<PromptChip[], AppError>>;
  listSessions(): Promise<Result<BackendChatSessionResponse[], AppError>>;
  getSession(sessionId: string): Promise<Result<BackendChatSessionResponse, AppError>>;
  createSession(title?: string): Promise<Result<BackendChatSessionResponse, AppError>>;
  deleteSession(sessionId: string): Promise<Result<void, AppError>>;
  askAdvisor(
    query: string,
    sessionId?: string,
    onProgress?: (stepIndex: number) => void,
    history?: readonly ChatMessage[]
  ): Promise<Result<ChatMessage, AppError>>;
}

export const advisorRepository: AdvisorRepository = apiAdvisorRepository;

