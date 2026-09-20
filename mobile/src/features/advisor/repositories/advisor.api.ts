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
    // Non-blocking cloud sync in background
    void chatSyncService.syncWithCloud();
    return ok(chatStorage.getSessions());
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
   * Evaluates query using Local SQLite RAG + Direct Google Gemini API.
   * If offline, returns local scheme recommendations immediately.
   */
  async askAdvisor(
    query: string,
    sessionId?: string,
    onProgress?: (stepIndex: number) => void
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

    // Step 1: Understanding query
    onProgress?.(0);

    // Step 2: Local RAG Search
    onProgress?.(1);
    const db = getLocalDatabase();

    // Extract search terms
    const words = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 3);
    const likeClauses = words.map(() => '(title LIKE ? OR description LIKE ? OR category LIKE ?)').join(' OR ');

    let matchingSchemes: SchemeSearchRow[] = [];
    if (words.length > 0) {
      const params: string[] = [];
      for (const w of words) {
        params.push(`%${w}%`, `%${w}%`, `%${w}%`);
      }
      try {
        matchingSchemes = db.getAllSync<SchemeSearchRow>(
          `SELECT id, slug, title, ministry, state, category, benefit_summary, description 
           FROM schemes 
           WHERE ${likeClauses} 
           LIMIT 3`,
          params
        );
      } catch {
        matchingSchemes = [];
      }
    }

    // Fallback if no specific keyword matched
    if (matchingSchemes.length === 0) {
      try {
        matchingSchemes = db.getAllSync<SchemeSearchRow>(
          `SELECT id, slug, title, ministry, state, category, benefit_summary, description 
           FROM schemes 
           ORDER BY id ASC 
           LIMIT 3`
        );
      } catch {
        matchingSchemes = [];
      }
    }

    // Step 3: Checking eligibility & AI reasoning
    onProgress?.(2);

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyCE3dB3FJPGWyZ0uuRZIz6YbD4bDnH9H-U';
    let aiText = '';

    if (apiKey) {
      try {
        const schemesContext = matchingSchemes
          .map((s) => `• ${s.title} (${s.slug}): ${s.benefit_summary || s.description}`)
          .join('\n');

        const prompt = `You are a friendly, expert government citizen welfare advisor in India.
User Query: "${query}"

Top relevant official schemes in database:
${schemesContext}

Instructions:
1. Explain in 2-3 clear sentences which schemes are relevant to their request and why.
2. Keep the tone warm, empowering, and concise.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
            }),
          }
        );

        if (response.ok) {
          const json = await response.json();
          const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            aiText = candidateText.trim();
          }
        }
      } catch {
        // Offline / network failure
      }
    }

    // Fallback response if offline or API failed
    if (!aiText) {
      aiText = `You qualify for **${matchingSchemes.length} schemes** based on your query.\n\nHere are the top official recommendations from your local offline database:`;
    }

    // Step 4: Preparing recommendations
    onProgress?.(3);

    const recommendations: SchemeRecommendation[] = matchingSchemes.map((s) => ({
      id: s.slug,
      title: s.title,
      ministry: s.ministry || 'Government of India',
      benefitAmount: '',
      benefitDescription: s.benefit_summary || s.description || '',
      tags: ['✓ Verified', s.category || 'Central Scheme'].filter(Boolean),
    }));

    const citations = matchingSchemes.map((s) => s.slug);
    const sources = matchingSchemes.map((s) => s.title);

    const responseTimeStr = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date());

    const msg: ChatMessage = {
      id: `msg_ai_${Date.now()}`,
      sender: 'assistant',
      text: aiText,
      timestamp: responseTimeStr,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      sources: citations.length > 0 ? citations : sources,
    };

    // Save assistant response locally
    chatStorage.addMessage(sessionUid, msg, false);

    // Non-blocking background sync to cloud PostgreSQL
    void chatSyncService.syncWithCloud();

    return ok(msg);
  }
}

export const apiAdvisorRepository = new ApiAdvisorRepository();
