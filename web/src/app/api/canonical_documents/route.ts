import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function parseEqParam(val: string | null): string | null {
  if (!val) return null;
  return val.startsWith('eq.') ? decodeURIComponent(val.slice(3)) : val;
}

// GET /api/canonical_documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = parseEqParam(searchParams.get('category'));
    const search = searchParams.get('q') || searchParams.get('query');

    let sql = `
      SELECT 
        id,
        slug,
        name,
        category,
        schemes_count,
        overview,
        issuing_authorities,
        created_at,
        updated_at
      FROM canonical_documents
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (name ILIKE $${params.length} OR overview ILIKE $${params.length})`;
    }

    sql += ` ORDER BY schemes_count DESC, name ASC`;

    const res = await query(sql, params);

    return NextResponse.json({
      total: res.rows.length,
      documents: res.rows,
    });
  } catch (error: any) {
    console.error('Failed to fetch canonical documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch canonical documents', details: error?.message },
      { status: 500 }
    );
  }
}
