import test from 'node:test';
import assert from 'node:assert/strict';
import { chatStorage } from '../storage/chat-storage';
import type { ChatMessage } from '../models/advisor.model';

test('Chat Storage - saves session locally and tracks sync state', () => {
  const sessionUid = `test_sess_${Date.now()}`;
  const saved = chatStorage.saveSession({
    session_uid: sessionUid,
    title: 'Farmer Support Consultation',
    language_code: 'en',
    synced: false,
  });

  assert.equal(saved.session_uid, sessionUid);
  assert.equal(saved.title, 'Farmer Support Consultation');
  assert.equal(saved.synced, false);

  const found = chatStorage.getSession(sessionUid);
  assert.ok(found);
  assert.equal(found.session_uid, sessionUid);
  assert.equal(found.title, 'Farmer Support Consultation');
});

test('Chat Storage - appends messages and marks unsynced correctly', () => {
  const sessionUid = `test_sess_msg_${Date.now()}`;
  chatStorage.saveSession({
    session_uid: sessionUid,
    title: 'Education Grants',
    synced: false,
  });

  const userMsg: ChatMessage = {
    id: `user_m_${Date.now()}`,
    sender: 'user',
    text: 'What scholarships are available?',
    timestamp: '11:00 AM',
  };

  const assistantMsg: ChatMessage = {
    id: `ai_m_${Date.now()}`,
    sender: 'assistant',
    text: 'You qualify for National Merit Scholarship.',
    timestamp: '11:01 AM',
    sources: ['scholarships.gov.in'],
  };

  chatStorage.addMessage(sessionUid, userMsg, false);
  chatStorage.addMessage(sessionUid, assistantMsg, false);

  const unsynced = chatStorage.getUnsynced();
  assert.ok(unsynced.sessions.some((s) => s.session_uid === sessionUid));
  assert.ok(unsynced.messages.some((m) => m.message.id === userMsg.id));
  assert.ok(unsynced.messages.some((m) => m.message.id === assistantMsg.id));

  // Mark as synced
  chatStorage.markSynced([sessionUid], [userMsg.id, assistantMsg.id]);

  const afterSync = chatStorage.getUnsynced();
  assert.ok(!afterSync.sessions.some((s) => s.session_uid === sessionUid));
  assert.ok(!afterSync.messages.some((m) => m.message.id === userMsg.id));
});

test('Chat Storage - merges cloud sessions seamlessly', () => {
  const cloudSessionUid = `cloud_sess_${Date.now()}`;
  chatStorage.mergeCloudSessions([
    {
      id: 999,
      session_uid: cloudSessionUid,
      title: 'Pension Schemes from Web',
      language_code: 'hi',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [
        {
          id: 1,
          session_id: 999,
          sender: 'assistant',
          content: 'Atal Pension Yojana details...',
          created_at: new Date().toISOString(),
        },
      ],
    },
  ]);

  const merged = chatStorage.getSession(cloudSessionUid);
  assert.ok(merged);
  assert.equal(merged.title, 'Pension Schemes from Web');
  assert.equal(merged.messages?.length, 1);
  assert.equal(merged.messages?.[0].content, 'Atal Pension Yojana details...');
});

test('Chat Sync Service - executes non-blocking sync cycle with cloud database', async () => {
  const { chatSyncService } = await import('../services/chat-sync.service');

  let notified = false;
  const unsubscribe = chatSyncService.onSyncComplete(() => {
    notified = true;
  });

  await chatSyncService.syncWithCloud();
  assert.strictEqual(notified, true, 'Sync service should notify listeners on cycle completion');
  unsubscribe();
});
