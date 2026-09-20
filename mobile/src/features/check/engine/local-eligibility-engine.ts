import { getLocalDatabase } from '../../../core/database/local-db';
import { EligibilityFormData } from '../models/check.model';
import {
  BackendCriterionVerdict,
  BackendEligibilityReportResponse,
  BackendSchemeExplanation,
} from '../repositories/check.api';

interface SchemeRow {
  id: number;
  slug: string;
  title: string;
  ministry: string;
  state: string;
  category: string;
  description: string;
  benefit_summary: string;
  application_url: string | null;
}

interface RuleRow {
  scheme_slug: string;
  field_name: string;
  operator: string;
  rule_value: string;
  description: string;
}

interface BenefitRow {
  scheme_slug: string;
  title: string;
  details: string;
}

export interface EligibilityEvaluationInput {
  age: number;
  gender: string;
  caste: string;
  income: number;
  state: string;
  district?: string;
  area?: string;
  occupation: string;
  isFarmer?: boolean;
  isStudent?: boolean;
  disability?: boolean;
  disabilityPercentage?: number;
  minority?: boolean;
  bplCard?: boolean;
}

export class LocalEligibilityEngine {
  evaluate(input: EligibilityEvaluationInput | EligibilityFormData): BackendEligibilityReportResponse {
    const db = getLocalDatabase();

    let userState = 'ALL_INDIA';
    let userIncome = 0;
    let userAge = 30;
    let userGender = '';
    let userOccupation = '';
    let userCaste = '';

    if ('demographics' in input) {
      userState = input.demographics.state?.trim() || 'ALL_INDIA';
      userIncome = Number(input.economic.annualIncome) || 0;
      userGender = input.demographics.gender?.toLowerCase() || '';
      userOccupation = input.economic.occupation?.toLowerCase() || '';
      userCaste = input.economic.category?.toLowerCase() || '';

      const parts = (input.demographics.dob || '').split(/[-/]/);
      if (parts.length === 3) {
        const yr = parts[0].length === 4 ? parseInt(parts[0], 10) : parseInt(parts[2], 10);
        if (!isNaN(yr)) userAge = Math.max(1, new Date().getFullYear() - yr);
      }
    } else {
      userState = input.state?.trim() || 'ALL_INDIA';
      userIncome = Number(input.income) || 0;
      userAge = Number(input.age) || 30;
      userGender = input.gender?.toLowerCase() || '';
      userOccupation = input.occupation?.toLowerCase() || (input.isFarmer ? 'farmer' : (input.isStudent ? 'student' : ''));
      userCaste = input.caste?.toLowerCase() || '';
    }

    // 1. Candidate schemes for user jurisdiction
    const schemes = db.getAllSync<SchemeRow>(
      `SELECT id, slug, title, ministry, state, category, description, benefit_summary, application_url 
       FROM schemes 
       WHERE (state = ? OR state = 'ALL_INDIA' OR state IS NULL OR state = '')
       ORDER BY id ASC`,
      [userState]
    );

    // 2. Load rules for candidate schemes
    const allRules = db.getAllSync<RuleRow>(
      `SELECT scheme_slug, field_name, operator, rule_value, description FROM eligibility_rules`
    );
    const rulesBySlug = new Map<string, RuleRow[]>();
    for (const r of allRules) {
      const list = rulesBySlug.get(r.scheme_slug);
      if (list) list.push(r);
      else rulesBySlug.set(r.scheme_slug, [r]);
    }

    // 3. Load benefits
    const allBenefits = db.getAllSync<BenefitRow>(
      `SELECT scheme_slug, title, details FROM benefits`
    );
    const benefitsBySlug = new Map<string, string[]>();
    for (const b of allBenefits) {
      const summary = b.details || b.title;
      const list = benefitsBySlug.get(b.scheme_slug);
      if (list) list.push(summary);
      else benefitsBySlug.set(b.scheme_slug, [summary]);
    }

    const eligibleSchemes: BackendSchemeExplanation[] = [];
    const nearlyEligibleSchemes: BackendSchemeExplanation[] = [];
    const ineligibleSchemes: BackendSchemeExplanation[] = [];

    for (const scheme of schemes) {
      const rules = rulesBySlug.get(scheme.slug) || [];
      const passedCriteria: BackendCriterionVerdict[] = [];
      const failedCriteria: BackendCriterionVerdict[] = [];

      for (const rule of rules) {
        const verdict = this.evaluateRule(rule, {
          userState,
          userIncome,
          userAge,
          userGender,
          userOccupation,
          userCaste,
        });

        if (verdict.status === 'passed') {
          passedCriteria.push(verdict);
        } else {
          failedCriteria.push(verdict);
        }
      }

      const totalCriteria = rules.length;
      const passedCount = passedCriteria.length;
      const matchPercentage = totalCriteria === 0 ? 100 : Math.round((passedCount / totalCriteria) * 100);
      const isEligible = failedCriteria.length === 0;

      let status: 'eligible' | 'nearly_eligible' | 'ineligible';
      let summaryReason: string;

      if (isEligible) {
        status = 'eligible';
        summaryReason = totalCriteria === 0 
          ? 'Universal national welfare program available to all qualifying citizens in this demographic.' 
          : `All ${passedCount} required eligibility criteria verified and matched.`;
      } else if (passedCount > 0 && matchPercentage >= 50) {
        status = 'nearly_eligible';
        const failedSummary = failedCriteria.map((f) => f.criterion_title).join(', ');
        summaryReason = `Matched ${passedCount} of ${totalCriteria} criteria (${matchPercentage}%). Check requirement for: ${failedSummary}.`;
      } else {
        status = 'ineligible';
        summaryReason = `Requirements not met for ${failedCriteria.map((f) => f.criterion_title).join(', ')}.`;
      }

      const rawBenefits = benefitsBySlug.get(scheme.slug) || [];
      const benefitsSummary = rawBenefits.length > 0 ? rawBenefits : [scheme.benefit_summary || scheme.description];

      const explanation: BackendSchemeExplanation = {
        scheme_id: scheme.id,
        scheme_name: scheme.title,
        scheme_slug: scheme.slug,
        state: scheme.state,
        ministry: scheme.ministry || 'Government of India',
        description: scheme.description || '',
        status,
        is_eligible: isEligible,
        match_percentage: matchPercentage,
        criteria_passed: passedCount,
        criteria_total: totalCriteria,
        summary_reason: summaryReason,
        passed_criteria: passedCriteria,
        failed_criteria: failedCriteria,
        benefits_summary: benefitsSummary,
        application_url: scheme.application_url || undefined,
      };

      if (status === 'eligible') {
        eligibleSchemes.push(explanation);
      } else if (status === 'nearly_eligible') {
        nearlyEligibleSchemes.push(explanation);
      } else {
        ineligibleSchemes.push(explanation);
      }
    }

    return {
      total_evaluated: schemes.length,
      eligible_count: eligibleSchemes.length,
      nearly_eligible_count: nearlyEligibleSchemes.length,
      ineligible_count: ineligibleSchemes.length,
      eligible_schemes: eligibleSchemes,
      nearly_eligible_schemes: nearlyEligibleSchemes,
      ineligible_schemes: ineligibleSchemes,
    };
  }

  private evaluateRule(
    rule: RuleRow,
    profile: {
      userState: string;
      userIncome: number;
      userAge: number;
      userGender: string;
      userOccupation: string;
      userCaste: string;
    }
  ): BackendCriterionVerdict {
    const field = rule.field_name.toLowerCase();
    const op = rule.operator.toLowerCase();
    const val = rule.rule_value;

    let passed = false;
    let yourValue: unknown = 'Not Provided';
    let criterionTitle = rule.field_name;

    switch (field) {
      case 'state': {
        criterionTitle = 'State of Residence';
        yourValue = profile.userState;
        if (op === 'eq') {
          passed = val.toLowerCase() === profile.userState.toLowerCase() || val === 'ALL_INDIA';
        } else {
          passed = true;
        }
        break;
      }

      case 'annual_income':
      case 'income': {
        criterionTitle = 'Annual Household Income';
        yourValue = profile.userIncome;
        const targetIncome = parseFloat(val) || 0;
        if (op === 'lte') {
          passed = profile.userIncome <= targetIncome;
        } else if (op === 'gte') {
          passed = profile.userIncome >= targetIncome;
        } else if (op === 'between') {
          const parts = val.split('-').map((p) => parseFloat(p.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            passed = profile.userIncome >= parts[0] && profile.userIncome <= parts[1];
          }
        }
        break;
      }

      case 'occupation': {
        criterionTitle = 'Occupation / Livelihood';
        yourValue = profile.userOccupation;
        const occTarget = val.toLowerCase();
        if (op === 'eq') {
          passed = profile.userOccupation.includes(occTarget) || occTarget.includes(profile.userOccupation);
        } else if (op === 'in') {
          const allowed = occTarget.split(',').map((s) => s.trim());
          passed = allowed.some((a) => profile.userOccupation.includes(a) || a.includes(profile.userOccupation));
        }
        break;
      }

      case 'gender': {
        criterionTitle = 'Gender Requirement';
        yourValue = profile.userGender;
        const targetGender = val.toLowerCase();
        if (op === 'eq') {
          passed = profile.userGender === targetGender || targetGender === 'all';
        } else if (op === 'in') {
          const allowed = targetGender.split(',').map((s) => s.trim());
          passed = allowed.includes(profile.userGender) || allowed.includes('all');
        }
        break;
      }

      case 'age': {
        criterionTitle = 'Citizen Age';
        yourValue = profile.userAge;
        if (op === 'gte') {
          passed = profile.userAge >= (parseFloat(val) || 0);
        } else if (op === 'lte') {
          passed = profile.userAge <= (parseFloat(val) || 0);
        } else if (op === 'between') {
          const parts = val.split('-').map((p) => parseFloat(p.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            passed = profile.userAge >= parts[0] && profile.userAge <= parts[1];
          }
        } else if (op === 'eq') {
          passed = profile.userAge === (parseFloat(val) || 0);
        }
        break;
      }

      case 'caste_category':
      case 'caste': {
        criterionTitle = 'Social Caste Category';
        yourValue = profile.userCaste;
        const targetCaste = val.toLowerCase();
        if (op === 'eq') {
          passed = profile.userCaste === targetCaste || targetCaste === 'all';
        } else if (op === 'in') {
          const allowed = targetCaste.split(',').map((s) => s.trim());
          passed = allowed.includes(profile.userCaste) || allowed.includes('all');
        }
        break;
      }

      default:
        // Other fields pass by default if unconstrained
        passed = true;
        break;
    }

    return {
      field: rule.field_name,
      criterion_title: criterionTitle,
      status: passed ? 'passed' : 'failed',
      your_value: yourValue,
      required_condition: `${rule.field_name} ${rule.operator} ${rule.rule_value}`,
      reason: passed 
        ? `Meets requirement (${rule.field_name} ${rule.operator} ${rule.rule_value})` 
        : `Does not meet condition (${rule.field_name} ${rule.operator} ${rule.rule_value})`,
    };
  }
}

export const localEligibilityEngine = new LocalEligibilityEngine();
