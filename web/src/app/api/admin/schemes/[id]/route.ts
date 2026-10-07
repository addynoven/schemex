import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { loadScheme, requireAdmin } from "@/app/api/admin/schemes/route";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await requireAdmin(request)))
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const id = Number((await context.params).id);
    const body = await request.json();
    const fields = [
      "name",
      "slug",
      "state",
      "category",
      "tags",
      "ministry",
      "description",
      "status",
      "application_url",
      "official_website",
      "launch_date",
    ];
    const assignments: string[] = [];
    const params: unknown[] = [];
    for (const field of fields) {
      if (body[field] !== undefined) {
        params.push(body[field] || null);
        assignments.push(`${field} = $${params.length}`);
      }
    }
    if (assignments.length > 0) {
      params.push(id);
      const updated = await query(
        `UPDATE schemes SET ${assignments.join(", ")}, updated_at = NOW() WHERE id = $${params.length} RETURNING id`,
        params,
      );
      if (updated.rowCount === 0)
        return NextResponse.json(
          { error: "Scheme not found" },
          { status: 404 },
        );
    }
    if (Array.isArray(body.benefits)) {
      await query("DELETE FROM benefits WHERE scheme_id = $1", [id]);
      for (const benefit of body.benefits)
        await query(
          "INSERT INTO benefits (scheme_id, title, description, amount) VALUES ($1, $2, $3, $4)",
          [
            id,
            benefit.title,
            benefit.description || "",
            benefit.amount ?? null,
          ],
        );
    }
    if (Array.isArray(body.eligibility_rules)) {
      await query("DELETE FROM eligibility_rules WHERE scheme_id = $1", [id]);
      for (const rule of body.eligibility_rules)
        await query(
          "INSERT INTO eligibility_rules (scheme_id, field_name, operator, rule_value) VALUES ($1, $2, $3, $4)",
          [id, rule.field_name, rule.operator, rule.rule_value],
        );
    }
    if (Array.isArray(body.required_documents)) {
      await query("DELETE FROM required_documents WHERE scheme_id = $1", [id]);
      for (const document of body.required_documents)
        await query(
          "INSERT INTO required_documents (scheme_id, document_name, is_mandatory, description) VALUES ($1, $2, $3, $4)",
          [
            id,
            document.document_name,
            document.is_mandatory !== false,
            document.description || null,
          ],
        );
    }
    const scheme = await loadScheme(id);
    return scheme
      ? NextResponse.json(scheme)
      : NextResponse.json({ error: "Scheme not found" }, { status: 404 });
  } catch (error) {
    console.error("Failed to update admin scheme:", error);
    return NextResponse.json(
      { error: "Failed to update scheme" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await requireAdmin(request)))
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const id = Number((await context.params).id);
    const result = await query(
      "DELETE FROM schemes WHERE id = $1 RETURNING id",
      [id],
    );
    if (result.rowCount === 0)
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete admin scheme:", error);
    return NextResponse.json(
      { error: "Failed to delete scheme" },
      { status: 500 },
    );
  }
}
