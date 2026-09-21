import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface VersionRow {
  total_schemes: string;
  last_updated_at: string;
  version: string;
}

// GET /api/schemes/version
export async function GET() {
  try {
    const sql = `
      SELECT 
        COUNT(*)::text AS total_schemes,
        COALESCE(MAX(updated_at), MAX(created_at), NOW())::text AS last_updated_at,
        EXTRACT(EPOCH FROM COALESCE(MAX(updated_at), MAX(created_at), NOW()))::BIGINT::text AS version
      FROM schemes;
    `;

    const res = await query<VersionRow>(sql);
    const row = res.rows[0];

    return NextResponse.json({
      version: Number(row?.version || 0),
      last_updated_at: row?.last_updated_at || new Date().toISOString(),
      total_schemes: Number(row?.total_schemes || 0),
    });
  } catch (error: any) {
    console.error('Failed to get schemes catalog version:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
