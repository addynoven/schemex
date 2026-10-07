import { describe, it, expect } from 'vitest'
import type { EligibilityCheckPayload, EligibilityReport } from '@/lib/api'

const SAMPLE_PAYLOAD: EligibilityCheckPayload = {
  age: 28,
  gender: 'Female',
  state: 'Uttar Pradesh',
  district: 'Lucknow',
  annual_income: 180000,
  occupation: 'farmer',
  caste_category: 'General',
  is_differently_abled: false,
  marital_status: 'Married',
  residence_area: 'Rural',
  has_land: true,
}

const SAMPLE_REPORT: EligibilityReport = {
  total_evaluated: 10,
  eligible_count: 2,
  nearly_eligible_count: 1,
  ineligible_count: 7,
  eligible_schemes: [
    {
      scheme_id: 1,
      scheme_name: 'PM Kisan Samman Nidhi',
      scheme_slug: 'pm-kisan',
      state: 'ALL_INDIA',
      ministry: 'Ministry of Agriculture',
      description: 'Income support to farmer families',
      status: 'eligible',
      is_eligible: true,
      match_percentage: 100,
      criteria_passed: 1,
      criteria_total: 1,
      summary_reason: 'All criteria passed: Occupation matches farmer.',
      passed_criteria: [
        {
          field: 'occupation',
          criterion_title: 'Occupation Requirement',
          status: 'passed',
          your_value: 'farmer',
          required_condition: 'farmer',
          reason: 'Occupation farmer matches requirement',
        },
      ],
      failed_criteria: [],
      benefits_summary: ['₹6,000 per year in 3 equal installments'],
    },
    {
      scheme_id: 2,
      scheme_name: 'PM Ujjwala Yojana',
      scheme_slug: 'pm-ujjwala',
      state: 'ALL_INDIA',
      ministry: 'Ministry of Petroleum',
      description: 'Clean cooking fuel to rural women',
      status: 'eligible',
      is_eligible: true,
      match_percentage: 100,
      criteria_passed: 1,
      criteria_total: 1,
      summary_reason: 'All criteria passed: Gender matches female.',
      passed_criteria: [
        {
          field: 'gender',
          criterion_title: 'Gender Requirement',
          status: 'passed',
          your_value: 'Female',
          required_condition: 'Female',
          reason: 'Gender Female matches requirement',
        },
      ],
      failed_criteria: [],
      benefits_summary: ['Deposit-free LPG Connection'],
    },
  ],
  nearly_eligible_schemes: [
    {
      scheme_id: 3,
      scheme_name: 'Post Matric Scholarship',
      scheme_slug: 'post-matric-scholarship',
      state: 'ALL_INDIA',
      ministry: 'Ministry of Social Justice',
      description: 'Financial assistance for post-matriculation studies',
      status: 'nearly_eligible',
      is_eligible: false,
      match_percentage: 80,
      criteria_passed: 3,
      criteria_total: 4,
      summary_reason: 'Income and state passed, but age exceeds student limit.',
      passed_criteria: [],
      failed_criteria: [
        {
          field: 'age',
          criterion_title: 'Maximum Age Limit',
          status: 'failed',
          your_value: 28,
          required_condition: '<= 25',
          reason: 'Age 28 exceeds maximum 25',
        },
      ],
      benefits_summary: ['Full tuition fee reimbursement'],
    },
  ],
  ineligible_schemes: [],
}

describe('Eligibility Check Domain Tests', () => {
  it('validates core demographic fields in check payload', () => {
    expect(SAMPLE_PAYLOAD.age).toBe(28)
    expect(SAMPLE_PAYLOAD.state).toBe('Uttar Pradesh')
    expect(SAMPLE_PAYLOAD.gender).toBe('Female')
    expect(SAMPLE_PAYLOAD.annual_income).toBe(180000)
    expect(SAMPLE_PAYLOAD.occupation).toBe('farmer')
  })

  it('evaluates report scheme totals accurately', () => {
    expect(SAMPLE_REPORT.total_evaluated).toBe(10)
    expect(SAMPLE_REPORT.eligible_count).toBe(2)
    expect(SAMPLE_REPORT.nearly_eligible_count).toBe(1)
    expect(SAMPLE_REPORT.eligible_schemes.length).toBe(2)
    expect(SAMPLE_REPORT.eligible_schemes.every((s) => s.is_eligible)).toBe(true)
  })

  it('correctly categorizes 100% eligible vs nearly eligible schemes', () => {
    const elligibleSlugs = SAMPLE_REPORT.eligible_schemes.map((s) => s.scheme_slug)
    expect(elligibleSlugs).toContain('pm-kisan')
    expect(elligibleSlugs).toContain('pm-ujjwala')

    const nearlyEligible = SAMPLE_REPORT.nearly_eligible_schemes[0]
    expect(nearlyEligible.scheme_slug).toBe('post-matric-scholarship')
    expect(nearlyEligible.match_percentage).toBe(80)
    expect(nearlyEligible.failed_criteria.length).toBe(1)
    expect(nearlyEligible.failed_criteria[0].field).toBe('age')
  })
})
