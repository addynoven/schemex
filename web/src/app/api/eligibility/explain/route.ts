import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  ProfileContext,
  Rule,
  SchemeRow,
  calculateAge,
  buildExplanation,
} from "@/lib/eligibility-engine";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ProfileContext;
    const context: ProfileContext = { ...payload };
    if (
      typeof payload.date_of_birth === "string" &&
      payload.age === undefined
    ) {
      context.age = calculateAge(payload.date_of_birth);
    }

    const result = await query<SchemeRow>(`
      SELECT
        s.id, s.name, s.slug, s.state, s.ministry, s.description, s.application_url,
        er.field_name, er.operator, er.rule_value,
        b.title AS benefit_title
      FROM schemes s
      LEFT JOIN eligibility_rules er ON er.scheme_id = s.id
      LEFT JOIN scheme_benefits b ON b.scheme_id = s.id
      WHERE s.is_active = true
      ORDER BY s.id ASC
    `);

    const schemes = new Map<
      number,
      SchemeRow & { rules: Rule[]; benefits: string[] }
    >();
    for (const row of result.rows) {
      let scheme = schemes.get(row.id);
      if (!scheme) {
        scheme = { ...row, rules: [], benefits: [] };
        schemes.set(row.id, scheme);
      }
      if (row.field_name && row.operator && row.rule_value) {
        const ruleKey = `${row.field_name}:${row.operator}:${row.rule_value}`;
        if (
          !scheme.rules.some(
            (rule) =>
              `${rule.field_name}:${rule.operator}:${rule.rule_value}` ===
              ruleKey,
          )
        ) {
          scheme.rules.push({
            field_name: row.field_name,
            operator: row.operator,
            rule_value: row.rule_value,
          });
        }
      }
      if (row.benefit_title && !scheme.benefits.includes(row.benefit_title))
        scheme.benefits.push(row.benefit_title);
    }

    const explanations = [...schemes.values()].map((scheme) =>
      buildExplanation(scheme, context),
    );
    const eligible = explanations.filter((item) => item.status === "eligible");
    const nearlyEligible = explanations
      .filter((item) => item.status === "nearly_eligible")
      .sort((a, b) => b.match_percentage - a.match_percentage);
    const ineligible = explanations.filter(
      (item) => item.status === "ineligible",
    );

    return NextResponse.json({
      total_evaluated: explanations.length,
      eligible_count: eligible.length,
      nearly_eligible_count: nearlyEligible.length,
      ineligible_count: ineligible.length,
      eligible_schemes: eligible.slice(0, 150),
      nearly_eligible_schemes: nearlyEligible.slice(0, 60),
      ineligible_schemes: ineligible.slice(0, 20),
    });
  } catch (error) {
    console.error("Failed to evaluate eligibility:", error);
    return NextResponse.json(
      { error: "Failed to evaluate eligibility" },
      { status: 500 },
    );
  }
}
