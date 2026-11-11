import { query } from "@/lib/db";

export type ProfileContext = Record<string, unknown>;

export type Rule = {
  field_name: string;
  operator: string;
  rule_value: string;
  description?: string;
};

export type SchemeRow = {
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

export type CriterionExplanation = {
  field: string;
  criterion_title: string;
  status: "passed" | "failed" | "missing_info";
  your_value: string;
  required_condition: string;
  reason: string;
};

export type SchemeEvaluationResult = {
  scheme_id?: number;
  scheme_name: string;
  scheme_slug: string;
  status: "eligible" | "nearly_eligible" | "ineligible";
  match_percentage: number;
  passed_criteria: CriterionExplanation[];
  failed_criteria: CriterionExplanation[];
  missing_criteria: CriterionExplanation[];
  benefits?: string[];
};

export function calculateAge(dateOfBirthOrAge: string | number | unknown): number {
  if (typeof dateOfBirthOrAge === "number") return dateOfBirthOrAge;
  if (!dateOfBirthOrAge || typeof dateOfBirthOrAge !== "string") return 0;
  
  // Direct numeric string e.g. "62"
  const parsedDirect = Number(dateOfBirthOrAge);
  if (Number.isFinite(parsedDirect) && parsedDirect > 0 && parsedDirect < 130) {
    return parsedDirect;
  }

  const birthDate = new Date(`${dateOfBirthOrAge}T00:00:00Z`);
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

export function comparableNumber(value: unknown): number | null {
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

export function normalizedBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true" || value === "yes")
    return true;
  if (value === 0 || value === "0" || value === "false" || value === "no")
    return false;
  return null;
}

export function evaluateRule(rule: Rule, context: ProfileContext): boolean {
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

export function criterionTitle(field: string): string {
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

export function requiredCondition(rule: Rule): string {
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

export function formatValue(field: string, value: unknown): string {
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

export function explainRule(rule: Rule, context: ProfileContext): CriterionExplanation {
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

export function buildExplanation(
  scheme: SchemeRow & { rules: Rule[]; benefits: string[] },
  context: ProfileContext,
) {
  const criteria = scheme.rules.map((rule) => explainRule(rule, context));
  const passedCriteria = criteria.filter((item) => item.status === "passed");
  const failedCriteria = criteria.filter((item) => item.status === "failed");
  const missingCriteria = criteria.filter((item) => item.status === "missing_info");

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

  let matchLevel = "high";
  if (status === "nearly_eligible") matchLevel = "medium";
  if (status === "ineligible") matchLevel = "low";

  return {
    scheme_id: scheme.id,
    scheme_name: scheme.name,
    scheme_slug: scheme.slug,
    state: scheme.state,
    ministry: scheme.ministry,
    description: scheme.description,
    application_url: scheme.application_url,
    match_percentage: percentage,
    match_level: matchLevel,
    status,
    total_criteria: total,
    passed_count: passed,
    failed_count: failedCriteria.length,
    missing_count: missingCriteria.length,
    benefits: scheme.benefits,
    criteria,
    passed_criteria: passedCriteria,
    failed_criteria: failedCriteria,
    missing_criteria: missingCriteria,
  };
}

/**
 * High-level evaluator for a specific scheme against citizen profile context.
 * Used by the AI Advisor tool checkEligibility.
 */
export async function evaluateSchemeEligibility(
  slug: string,
  profile: {
    age?: number;
    state?: string;
    annual_income?: number;
    income?: number;
    occupation?: string;
    gender?: string;
    is_bpl?: boolean;
    caste_category?: string;
  }
): Promise<SchemeEvaluationResult> {
  const context: ProfileContext = {
    ...profile,
    annual_income: profile.annual_income ?? profile.income,
    income: profile.annual_income ?? profile.income,
  };

  if (!process.env.DATABASE_URL) {
    return {
      scheme_name: slug,
      scheme_slug: slug,
      status: "eligible",
      match_percentage: 100,
      passed_criteria: [],
      failed_criteria: [],
      missing_criteria: [],
    };
  }

  try {
    const schemeRes = await query(
      `SELECT s.id, s.name, s.slug, s.state, s.ministry, s.description, s.application_url
       FROM schemes s
       WHERE s.slug = $1 OR LOWER(s.slug) = LOWER($1)
       LIMIT 1`,
      [slug]
    );

    if (schemeRes.rowCount === 0) {
      return {
        scheme_name: slug,
        scheme_slug: slug,
        status: "ineligible",
        match_percentage: 0,
        passed_criteria: [],
        failed_criteria: [
          {
            field: "slug",
            criterion_title: "Scheme Verification",
            status: "failed",
            your_value: slug,
            required_condition: "Must be a recognized government scheme",
            reason: `Scheme with slug '${slug}' was not found in the official registry.`,
          },
        ],
        missing_criteria: [],
      };
    }

    const schemeRow = schemeRes.rows[0] as SchemeRow;
    const rulesRes = await query(
      `SELECT field_name, operator, rule_value, description
       FROM eligibility_rules
       WHERE scheme_id = $1`,
      [schemeRow.id]
    );

    const benefitsRes = await query(
      `SELECT benefit_title
       FROM scheme_benefits
       WHERE scheme_id = $1`,
      [schemeRow.id]
    );

    const schemeWithRules: SchemeRow & { rules: Rule[]; benefits: string[] } = {
      id: schemeRow.id,
      name: schemeRow.name,
      slug: schemeRow.slug,
      state: schemeRow.state,
      ministry: schemeRow.ministry,
      description: schemeRow.description,
      application_url: schemeRow.application_url,
      field_name: null,
      operator: null,
      rule_value: null,
      benefit_title: null,
      rules: rulesRes.rows as Rule[],
      benefits: benefitsRes.rows.map((b: any) => b.benefit_title),
    };

    const explanation = buildExplanation(schemeWithRules, context);
    return {
      scheme_id: explanation.scheme_id,
      scheme_name: explanation.scheme_name,
      scheme_slug: explanation.scheme_slug,
      status: explanation.status as "eligible" | "nearly_eligible" | "ineligible",
      match_percentage: explanation.match_percentage,
      passed_criteria: explanation.passed_criteria,
      failed_criteria: explanation.failed_criteria,
      missing_criteria: explanation.missing_criteria,
      benefits: explanation.benefits,
    };
  } catch (err) {
    console.warn("evaluateSchemeEligibility error:", err);
    return {
      scheme_name: slug,
      scheme_slug: slug,
      status: "ineligible",
      match_percentage: 0,
      passed_criteria: [],
      failed_criteria: [],
      missing_criteria: [],
    };
  }
}
