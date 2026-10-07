import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/legacy-auth";

export async function requireAdmin(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  return user?.role === "admin" ? user : null;
}

export async function loadScheme(id: number) {
  const schemeResult = await query("SELECT * FROM schemes WHERE id = $1", [id]);
  if (schemeResult.rowCount === 0) return null;
  const [benefits, rules, documents] = await Promise.all([
    query(
      "SELECT id, title, description, amount FROM benefits WHERE scheme_id = $1 ORDER BY id",
      [id],
    ),
    query(
      "SELECT id, field_name, operator, rule_value FROM eligibility_rules WHERE scheme_id = $1 ORDER BY id",
      [id],
    ),
    query(
      "SELECT id, document_name, is_mandatory, description FROM required_documents WHERE scheme_id = $1 ORDER BY id",
      [id],
    ),
  ]);
  return {
    ...schemeResult.rows[0],
    benefits: benefits.rows,
    eligibility_rules: rules.rows,
    required_documents: documents.rows,
    official_sources: [],
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request)))
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 200);
    const offset = Number(searchParams.get("skip")) || 0;
    const filters: string[] = [];
    const params: unknown[] = [];
    for (const field of ["state", "category", "status"]) {
      const value = searchParams.get(field);
      if (value && value !== "All") {
        params.push(value);
        filters.push(`${field} = $${params.length}`);
      }
    }
    const search = searchParams.get("search");
    if (search) {
      params.push(`%${search}%`);
      filters.push(
        `(name ILIKE $${params.length} OR slug ILIKE $${params.length} OR ministry ILIKE $${params.length})`,
      );
    }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const count = await query<{ count: string }>(
      `SELECT count(*) FROM schemes ${where}`,
      params,
    );
    params.push(limit, offset);
    const rows = await query(
      `SELECT * FROM schemes ${where} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    const items = await Promise.all(rows.rows.map((row) => loadScheme(row.id)));
    return NextResponse.json({
      items,
      total: Number(count.rows[0]?.count || 0),
      skip: offset,
      limit,
    });
  } catch (error) {
    console.error("Failed to list admin schemes:", error);
    return NextResponse.json(
      { error: "Failed to list admin schemes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request)))
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const body = await request.json();
    const result = await query(
      `
      INSERT INTO schemes (name, slug, state, category, tags, ministry, description, status, application_url, official_website, launch_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `,
      [
        body.name,
        body.slug,
        body.state || "ALL_INDIA",
        body.category || "General",
        body.tags || null,
        body.ministry,
        body.description,
        body.status || "draft",
        body.application_url || null,
        body.official_website || null,
        body.launch_date || null,
      ],
    );
    const id = result.rows[0].id;
    for (const benefit of body.benefits || [])
      await query(
        "INSERT INTO benefits (scheme_id, title, description, amount) VALUES ($1, $2, $3, $4)",
        [id, benefit.title, benefit.description || "", benefit.amount ?? null],
      );
    for (const rule of body.eligibility_rules || [])
      await query(
        "INSERT INTO eligibility_rules (scheme_id, field_name, operator, rule_value) VALUES ($1, $2, $3, $4)",
        [id, rule.field_name, rule.operator, rule.rule_value],
      );
    for (const document of body.required_documents || [])
      await query(
        "INSERT INTO required_documents (scheme_id, document_name, is_mandatory, description) VALUES ($1, $2, $3, $4)",
        [
          id,
          document.document_name,
          document.is_mandatory !== false,
          document.description || null,
        ],
      );
    return NextResponse.json(await loadScheme(id), { status: 201 });
  } catch (error) {
    console.error("Failed to create admin scheme:", error);
    return NextResponse.json(
      { error: "Failed to create scheme" },
      { status: 500 },
    );
  }
}
