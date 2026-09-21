import test from 'node:test';
import assert from 'node:assert/strict';
import { getLocalDatabase } from '../../../core/database/local-db';
import {
  executeSearchSchemesDirectory,
  executeCheckEligibility,
  executeGetSchemeDetails,
} from '../tools/advisor-tools';
import { executeAgentTurn } from '../services/advisor-agent';
import { apiAdvisorRepository } from '../repositories/advisor.api';
import { chatStorage } from '../storage/chat-storage';
import type { ChatMessage, BackendChatMessageResponse } from '../models/advisor.model';

test('Tool 1: executeSearchSchemesDirectory - filters strictly by state with zero leakage', () => {
  const db = getLocalDatabase();
  const res = executeSearchSchemesDirectory(db, {
    state: 'Goa',
    category: 'Education',
  });

  assert.equal(res.status, 'success');
  assert.ok(res.total_count_in_directory > 0);
  assert.ok(res.sample_schemes.length > 0);

  // Assert all returned sample schemes belong to Goa or are Central / ALL_INDIA schemes
  for (const s of res.sample_schemes) {
    const isGoa = s.tags.some((t) => t.includes('Goa'));
    const isCentral = s.tags.some((t) => t.includes('Central'));
    assert.ok(
      isGoa || isCentral,
      `Scheme '${s.title}' from unexpected state leaked into Goa results`
    );
    // Crucially: never allow Andhra Pradesh or Madhya Pradesh
    assert.equal(s.tags.some((t) => t.includes('Andhra Pradesh')), false);
    assert.equal(s.tags.some((t) => t.includes('Madhya Pradesh')), false);
  }
});

test('Tool 2: executeCheckEligibility - prioritizes target state schemes over generic national ones', () => {
  const db = getLocalDatabase();
  const res = executeCheckEligibility(db, {
    state: 'Goa',
    category: 'Education',
    occupation: 'student',
  });

  assert.equal(res.status, 'success');
  assert.ok(res.total_matched_count > 0);
  assert.ok(res.top_recommendations.length > 0);

  // The first recommendation must be a Goa state scheme
  const firstScheme = res.top_recommendations[0];
  assert.ok(
    firstScheme.title.includes('Goa') || firstScheme.tags.some((t) => t.includes('Goa')),
    `Expected top recommendation to be a Goa scheme, got: ${firstScheme.title}`
  );
});

test('Tool 3: executeGetSchemeDetails - fetches official required documents from SQLite', () => {
  const db = getLocalDatabase();
  const res = executeGetSchemeDetails(db, {
    scheme_slug_or_id: 'goa-post-matric-merit-scholarship',
  });

  assert.equal(res.status, 'success');
  assert.ok(res.scheme);
  assert.equal(res.scheme.title, 'Goa Post-Matric Merit Scholarship');
  assert.ok(res.documents && res.documents.length >= 3);
  assert.ok(res.documents.some((d) => d.name.includes('Aadhaar')));
  assert.ok(res.documents.some((d) => d.name.includes('Marksheet') || d.name.includes('Income')));
});

test('Multi-Turn Conversation: Turn 1 (Goa Inquiry) -> Turn 2 (Follow-up) -> Turn 3 (History Hydration)', async () => {
  const db = getLocalDatabase();
  const sessionId = `test_multiturn_${Date.now()}`;

  // ----------------------------------------------------
  // TURN 1: User asks "any scheme for goa students ?"
  // ----------------------------------------------------
  const turn1Query = 'any scheme for goa students ?';
  const turn1Res = await apiAdvisorRepository.askAdvisor(turn1Query, sessionId);

  assert.ok(turn1Res.ok);
  const aiMsg1 = turn1Res.data;

  assert.equal(aiMsg1.sender, 'assistant');
  assert.ok(aiMsg1.recommendations && aiMsg1.recommendations.length > 0);
  assert.ok(aiMsg1.recommendations.length <= 5);

  // Check state accuracy
  const rec1 = aiMsg1.recommendations[0];
  assert.ok(
    rec1.title.includes('Goa') || rec1.tags.some((t) => t.includes('Goa')),
    `Expected Goa scheme, got: ${rec1.title}`
  );

  // Ensure Andhra Pradesh & MP schemes did NOT leak
  for (const s of aiMsg1.recommendations) {
    assert.equal(s.title.includes('Andhra Pradesh'), false);
    assert.equal(s.title.includes('Medhavi'), false);
  }

  // Verify session title was updated to topic (not generic 'New Welfare Consultation')
  const sessionAfterTurn1 = chatStorage.getSession(sessionId);
  assert.ok(sessionAfterTurn1);
  assert.notEqual(sessionAfterTurn1.title, 'New Welfare Consultation');
  assert.ok(
    sessionAfterTurn1.title.toLowerCase().includes('goa'),
    `Expected session title to mention Goa, got: ${sessionAfterTurn1.title}`
  );

  // ----------------------------------------------------
  // TURN 2: User asks "telling me about the 3 scheme on list how can i apply on it"
  // ----------------------------------------------------
  const history: ChatMessage[] = [
    {
      id: 'msg_u1',
      sender: 'user',
      text: turn1Query,
      timestamp: '10:00 AM',
    },
    aiMsg1,
  ];

  const turn2Query = 'telling me about the 3 scheme on list how can i apply on it';
  const turn2Res = await apiAdvisorRepository.askAdvisor(turn2Query, sessionId, undefined, history);

  assert.ok(turn2Res.ok);
  const aiMsg2 = turn2Res.data;

  // The response must reference the 3 schemes from Turn 1!
  assert.ok(aiMsg2.text.includes(rec1.title) || (aiMsg2.bullets && aiMsg2.bullets.length > 0));
  assert.ok(aiMsg2.documents && aiMsg2.documents.length > 0);
  assert.ok(aiMsg2.documents.some((d) => d.name.includes('Aadhaar')));

  // The recommendations must be preserved for card rendering from Turn 1
  assert.ok(aiMsg2.recommendations && aiMsg2.recommendations.length > 0);
  const turn1Ids = aiMsg1.recommendations.map((r) => r.id);
  assert.ok(
    turn1Ids.includes(aiMsg2.recommendations[0].id),
    `Expected recommendation ${aiMsg2.recommendations[0].id} to be in Turn 1 recommendations: ${turn1Ids.join(', ')}`
  );

  // Crucially: It must NOT jump to unrelated schemes like PM-Kisan or Atal Pension Yojana!
  for (const s of aiMsg2.recommendations) {
    assert.equal(s.id.includes('pm-kisan'), false);
    assert.equal(s.id.includes('atal-pension'), false);
  }

  // ----------------------------------------------------
  // TURN 3: Hydration Roundtrip - Reloading from History
  // ----------------------------------------------------
  const reloadedSession = chatStorage.getSession(sessionId);
  assert.ok(reloadedSession);
  assert.ok(reloadedSession.messages && reloadedSession.messages.length >= 4); // 2 user + 2 assistant

  // Check the last assistant message in reloaded session
  const lastAssistantMsg = reloadedSession.messages.filter((m) => m.sender === 'assistant').pop();
  assert.ok(lastAssistantMsg);

  // Assert recommendations, documents, and follow-ups are preserved in storage!
  assert.ok(
    lastAssistantMsg.recommendations && lastAssistantMsg.recommendations.length > 0,
    'Recommendations were dropped from history storage!'
  );
  assert.equal(lastAssistantMsg.recommendations[0].id, aiMsg2.recommendations[0].id);
  assert.ok(
    lastAssistantMsg.documents && lastAssistantMsg.documents.length > 0,
    'Documents checklist was dropped from history storage!'
  );
  assert.ok(
    lastAssistantMsg.suggestedFollowUps && lastAssistantMsg.suggestedFollowUps.length > 0,
    'Suggested follow-ups were dropped from history storage!'
  );
});

test('Casual Greetings & Out-of-Scope Queries - 0 schemes dumped', async () => {
  const db = getLocalDatabase();

  // Greeting
  const greetingTurn = await executeAgentTurn('namaste, who are you?', [], undefined, db);
  assert.equal(greetingTurn.recommendations, undefined);
  assert.ok(greetingTurn.text.length > 10);
  assert.ok(greetingTurn.suggestedFollowUps && greetingTurn.suggestedFollowUps.length > 0);

  // Out of Scope
  const weatherTurn = await executeAgentTurn('what is the cricket score today?', [], undefined, db);
  assert.equal(weatherTurn.recommendations, undefined);
  assert.ok(weatherTurn.text.length > 10);
});

