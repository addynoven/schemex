import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cacheGet, cacheSet, buildQueryHashKey } from "@/lib/redis";

function parseEqParam(val: string | null): string | null {
  if (!val) return null;
  return val.startsWith("eq.") ? decodeURIComponent(val.slice(3)) : val;
}

// GET /api/schemes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search =
      searchParams.get("q") ||
      searchParams.get("search") ||
      searchParams.get("query");
    const category = parseEqParam(searchParams.get("category"));
    const state = parseEqParam(searchParams.get("state"));
    const sortBy = searchParams.get("sort_by");
    const limit = Math.min(Number(searchParams.get("limit")) || 25, 100);
    const offset = Number(searchParams.get("offset")) || 0;

    // 1. Check Redis cache first (sub-millisecond search & pagination)
    const cacheKey = buildQueryHashKey("cache:schemes:browse", {
      search,
      category,
      state,
      sortBy,
      limit,
      offset,
    });
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    let selectClause = `
      SELECT id, slug, name, name as title, ministry, state, category, description, application_url
    `;
    let sql = `
      FROM schemes 
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let hasRank = false;

    if (search && search.trim()) {
      const term = search.trim();
      params.push(term);
      const ftsParamIndex = params.length;
      params.push(`%${term}%`);
      const ilikeParamIndex = params.length;

      selectClause += `, ts_rank(
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(ministry, '')),
        plainto_tsquery('english', $${ftsParamIndex})
      ) as search_rank`;
      hasRank = true;

      sql += ` AND (
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(ministry, '')) @@ plainto_tsquery('english', $${ftsParamIndex})
        OR name ILIKE $${ilikeParamIndex}
        OR description ILIKE $${ilikeParamIndex}
        OR ministry ILIKE $${ilikeParamIndex}
        OR coalesce(tags, '') ILIKE $${ilikeParamIndex}
      )`;
    }

    if (category && category !== "all" && category !== "All") {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (state && state !== "all" && state !== "All" && state !== "All India") {
      if (state === "ALL_INDIA" || state === "Central Only") {
        sql += ` AND state = 'ALL_INDIA'`;
      } else {
        params.push(state);
        sql += ` AND (state = $${params.length} OR state = 'ALL_INDIA')`;
      }
    }

    // Count total matches
    const countSql = `SELECT count(*) FROM schemes WHERE 1=1 ${sql.replace(/^[\s\S]*?WHERE 1=1/, "")}`;
    const countRes = await query<{ count: string }>(countSql, params);
    const total = Number(countRes.rows[0]?.count || 0);

    // Apply sorting
    let orderClause = ` ORDER BY id ASC`;
    if (sortBy === "id_desc") {
      orderClause = ` ORDER BY id DESC`;
    } else if (hasRank) {
      orderClause = ` ORDER BY search_rank DESC, id ASC`;
    }

    // Apply pagination
    params.push(limit);
    const limitIndex = params.length;
    params.push(offset);
    const offsetIndex = params.length;

    const fullSql = `${selectClause} ${sql} ${orderClause} LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    const res = await query(fullSql, params);

    const payload = {
      items: res.rows,
      schemes: res.rows,
      total,
      limit,
      skip: offset,
      offset,
    };

    // Cache search/browse results in Redis for 1 hour (3600s)
    await cacheSet(cacheKey, payload, 3600);

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Failed to query schemes:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
