import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function parseEqParam(val: string | null): string | null {
  if (!val) return null;
  return val.startsWith('eq.') ? decodeURIComponent(val.slice(3)) : val;
}

// GET /api/schemes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || searchParams.get('query');
    const category = parseEqParam(searchParams.get('category'));
    const state = parseEqParam(searchParams.get('state'));
    const limit = Math.min(Number(searchParams.get('limit')) || 25, 100);
    const offset = Number(searchParams.get('offset')) || 0;

    let sql = `
      SELECT id, slug, name as title, ministry, state, category, description, application_url 
      FROM schemes 
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length} OR ministry ILIKE $${params.length})`;
    }

    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (state && state !== 'all') {
      params.push(state);
      sql += ` AND (state = $${params.length} OR state = 'ALL_INDIA')`;
    }

    // Count total
    const countSql = `SELECT count(*) FROM (${sql}) AS filtered_schemes`;
    const countRes = await query<{ count: string }>(countSql, params);
    const total = Number(countRes.rows[0]?.count || 0);

    // Apply pagination
    params.push(limit);
    sql += ` ORDER BY id ASC LIMIT $${params.length}`;
    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const res = await query(sql, params);

    return NextResponse.json({
      total,
      limit,
      offset,
      schemes: res.rows,
    });
  } catch (error: any) {
    console.error('Failed to query schemes:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
