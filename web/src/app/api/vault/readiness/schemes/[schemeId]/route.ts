import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ schemeId: string }> },
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("user_id"));
    const schemeId = Number((await context.params).schemeId);
    if (!userId || !schemeId) {
      return NextResponse.json(
        { error: "user_id and scheme id are required" },
        { status: 400 },
      );
    }

    const schemeResult = await query<{
      id: number;
      name: string;
      slug: string;
    }>("SELECT id, name, slug FROM schemes WHERE id = $1", [schemeId]);
    if (schemeResult.rowCount === 0)
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });

    const result = await query<{
      document_name: string;
      description: string | null;
      is_mandatory: boolean;
      document_id: number | null;
      document_file_name: string | null;
    }>(
      `
      SELECT rd.document_name, rd.description, rd.is_mandatory,
             ud.id AS document_id, ud.file_name AS document_file_name
      FROM required_documents rd
      LEFT JOIN user_documents ud
        ON ud.user_id = $1
       AND lower(ud.document_type) = lower(rd.document_name)
      WHERE rd.scheme_id = $2
      ORDER BY rd.id ASC
    `,
      [userId, schemeId],
    );

    const checklist = result.rows.map((row) => ({
      document_name: row.document_name,
      description: row.description,
      is_mandatory: row.is_mandatory,
      status: row.document_id === null ? "missing" : "available",
      matched_vault_document_id: row.document_id,
      matched_vault_document_name: row.document_file_name,
    }));
    const mandatory = checklist.filter((item) => item.is_mandatory);
    const mandatoryAvailable = mandatory.filter(
      (item) => item.status === "available",
    ).length;
    const optional = checklist.filter((item) => !item.is_mandatory);
    const optionalAvailable = optional.filter(
      (item) => item.status === "available",
    ).length;
    const percentage =
      mandatory.length === 0
        ? 100
        : Math.round((mandatoryAvailable / mandatory.length) * 1000) / 10;

    return NextResponse.json({
      scheme_id: schemeId,
      scheme_name: schemeResult.rows[0].name,
      scheme_slug: schemeResult.rows[0].slug,
      is_ready_to_apply: mandatoryAvailable === mandatory.length,
      readiness_percentage: percentage,
      mandatory_total: mandatory.length,
      mandatory_available: mandatoryAvailable,
      optional_total: optional.length,
      optional_available: optionalAvailable,
      checklist,
      summary: `${mandatoryAvailable} of ${mandatory.length} mandatory documents ready.`,
    });
  } catch (error) {
    console.error("Failed to calculate document readiness:", error);
    return NextResponse.json(
      { error: "Failed to calculate document readiness" },
      { status: 500 },
    );
  }
}
