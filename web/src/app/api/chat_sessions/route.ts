import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function parseEqParam(val: string | null): string | null {
  if (!val) return null;
  return val.startsWith('eq.') ? decodeURIComponent(val.slice(3)) : val;
}

// GET /api/chat_sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseEqParam(searchParams.get('user_id'));

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 });
    }

    // Pull sessions along with their messages
    const sessionsRes = await query(
      `SELECT id, user_id, title, language_code, session_uid, created_at, updated_at
       FROM chat_sessions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 30`,
      [Number(userId)]
    );

    const sessions = sessionsRes.rows;
    if (sessions.length === 0) {
      return NextResponse.json([]);
    }

    const sessionIds = sessions.map((s) => s.id);
    const messagesRes = await query(
      `SELECT id, session_id, sender, content, citations, created_at
       FROM chat_messages
       WHERE session_id = ANY($1)
       ORDER BY created_at ASC`,
      [sessionIds]
    );

    const messagesBySession = new Map<number, any[]>();
    for (const msg of messagesRes.rows) {
      const list = messagesBySession.get(msg.session_id) || [];
      list.push(msg);
      messagesBySession.set(msg.session_id, list);
    }

    const enriched = sessions.map((s) => ({
      ...s,
      chat_messages: messagesBySession.get(s.id) || [],
    }));

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error('Failed to query chat_sessions:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/chat_sessions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];
    const results: any[] = [];

    for (const item of items) {
      const userId = Number(item.user_id) || 1;
      const title = item.title || 'Scheme Advisory Chat';
      const languageCode = item.language_code || 'en';
      const sessionUid = item.session_uid || `session_${Date.now()}`;

      const sql = `
        INSERT INTO chat_sessions (user_id, title, language_code, session_uid, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (session_uid) DO UPDATE
          SET title = EXCLUDED.title, updated_at = NOW()
        RETURNING id, user_id, title, language_code, session_uid, created_at, updated_at
      `;

      const res = await query(sql, [userId, title, languageCode, sessionUid]);
      if (res.rows[0]) {
        results.push(res.rows[0]);
      }
    }

    return NextResponse.json(results, { status: 201 });
  } catch (error: any) {
    console.error('Failed to upsert chat_sessions:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
