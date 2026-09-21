import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function deriveBenefitType(title: string, desc: string, tags?: string): 'loan' | 'subsidy' | 'cash_grant' {
  const text = `${title || ''} ${desc || ''} ${tags || ''}`.toLowerCase();
  if (/\b(loan|loans|micro-credit|mudra|interest subvention|working capital|credit guarantee|overdraft|collateral-free|lending|borrower)\b/.test(text)) {
    return 'loan';
  }
  if (/\b(subsidy|subsidized|toolkit|tablet|laptop|solar pump|e-vehicle|tractor|housing|pucca house|construction|lpg|machinery|equipment|concession|rebate|food)\b/.test(text)) {
    return 'subsidy';
  }
  return 'cash_grant';
}

// GET /api/schemes/sync?since=<epoch_seconds_or_iso>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sinceRaw = searchParams.get('since');
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500);

    let sinceDate: Date;
    if (sinceRaw) {
      if (/^\d+$/.test(sinceRaw.trim())) {
        // Numeric timestamp (seconds or ms)
        const num = Number(sinceRaw.trim());
        sinceDate = new Date(num > 10000000000 ? num : num * 1000);
      } else {
        sinceDate = new Date(sinceRaw);
      }
    } else {
      sinceDate = new Date(0); // Return all if no since specified
    }

    const sql = `
      SELECT 
        s.id,
        s.slug,
        s.name AS title,
        s.ministry,
        s.state,
        s.category,
        CASE WHEN s.state = 'ALL_INDIA' THEN 1 ELSE 0 END AS is_central,
        COALESCE(
          (SELECT b.title || ': ' || b.description FROM benefits b WHERE b.scheme_id = s.id LIMIT 1),
          s.description
        ) AS benefit_summary,
        (SELECT b.title FROM benefits b WHERE b.scheme_id = s.id LIMIT 1) AS benefit_title,
        (SELECT b.description FROM benefits b WHERE b.scheme_id = s.id LIMIT 1) AS benefit_desc,
        s.tags,
        COALESCE((SELECT COUNT(*) FROM eligibility_rules r WHERE r.scheme_id = s.id), 0)::int AS rules_count,
        COALESCE((SELECT COUNT(*) FROM required_documents d WHERE d.scheme_id = s.id), 0)::int AS docs_count,
        s.application_url,
        s.description,
        COALESCE(s.updated_at, s.created_at)::text AS last_verified_at,
        EXTRACT(EPOCH FROM COALESCE(s.updated_at, s.created_at))::BIGINT AS updated_epoch
      FROM schemes s
      WHERE (s.updated_at > $1 OR s.created_at > $1)
      ORDER BY COALESCE(s.updated_at, s.created_at) ASC
      LIMIT $2;
    `;

    const res = await query(sql, [sinceDate, limit]);

    const schemes = res.rows.map((row: any) => {
      const bType = deriveBenefitType(row.benefit_title, row.benefit_desc, row.tags);
      return {
        id: Number(row.id),
        slug: row.slug,
        title: row.title,
        ministry: row.ministry || 'Government of India',
        state: row.state,
        category: row.category || 'General',
        is_central: Number(row.is_central || 0),
        benefit_summary: row.benefit_summary || '',
        benefit_type: bType,
        rules_count: Number(row.rules_count || 0),
        docs_count: Number(row.docs_count || 0),
        application_url: row.application_url,
        description: row.description || '',
        last_verified_at: row.last_verified_at,
      };
    });

    const canonSql = `
      SELECT id, slug, name, category, schemes_count, overview, issuing_authorities
      FROM canonical_documents
      ORDER BY schemes_count DESC;
    `;
    let canonicalDocuments: any[] = [];
    try {
      const canonRes = await query(canonSql);
      canonicalDocuments = canonRes.rows;
    } catch (cErr) {
      console.warn('Could not query canonical_documents during sync:', cErr);
    }

    const maxEpoch = res.rows.reduce(
      (max: number, r: any) => Math.max(max, Number(r.updated_epoch || 0)),
      Math.floor(sinceDate.getTime() / 1000)
    );

    return NextResponse.json({
      schemes,
      canonical_documents: canonicalDocuments,
      count: schemes.length,
      synced_version: maxEpoch,
      has_more: schemes.length === limit,
    });
  } catch (error: any) {
    console.error('Failed to sync schemes:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
