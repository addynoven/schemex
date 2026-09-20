import { mmkvStorage } from '../../../core/storage/mmkv';
import type {
  BackendChatMessageResponse,
  BackendChatSessionResponse,
  ChatMessage,
  SchemeRecommendation,
} from '../models/advisor.model';

const CHAT_SESSIONS_STORAGE_KEY = 'local_chat_sessions_v2';
const ACTIVE_SESSION_KEY = 'active_advisor_session_uid';

export interface LocalChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendations?: SchemeRecommendation[];
  citations?: string[];
  sources?: string[];
  synced: boolean;
  createdAt: string;
}

export interface LocalChatSession {
  id: number;
  session_uid: string;
  title: string;
  language_code: string;
  created_at: string;
  updated_at: string;
  synced: boolean;
  messages: LocalChatMessage[];
}

export class ChatStorageService {
  private getRawSessions(): LocalChatSession[] {
    try {
      const raw = mmkvStorage.getString(CHAT_SESSIONS_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private persist(sessions: LocalChatSession[]): void {
    try {
      mmkvStorage.set(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to persist chat sessions locally:', e);
    }
  }

  public getActiveSessionId(): string | null {
    try {
      return mmkvStorage.getString(ACTIVE_SESSION_KEY) || null;
    } catch {
      return null;
    }
  }

  public setActiveSessionId(sessionUid: string | null): void {
    if (sessionUid) {
      mmkvStorage.set(ACTIVE_SESSION_KEY, sessionUid);
    } else {
      mmkvStorage.remove(ACTIVE_SESSION_KEY);
    }
  }

  public getSessions(): BackendChatSessionResponse[] {
    const local = this.getRawSessions();
    return local.map(this.toBackendSessionResponse);
  }

  public getSession(sessionUid: string): BackendChatSessionResponse | null {
    const sessions = this.getRawSessions();
    const found = sessions.find((s) => s.session_uid === sessionUid || String(s.id) === sessionUid);
    if (!found) return null;
    return this.toBackendSessionResponse(found);
  }

  public saveSession(session: Partial<LocalChatSession> & { session_uid: string }): LocalChatSession {
    const sessions = this.getRawSessions();
    const existingIndex = sessions.findIndex((s) => s.session_uid === session.session_uid);

    const now = new Date().toISOString();
    let saved: LocalChatSession;

    if (existingIndex >= 0) {
      const existing = sessions[existingIndex];
      saved = {
        ...existing,
        ...session,
        updated_at: now,
      };
      sessions[existingIndex] = saved;
    } else {
      saved = {
        id: session.id || Date.now(),
        session_uid: session.session_uid,
        title: session.title || 'New Welfare Consultation',
        language_code: session.language_code || 'en',
        created_at: session.created_at || now,
        updated_at: session.updated_at || now,
        synced: session.synced ?? false,
        messages: session.messages || [],
      };
      sessions.unshift(saved);
    }

    this.persist(sessions);
    return saved;
  }

  public addMessage(
    sessionUid: string,
    message: ChatMessage,
    synced: boolean = false
  ): LocalChatMessage {
    let sessions = this.getRawSessions();
    let session = sessions.find((s) => s.session_uid === sessionUid);

    if (!session) {
      session = this.saveSession({ session_uid: sessionUid, title: message.text.slice(0, 40) });
      sessions = this.getRawSessions();
    }

    const localMsg: LocalChatMessage = {
      id: message.id,
      sender: message.sender,
      content: message.text,
      timestamp: message.timestamp,
      recommendations: message.recommendations,
      citations: message.sources,
      sources: message.sources,
      synced,
      createdAt: new Date().toISOString(),
    };

    // Append message if not duplicate
    const existingIdx = session.messages.findIndex((m) => m.id === message.id);
    if (existingIdx >= 0) {
      session.messages[existingIdx] = localMsg;
    } else {
      session.messages.push(localMsg);
    }

    session.updated_at = new Date().toISOString();
    this.persist(sessions);
    return localMsg;
  }

  public deleteSession(sessionUid: string): void {
    const filtered = this.getRawSessions().filter(
      (s) => s.session_uid !== sessionUid && String(s.id) !== sessionUid
    );
    this.persist(filtered);

    if (this.getActiveSessionId() === sessionUid) {
      this.setActiveSessionId(null);
    }
  }

  public getUnsynced(): {
    sessions: LocalChatSession[];
    messages: { sessionUid: string; message: LocalChatMessage }[];
  } {
    const sessions = this.getRawSessions();
    const unsyncedSessions = sessions.filter((s) => !s.synced);

    const unsyncedMessages: { sessionUid: string; message: LocalChatMessage }[] = [];
    for (const s of sessions) {
      for (const m of s.messages) {
        if (!m.synced) {
          unsyncedMessages.push({ sessionUid: s.session_uid, message: m });
        }
      }
    }

    return { sessions: unsyncedSessions, messages: unsyncedMessages };
  }

  public markSynced(sessionUids: string[], messageIds: string[]): void {
    const sessions = this.getRawSessions();
    const sessionUidSet = new Set(sessionUids);
    const messageIdSet = new Set(messageIds);

    let changed = false;
    for (const s of sessions) {
      if (sessionUidSet.has(s.session_uid)) {
        s.synced = true;
        changed = true;
      }
      for (const m of s.messages) {
        if (messageIdSet.has(m.id)) {
          m.synced = true;
          changed = true;
        }
      }
    }

    if (changed) {
      this.persist(sessions);
    }
  }

  public mergeCloudSessions(cloudSessions: BackendChatSessionResponse[]): void {
    const local = this.getRawSessions();
    const localMap = new Map(local.map((s) => [s.session_uid, s]));

    for (const cs of cloudSessions) {
      const uid = cs.session_uid || `cloud_${cs.id}`;
      const existing = localMap.get(uid);

      const cloudMessages: LocalChatMessage[] = (cs.messages || []).map((m) => ({
        id: `msg_cloud_${m.id}`,
        sender: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content,
        timestamp: new Intl.DateTimeFormat('en-IN', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        }).format(new Date(m.created_at || Date.now())),
        citations: m.citations,
        sources: (m.sources || []).map((s) => s.title),
        synced: true,
        createdAt: m.created_at || new Date().toISOString(),
      }));

      if (!existing) {
        // Add new cloud session to local
        local.push({
          id: cs.id,
          session_uid: uid,
          title: cs.title,
          language_code: cs.language_code || 'en',
          created_at: cs.created_at,
          updated_at: cs.updated_at || cs.created_at,
          synced: true,
          messages: cloudMessages,
        });
      } else {
        // Merge messages: keep existing unsynced local messages, add missing cloud messages
        const existingMsgIds = new Set(existing.messages.map((m) => m.id));
        for (const cm of cloudMessages) {
          if (!existingMsgIds.has(cm.id)) {
            existing.messages.push(cm);
          }
        }
        existing.synced = true;
      }
    }

    this.persist(local);
  }

  private toBackendSessionResponse(local: LocalChatSession): BackendChatSessionResponse {
    const msgs: BackendChatMessageResponse[] = local.messages.map((m, idx) => ({
      id: idx + 1,
      session_id: local.id,
      sender: m.sender,
      content: m.content,
      citations: m.citations,
      created_at: m.createdAt,
    }));

    return {
      id: local.id,
      session_uid: local.session_uid,
      title: local.title,
      language_code: local.language_code,
      created_at: local.created_at,
      updated_at: local.updated_at,
      messages: msgs,
    };
  }
}

export const chatStorage = new ChatStorageService();
