import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const rawSlug = (await context.params).slug;
    const slug = decodeURIComponent(rawSlug).toLowerCase().trim();

    // 1. Fetch main scheme record from PostgreSQL
    const result = await query(
      "SELECT * FROM schemes WHERE slug = $1 OR LOWER(slug) = $2 OR LOWER(name) = $2 LIMIT 1",
      [rawSlug, slug]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    const scheme = result.rows[0];

    // 2. Query relational database tables using foreign key scheme_id
    const benefitsRes = await query(
      "SELECT id, scheme_id, title, description FROM benefits WHERE scheme_id = $1 ORDER BY id ASC",
      [scheme.id]
    ).catch(() => ({ rows: [] }));

    const rulesRes = await query(
      "SELECT id, scheme_id, field_name, operator, rule_value, description FROM eligibility_rules WHERE scheme_id = $1 ORDER BY id ASC",
      [scheme.id]
    ).catch(() => ({ rows: [] }));

    const docsRes = await query(
      "SELECT id, scheme_id, document_name, is_mandatory, description FROM required_documents WHERE scheme_id = $1 ORDER BY is_mandatory DESC, id ASC",
      [scheme.id]
    ).catch(() => ({ rows: [] }));

    let benefits = benefitsRes.rows || [];
    let eligibility_rules = rulesRes.rows || [];
    let required_documents = docsRes.rows || [];

    // Fallbacks if database relational tables are empty for a scheme
    if (benefits.length === 0) {
      benefits = [
        {
          id: 1,
          title: scheme.benefit_type || "Government Welfare Benefit",
          description:
            scheme.benefit_summary ||
            scheme.description ||
            "Verified government welfare assistance and financial support.",
        },
      ];
    }

    if (eligibility_rules.length === 0) {
      eligibility_rules = [
        {
          id: 1,
          field_name: "state",
          operator: "eq",
          rule_value: scheme.state || "ALL_INDIA",
          description: `Citizen residing in ${
            scheme.state === "ALL_INDIA" ? "any Indian State/UT" : scheme.state
          }.`,
        },
      ];
    }

    if (required_documents.length === 0) {
      required_documents = [
        {
          id: 1,
          document_name: "Aadhaar Card (Identity Proof)",
          is_mandatory: true,
          description: "Aadhaar card linked with active mobile number for e-KYC.",
        },
        {
          id: 2,
          document_name: "Income Certificate",
          is_mandatory: true,
          description: "Issued by Tehsildar / Revenue Authority.",
        },
        {
          id: 3,
          document_name: "Bank Passbook",
          is_mandatory: true,
          description: "Aadhaar-linked bank account passbook for DBT.",
        },
      ];
    }

    return NextResponse.json({
      ...scheme,
      benefits,
      eligibility_rules,
      required_documents,
    });
  } catch (error) {
    console.error("Failed to load scheme details:", error);
    return NextResponse.json(
      { error: "Failed to load scheme details" },
      { status: 500 },
    );
  }
}
