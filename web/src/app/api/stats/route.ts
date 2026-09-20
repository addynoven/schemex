import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/stats
export async function GET() {
  const start = Date.now();
  try {
    const [schemesCount, usersCount, docsCount, chatsCount, recentUsers, recentSchemes] = await Promise.all([
      query<{ count: string }>('SELECT count(*) FROM schemes'),
      query<{ count: string }>('SELECT count(*) FROM users'),
      query<{ count: string }>('SELECT count(*) FROM user_documents'),
      query<{ count: string }>('SELECT count(*) FROM chat_sessions'),
      query<{ id: number; email: string; citizen_uid: string; is_verified: boolean; created_at: string }>(
        'SELECT id, email, citizen_uid, is_verified, created_at FROM users ORDER BY id DESC LIMIT 5'
      ),
      query<{ id: number; title: string; category: string; state: string }>(
        'SELECT id, name as title, category, state FROM schemes ORDER BY id ASC LIMIT 5'
      ),
    ]);

    const pingMs = Date.now() - start;

    return NextResponse.json({
      status: 'healthy',
      database: 'Aiven PostgreSQL Cloud',
      pingMs,
      counts: {
        schemes: Number(schemesCount.rows[0]?.count || 0),
        users: Number(usersCount.rows[0]?.count || 0),
        documents: Number(docsCount.rows[0]?.count || 0),
        chatSessions: Number(chatsCount.rows[0]?.count || 0),
      },
      recentUsers: recentUsers.rows,
      recentSchemes: recentSchemes.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to query stats:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
