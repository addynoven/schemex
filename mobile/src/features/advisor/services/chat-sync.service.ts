import { config } from '../../../core/config/config';
import { chatStorage, type LocalChatMessage, type LocalChatSession } from '../storage/chat-storage';
import { authStorage } from '../../auth/storage/auth.storage';
import type { BackendChatSessionResponse } from '../models/advisor.model';

export interface PostgrestSessionRow {
  id: number;
  user_id: number;
  title: string;
  language_code: string;
  created_at: string;
  updated_at: string;
  session_uid: string | null;
  chat_messages?: PostgrestMessageRow[];
}

export interface PostgrestMessageRow {
  id: number;
  session_id: number;
  sender: string;
  content: string;
  citations: string[];
  created_at: string;
}

export class ChatSyncService {
  private isSyncing = false;
  private pendingUserId: number | string | null = null;
  private listeners = new Set<() => void>();

  public onSyncComplete(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Synchronizes chat sessions and messages with PostgreSQL cloud database via PostgREST.
   * Completely resilient and offline-first: fails silently if network is disconnected.
   */
  public async syncWithCloud(targetUserId?: number | string): Promise<void> {
    if (this.isSyncing) {
      if (targetUserId) {
        this.pendingUserId = targetUserId;
      }
      return;
    }
    this.isSyncing = true;

    try {
      const baseUrl = config.apiUrl.replace(/\/+$/, '');
      const unsynced = chatStorage.getUnsynced();

      const user = authStorage.getCurrentUser();
      const rawId = targetUserId || user?.id || 1;
      const userId = Number(rawId) || 1;

      // 1. Push unsynced sessions to PostgreSQL
      if (unsynced.sessions.length > 0) {
        const sessionPayload = unsynced.sessions.map((s: LocalChatSession) => ({
          user_id: userId,
          title: s.title,
          language_code: s.language_code || 'en',
          session_uid: s.session_uid,
        }));

        const res = await fetch(`${baseUrl}/chat_sessions?on_conflict=session_uid`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(sessionPayload),
        });

        if (res.ok) {
          const inserted: PostgrestSessionRow[] = await res.json();
          const syncedUids = inserted.map((row) => row.session_uid).filter(Boolean) as string[];
          chatStorage.markSynced(syncedUids, []);

          // Update local session Postgres IDs
          for (const row of inserted) {
            if (row.session_uid) {
              chatStorage.saveSession({
                session_uid: row.session_uid,
                title: row.title,
                id: row.id,
                synced: true,
              });
            }
          }
        }
      }

      // 2. Push unsynced messages to PostgreSQL
      if (unsynced.messages.length > 0) {
        const messagePayload: Array<{
          session_id: number;
          sender: string;
          content: string;
          citations: string[];
          created_at: string;
        }> = [];
        const syncedMsgIds: string[] = [];

        for (const { sessionUid, message } of unsynced.messages) {
          const session = chatStorage.getSession(sessionUid);
          const rawId = session?.id;
          // If session hasn't received a valid PostgreSQL integer ID yet, defer until session sync completes
          if (!rawId || rawId > 2147483647) {
            continue;
          }

          messagePayload.push({
            session_id: rawId,
            sender: message.sender,
            content: message.content,
            citations: message.citations || [],
            created_at: message.createdAt || new Date().toISOString(),
          });
          syncedMsgIds.push(message.id);
        }

        if (messagePayload.length > 0) {
          const res = await fetch(`${baseUrl}/chat_messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify(messagePayload),
          });

          if (res.ok) {
            chatStorage.markSynced([], syncedMsgIds);
          }
        }
      }

      // 3. Pull latest cloud sessions & messages from PostgreSQL to maintain cloud source-of-truth
      const pullUrl = `${baseUrl}/chat_sessions?user_id=eq.${userId}&select=id,user_id,title,language_code,created_at,updated_at,session_uid,chat_messages(id,session_id,sender,content,citations,created_at)&order=created_at.desc&limit=25`;
      const pullRes = await fetch(pullUrl, {
        headers: { Accept: 'application/json' },
      });

      if (pullRes.ok) {
        const rows: PostgrestSessionRow[] = await pullRes.json();
        const cloudSessions: BackendChatSessionResponse[] = rows.map((r) => ({
          id: r.id,
          session_uid: r.session_uid || `cloud_${r.id}`,
          user_id: r.user_id,
          title: r.title,
          language_code: r.language_code || 'en',
          created_at: r.created_at,
          updated_at: r.updated_at,
          messages: (r.chat_messages || []).map((m) => ({
            id: m.id,
            session_id: m.session_id,
            sender: m.sender as any,
            content: m.content,
            intent: undefined,
            citations: m.citations || [],
            sources: (m.citations || []).map((c) => ({
              id: c,
              slug: c,
              title: c,
              snippet: '',
              ministry: '',
            })),
            created_at: m.created_at,
          })),
        }));

        chatStorage.mergeCloudSessions(cloudSessions);
      }
    } catch (err) {
      // Offline / network failure: items remain queued in MMKV with synced: false
      // console.log('[ChatSync] Sync deferred:', err);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
      if (this.pendingUserId != null) {
        const nextId = this.pendingUserId;
        this.pendingUserId = null;
        void this.syncWithCloud(nextId);
      }
    }
  }
}

export const chatSyncService = new ChatSyncService();
