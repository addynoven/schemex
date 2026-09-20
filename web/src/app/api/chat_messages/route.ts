import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/chat_messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];
    const inserted: any[] = [];

    for (const msg of items) {
      const sessionId = Number(msg.session_id) || 1;
      const sender = msg.sender || 'user';
      const content = msg.content || '';
      const citations = Array.isArray(msg.citations) ? msg.citations : [];
      const createdAt = msg.created_at || new Date().toISOString();

      const sql = `
        INSERT INTO chat_messages (session_id, sender, content, citations, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, session_id, sender, content, citations, created_at
      `;

      const res = await query(sql, [sessionId, sender, content, citations, createdAt]);
      if (res.rows[0]) {
        inserted.push(res.rows[0]);
      }
    }

    return NextResponse.json(inserted, { status: 201 });
  } catch (error: any) {
    console.error('Failed to insert chat_messages:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
