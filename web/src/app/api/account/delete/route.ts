import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = Number(body.userId);
    const email = body.email ? String(body.email).trim().toLowerCase() : null;

    if (!userId && !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    // Resolve user ID if only email provided
    let resolvedUserId = userId;
    if (!resolvedUserId && email) {
      const uRes = await query<{ id: number }>('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
      if (uRes.rows[0]) {
        resolvedUserId = uRes.rows[0].id;
      } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // Cascade delete: chat_messages, chat_sessions, user_documents, profiles, users
    await query(
      `DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = $1)`,
      [resolvedUserId]
    );
    await query('DELETE FROM chat_sessions WHERE user_id = $1', [resolvedUserId]);
    await query('DELETE FROM user_documents WHERE user_id = $1', [resolvedUserId]);
    await query('DELETE FROM profiles WHERE user_id = $1', [resolvedUserId]);
    await query('DELETE FROM users WHERE id = $1', [resolvedUserId]);

    return NextResponse.json({
      success: true,
      message: `User ${resolvedUserId} and all associated data permanently purged.`,
      purgedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to purge user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
