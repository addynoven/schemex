import { AppError } from '../../../core/errors/error-handler';
import { ok, type Result } from '../../../core/errors/result';
import { getLocalDatabase } from '../../../core/database/local-db';
import { chatStorage } from '../storage/chat-storage';
import { chatSyncService } from '../services/chat-sync.service';
import {
  BackendChatSessionResponse,
  ChatMessage,
  PromptChip,
  SchemeRecommendation,
} from '../models/advisor.model';
import type { AdvisorRepository } from './advisor.repository';
import { executeAgentTurn, type CitizenProfileContext } from '../services/advisor-agent';
import { useAuthStore } from '../../auth/store/useAuthStore';

export const DEFAULT_PROMPT_CHIPS: readonly PromptChip[] = [
  {
    id: 'chip-farmer',
    icon: '🌾',
    label: 'Farmer pump subsidies',
    queryText: 'I am a farmer and I want to know about schemes for drip irrigation.',
  },
  {
    id: 'chip-scholarship',
    icon: '🎓',
    label: 'College scholarships',
    queryText: 'What college scholarships are available for higher education?',
  },
  {
    id: 'chip-maternal',
    icon: '🤱',
    label: 'Maternal allowances',
    queryText: 'What maternal allowances and healthcare support schemes are available for mothers?',
  },
  {
    id: 'chip-pension',
    icon: '🧓',
    label: 'Pension for senior citizens',
    queryText: 'What monthly pension schemes are available for senior citizens?',
  },
];

const ACTIVE_SESSION_STORAGE_KEY = 'active_advisor_session_uid';
const LOCAL_SESSIONS_STORAGE_KEY = 'local_chat_sessions';

interface SchemeSearchRow {
  id: number;
  slug: string;
  title: string;
  ministry: string;
  state: string;
  category: string;
  benefit_summary: string;
  description: string;
}

export class ApiAdvisorRepository implements AdvisorRepository {
  private activeSessionId: string | null = null;

  async getPromptChips(): Promise<Result<PromptChip[], AppError>> {
    try {
      const db = getLocalDatabase();
      const categories = db.getAllSync<{ category: string; count: number }>(
        'SELECT category, COUNT(*) as count FROM schemes WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC LIMIT 4'
      );

      if (categories && categories.length > 0) {
        const iconMap: Record<string, string> = {
          agriculture: '🌾',
          education: '🎓',
          women: '🤱',
          child: '🤱',
          health: '🏥',
          social: '🧓',
          employment: '💼',
          business: '🏢',
        };

        const chips: PromptChip[] = categories.map((c) => {
          const lower = c.category.toLowerCase();
          const matchEntry = Object.entries(iconMap).find(([k]) => lower.includes(k));
          const emoji = matchEntry ? matchEntry[1] : '📋';

          return {
            id: `chip_${lower.replace(/\s+/g, '_')}`,
            label: `${c.category} schemes`,
            queryText: `What schemes are available under ${c.category}?`,
            icon: emoji,
          };
        });

        return ok(chips);
      }
    } catch {
      // ignore
    }

    return ok([...DEFAULT_PROMPT_CHIPS]);
  }

  async listSessions(): Promise<Result<BackendChatSessionResponse[], AppError>> {
    const local = chatStorage.getSessions();
    if (local.length === 0) {
      await chatSyncService.syncWithCloud();
      return ok(chatStorage.getSessions());
    }
    // Non-blocking cloud sync in background
    void chatSyncService.syncWithCloud();
    return ok(local);
  }

  async getSession(sessionId: string): Promise<Result<BackendChatSessionResponse, AppError>> {
    const found = chatStorage.getSession(sessionId);
    if (found) return ok(found);

    return ok({
      id: 1,
      session_uid: sessionId,
      user_id: 1,
      title: 'Welfare Consultation',
      language_code: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    });
  }

  async createSession(title: string = 'New Welfare Consultation'): Promise<Result<BackendChatSessionResponse, AppError>> {
    const id = Date.now();
    const session_uid = `local_chat_${id}`;
    const newSession = chatStorage.saveSession({
      id,
      session_uid,
      title,
      language_code: 'en',
      synced: false,
    });

    chatStorage.setActiveSessionId(session_uid);
    void chatSyncService.syncWithCloud();

    return ok({
      id: newSession.id,
      session_uid: newSession.session_uid,
      title: newSession.title,
      language_code: newSession.language_code,
      created_at: newSession.created_at,
      updated_at: newSession.updated_at,
      messages: [],
    });
  }

  async deleteSession(sessionId: string): Promise<Result<void, AppError>> {
    chatStorage.deleteSession(sessionId);
    void chatSyncService.syncWithCloud();
    return ok(undefined);
  }

  async getOrCreateSession(): Promise<string> {
    const active = chatStorage.getActiveSessionId();
    if (active) {
      return active;
    }

    const sessionRes = await this.createSession('New Welfare Consultation');
    if (sessionRes.ok && sessionRes.data) {
      return sessionRes.data.session_uid || String(sessionRes.data.id);
    }

    return `local_chat_${Date.now()}`;
  }

  setActiveSessionId(sessionId: string | null): void {
    chatStorage.setActiveSessionId(sessionId);
  }

  /**
   * Evaluates query using Native Tool-Augmented Citizen Welfare Advisor.
   * Dispatches tool calls (search_schemes_directory, check_eligibility, get_scheme_details)
   * against local SQLite database with multi-turn conversation memory.
   */
  async askAdvisor(
    query: string,
    sessionId?: string,
    onProgress?: (stepIndex: number) => void,
    history?: readonly ChatMessage[]
  ): Promise<Result<ChatMessage, AppError>> {
    const sessionUid = sessionId || (await this.getOrCreateSession());

    const timeStr = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date());

    // Save user message locally first
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: timeStr,
    };
    chatStorage.addMessage(sessionUid, userMsg, false);

    // Step 1: Understanding query & loading conversation context
    onProgress?.(0);
    const db = getLocalDatabase();

    // Get user profile context
    let userProfile: CitizenProfileContext | undefined;
    try {
      const authUser = useAuthStore.getState().currentUser;
      const authState = useAuthStore.getState().state;
      userProfile = {
        fullName: authUser?.fullName,
        state: authUser?.state || authState,
      };
    } catch {
      // In non-react context
    }

    // Step 2: Executing Agentic Tool-Calling Turn
    onProgress?.(1);
    const conversationHistory = history || [];
    const agentTurn = await executeAgentTurn(query, conversationHistory, userProfile, db);

    // Step 3: Checking eligibility criteria & verifying guidelines
    onProgress?.(2);

    // Step 4: Preparing recommendations & document checklist
    onProgress?.(3);

    const responseTimeStr = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date());

    const msg: ChatMessage = {
      id: `msg_ai_${Date.now()}`,
      sender: 'assistant',
      text: agentTurn.text,
      timestamp: responseTimeStr,
      recommendations: agentTurn.recommendations && agentTurn.recommendations.length > 0 ? agentTurn.recommendations : undefined,
      documents: agentTurn.documents && agentTurn.documents.length > 0 ? agentTurn.documents : undefined,
      bullets: agentTurn.bullets && agentTurn.bullets.length > 0 ? agentTurn.bullets : undefined,
      suggestedFollowUps: agentTurn.suggestedFollowUps,
      sources: agentTurn.sources && agentTurn.sources.length > 0 ? agentTurn.sources : agentTurn.citations,
    };

    // Save assistant response locally
    chatStorage.addMessage(sessionUid, msg, false);

    // Update session title to smart topic if it was default
    if (agentTurn.detectedTopic) {
      const session = chatStorage.getSession(sessionUid);
      if (!session || session.title === 'New Welfare Consultation' || session.title.startsWith('local_chat_')) {
        chatStorage.updateSessionTitle(sessionUid, agentTurn.detectedTopic);
      }
    }

    // Non-blocking background sync to cloud PostgreSQL
    void chatSyncService.syncWithCloud();

    return ok(msg);
  }
}

export const apiAdvisorRepository = new ApiAdvisorRepository();
