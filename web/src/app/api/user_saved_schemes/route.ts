import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function parseEqParam(val: string | null): string | null {
  if (!val) return null;
  return val.startsWith('eq.') ? decodeURIComponent(val.slice(3)) : val;
}

// GET /api/user_saved_schemes?user_id=eq.4
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseEqParam(searchParams.get('user_id'));

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 });
    }

    const res = await query(
      `SELECT id, user_id, scheme_slug, created_at
       FROM user_saved_schemes
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [Number(userId)]
    );

    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Failed to get user_saved_schemes:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/user_saved_schemes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];
    const results: any[] = [];

    for (const item of items) {
      const userId = Number(item.user_id);
      const schemeSlug = String(item.scheme_slug || '').trim();

      if (!userId || !schemeSlug) continue;

      const sql = `
        INSERT INTO user_saved_schemes (user_id, scheme_slug, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id, scheme_slug) DO NOTHING
        RETURNING id, user_id, scheme_slug, created_at
      `;

      const res = await query(sql, [userId, schemeSlug]);
      if (res.rows[0]) {
        results.push(res.rows[0]);
      } else {
        // Fetch existing if conflict
        const existing = await query(
          `SELECT id, user_id, scheme_slug, created_at FROM user_saved_schemes WHERE user_id = $1 AND scheme_slug = $2`,
          [userId, schemeSlug]
        );
        if (existing.rows[0]) {
          results.push(existing.rows[0]);
        }
      }
    }

    return NextResponse.json(results, { status: 201 });
  } catch (error: any) {
    console.error('Failed to post user_saved_schemes:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/user_saved_schemes?user_id=eq.4&scheme_slug=eq.pm-kisan
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = parseEqParam(searchParams.get('user_id'));
    let schemeSlug = parseEqParam(searchParams.get('scheme_slug'));

    if (!userId || !schemeSlug) {
      // Check body
      try {
        const body = await request.json();
        if (body) {
          userId = userId || (body.user_id ? String(body.user_id) : null);
          schemeSlug = schemeSlug || body.scheme_slug;
        }
      } catch {
        // no body
      }
    }

    if (!userId || !schemeSlug) {
      return NextResponse.json({ error: 'Missing user_id or scheme_slug' }, { status: 400 });
    }

    await query(
      `DELETE FROM user_saved_schemes WHERE user_id = $1 AND scheme_slug = $2`,
      [Number(userId), schemeSlug]
    );

    return NextResponse.json({ success: true, deleted: { user_id: Number(userId), scheme_slug: schemeSlug } });
  } catch (error: any) {
    console.error('Failed to delete user_saved_schemes:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
