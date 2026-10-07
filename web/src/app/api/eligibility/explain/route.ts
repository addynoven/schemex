import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

type ProfileContext = Record<string, unknown>;
type Rule = {
  field_name: string;
  operator: string;
  rule_value: string;
};
type SchemeRow = {
  id: number;
  name: string;
  slug: string;
  state: string | null;
  ministry: string;
  description: string;
  application_url: string | null;
  field_name: string | null;
  operator: string | null;
  rule_value: string | null;
  benefit_title: string | null;
};

function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const birthdayPassed =
    today.getUTCMonth() > birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() >= birthDate.getUTCDate());
  if (!birthdayPassed) age -= 1;
  return age;
}

function comparableNumber(value: unknown): number | null {
  if (
    typeof value === "boolean" ||
    value === null ||
    value === undefined ||
    value === ""
  )
    return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizedBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true" || value === "yes")
    return true;
  if (value === 0 || value === "0" || value === "false" || value === "no")
    return false;
  return null;
}

function evaluateRule(rule: Rule, context: ProfileContext): boolean {
  const field = rule.field_name.trim().toLowerCase();
  const operator = rule.operator.trim().toLowerCase();
  const target = rule.rule_value.trim();
  const actual = context[field];
  if (actual === undefined || actual === null || actual === "") return false;

  const actualBoolean = normalizedBoolean(actual);
  const targetBoolean = normalizedBoolean(target);
  if (actualBoolean !== null && targetBoolean !== null) {
    if (operator === "eq" || operator === "==")
      return actualBoolean === targetBoolean;
    if (operator === "neq" || operator === "!=")
      return actualBoolean !== targetBoolean;
  }

  const actualNumber = comparableNumber(actual);
  const targetNumber = comparableNumber(target);
  if (operator === "between") {
    const parts = target
      .replace(/to/gi, "-")
      .replace(/,/g, "-")
      .split("-")
      .map((part) => Number(part.trim()));
    if (
      parts.length === 2 &&
      parts.every(Number.isFinite) &&
      actualNumber !== null
    ) {
      return actualNumber >= parts[0] && actualNumber <= parts[1];
    }
  }
  if (actualNumber !== null && targetNumber !== null) {
    if (operator === "eq" || operator === "==")
      return actualNumber === targetNumber;
    if (operator === "neq" || operator === "!=")
      return actualNumber !== targetNumber;
    if (operator === "gt" || operator === ">")
      return actualNumber > targetNumber;
    if (operator === "gte" || operator === ">=")
      return actualNumber >= targetNumber;
    if (operator === "lt" || operator === "<")
      return actualNumber < targetNumber;
    if (operator === "lte" || operator === "<=")
      return actualNumber <= targetNumber;
  }

  const actualString = String(actual).trim().toLowerCase();
  const targetString = target.toLowerCase();
  if (operator === "eq" || operator === "==") {
    return (
      actualString === targetString ||
      ["all", "all_india", "all india"].includes(targetString)
    );
  }
  if (operator === "neq" || operator === "!=")
    return actualString !== targetString;
  if (operator === "in") {
    const allowed = targetString.split(",").map((item) => item.trim());
    return (
      allowed.includes(actualString) ||
      allowed.includes("all") ||
      allowed.includes("all_india")
    );
  }
  if (operator === "not_in" || operator === "nin") {
    return !targetString
      .split(",")
      .map((item) => item.trim())
      .includes(actualString);
  }
  if (operator === "contains") return actualString.includes(targetString);
  return false;
}

function criterionTitle(field: string): string {
  const titles: Record<string, string> = {
    annual_income: "Annual Family Income",
    income: "Annual Family Income",
    age: "Age Requirement",
    gender: "Gender Requirement",
    occupation: "Occupation / Livelihood",
    state: "State Residency",
    district: "District Residency",
    is_bpl: "Below Poverty Line (BPL)",
  };
  return (
    titles[field] ||
    field.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function requiredCondition(rule: Rule): string {
  const field = rule.field_name.trim().toLowerCase();
  const operator = rule.operator.trim().toLowerCase();
  const target = rule.rule_value.trim();
  const targetNumber = comparableNumber(target);
  const formattedTarget =
    targetNumber === null
      ? target
      : `₹${Math.trunc(targetNumber).toLocaleString("en-IN")}`;

  if (field.includes("income")) {
    if (operator === "lte" || operator === "<=")
      return `Maximum ${formattedTarget} per year`;
    if (operator === "lt" || operator === "<")
      return `Less than ${formattedTarget} per year`;
    if (operator === "gte" || operator === ">=")
      return `Minimum ${formattedTarget} per year`;
    if (operator === "gt" || operator === ">")
      return `More than ${formattedTarget} per year`;
  }
  if (field === "age" && operator === "between") {
    const parts = target
      .replace(/to/gi, "-")
      .replace(/,/g, "-")
      .split("-")
      .map((part) => part.trim());
    if (parts.length === 2) return `Between ${parts[0]} and ${parts[1]} years`;
  }
  if (field === "age" && (operator === "lte" || operator === "<="))
    return `Maximum ${target} years old`;
  if (field === "age" && (operator === "gte" || operator === ">="))
    return `Minimum ${target} years old`;
  if (operator === "in")
    return `Must be one of: ${target
      .split(",")
      .map((item) => item.trim())
      .join(", ")}`;
  if (operator === "eq" || operator === "==") {
    if (["all", "all_india", "all india"].includes(target.toLowerCase()))
      return "Open to all residents across India";
    return `Must be ${target}`;
  }
  return `${operator.toUpperCase()} ${target}`;
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "")
    return "Not Provided";
  if (field.includes("income")) {
    const number = comparableNumber(value);
    if (number !== null)
      return `₹${Math.trunc(number).toLocaleString("en-IN")}`;
  }
  if (field === "age") return `${value} years old`;
  return typeof value === "string"
    ? value.trim().replace(/\b\w/g, (letter) => letter.toUpperCase())
    : String(value);
}

function explainRule(rule: Rule, context: ProfileContext) {
  const field = rule.field_name.trim().toLowerCase();
  const title = criterionTitle(field);
  const condition = requiredCondition(rule);
  const actual = context[field];

  if (actual === undefined || actual === null || actual === "") {
    return {
      field,
      criterion_title: title,
      status: "missing_info",
      your_value: "Not Provided",
      required_condition: condition,
      reason: `Information for '${title}' was not provided in your profile.`,
    };
  }

  const yourValue = formatValue(field, actual);
  const passed = evaluateRule(rule, context);
  let reason: string;
  if (passed) {
    if (field.includes("income"))
      reason = `Your annual income (${yourValue}) is within the allowable limit (${condition}).`;
    else if (field === "age")
      reason = `Your age (${actual}) satisfies the requirement (${condition}).`;
    else if (field === "occupation")
      reason = `Your occupation (${yourValue}) matches the required criteria.`;
    else if (field === "gender")
      reason = `Your gender (${yourValue}) meets the scheme criteria.`;
    else if (field === "state")
      reason = `Your state of residence (${yourValue}) meets the state residency criteria (${condition}).`;
    else
      reason = `Your ${title} (${yourValue}) meets the requirement (${condition}).`;
  } else if (
    field.includes("income") &&
    (rule.operator === "lte" || rule.operator === "<=")
  ) {
    reason = `Your annual income of ${yourValue} exceeds the maximum allowable limit of ${condition.replace("Maximum ", "").replace(" per year", "")}.`;
  } else if (field === "age" && rule.operator === "between") {
    reason = `Your age (${actual}) is outside the required range (${condition}).`;
  } else if (
    field === "age" &&
    (rule.operator === "lte" || rule.operator === "<=")
  ) {
    reason = `Your age (${actual}) exceeds the maximum eligible age (${rule.rule_value} years).`;
  } else if (
    field === "age" &&
    (rule.operator === "gte" || rule.operator === ">=")
  ) {
    reason = `Your age (${actual}) is below the minimum required age (${rule.rule_value} years).`;
  } else if (field === "occupation") {
    reason = `Your occupation (${yourValue}) is not eligible for this scheme (${condition}).`;
  } else if (field === "gender") {
    reason = `This scheme is exclusively for ${rule.rule_value} applicants.`;
  } else if (field === "state") {
    reason = `This scheme is exclusively for residents of ${rule.rule_value} (your state: ${yourValue}).`;
  } else {
    reason = `Your ${title} (${yourValue}) does not meet the requirement (${condition}).`;
  }

  return {
    field,
    criterion_title: title,
    status: passed ? "passed" : "failed",
    your_value: yourValue,
    required_condition: condition,
    reason,
  };
}

function buildExplanation(
  scheme: SchemeRow & { rules: Rule[]; benefits: string[] },
  context: ProfileContext,
) {
  const passedCriteria = scheme.rules
    .map((rule) => explainRule(rule, context))
    .filter((item) => item.status === "passed");
  const failedCriteria = scheme.rules
    .map((rule) => explainRule(rule, context))
    .filter((item) => item.status !== "passed");
  const total = scheme.rules.length;
  const passed = passedCriteria.length;
  const percentage =
    total === 0 ? 100 : Math.round((passed / total) * 1000) / 10;
  const status =
    total === 0
      ? "eligible"
      : failedCriteria.length === 0
        ? "eligible"
        : percentage >= 50
          ? "nearly_eligible"
          : "ineligible";
  const summary =
    total === 0
      ? "This scheme has no restrictive criteria and is open to all citizens."
      : status === "eligible"
        ? `You meet all ${total} eligibility criteria for this scheme.`
        : `${status === "nearly_eligible" ? "Nearly eligible" : "Ineligible"} (${passed}/${total} criteria met). ${failedCriteria.map((item) => item.reason).join("; ")}`;

  return {
    scheme_id: scheme.id,
    scheme_name: scheme.name,
    scheme_slug: scheme.slug,
    state: scheme.state || "ALL_INDIA",
    ministry: scheme.ministry,
    description: scheme.description,
    status,
    is_eligible: status === "eligible",
    match_percentage: percentage,
    criteria_passed: passed,
    criteria_total: total,
    summary_reason: summary,
    passed_criteria: passedCriteria,
    failed_criteria: failedCriteria,
    benefits_summary: scheme.benefits,
    application_url: scheme.application_url,
  };
}

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
      LEFT JOIN benefits b ON b.scheme_id = s.id
      WHERE s.status = 'active'
      ORDER BY s.id ASC, er.id ASC, b.id ASC
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
