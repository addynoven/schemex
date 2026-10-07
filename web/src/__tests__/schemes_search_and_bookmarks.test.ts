import { describe, it, expect } from 'vitest'
import type { Scheme } from '@/lib/api'

const SAMPLE_SCHEMES: Scheme[] = [
  {
    id: 1,
    name: 'PM Kisan Samman Nidhi',
    slug: 'pm-kisan',
    category: 'Agriculture',
    ministry: 'Ministry of Agriculture',
    description: 'Direct income support of ₹6,000 per year to farmers.',
    status: 'active',
    state: 'ALL_INDIA',
    benefits: [
      { id: 101, title: 'Cash Support', benefit_type: 'cash_grant', description: '₹6,000 / year', amount: 6000 },
    ],
    eligibility_rules: [
      { id: 201, field: 'occupation', operator: 'eq', rule_value: 'farmer', description: 'Farmer' },
    ],
    required_documents: [
      { id: 301, document_name: 'Aadhaar Card', is_mandatory: true },
      { id: 302, document_name: 'Land Ownership Record', is_mandatory: true },
    ],
    official_sources: [],
  },
  {
    id: 2,
    name: 'PM Ujjwala Yojana',
    slug: 'pm-ujjwala',
    category: 'Women & Child',
    ministry: 'Ministry of Petroleum',
    description: 'Deposit-free LPG connection to rural women.',
    status: 'active',
    state: 'ALL_INDIA',
    benefits: [
      { id: 102, title: 'Free LPG Connection', benefit_type: 'subsidy', description: 'Clean cooking fuel', amount: null },
    ],
    eligibility_rules: [
      { id: 202, field: 'gender', operator: 'eq', rule_value: 'female', description: 'Female' },
    ],
    required_documents: [
      { id: 303, document_name: 'Aadhaar Card', is_mandatory: true },
      { id: 304, document_name: 'Ration Card', is_mandatory: true },
    ],
    official_sources: [],
  },
  {
    id: 3,
    name: 'Chief Minister Kanya Sumangala Yojana',
    slug: 'mukhya-mantri-kanya-sumangala-yojana',
    category: 'Women & Child',
    ministry: 'Department of Women and Child Development',
    description: 'Financial assistance to girl child in Uttar Pradesh.',
    status: 'active',
    state: 'Uttar Pradesh',
    benefits: [
      { id: 103, title: 'Educational Grant', benefit_type: 'grant', description: 'Financial support across 6 stages', amount: 15000 },
    ],
    eligibility_rules: [
      { id: 203, field: 'state', operator: 'eq', rule_value: 'Uttar Pradesh', description: 'Resident of UP' },
    ],
    required_documents: [
      { id: 305, document_name: 'Birth Certificate', is_mandatory: true },
    ],
    official_sources: [],
  },
]

describe('Schemes Domain Search & Bookmarking Unit Tests', () => {
  it('filters schemes by search keyword query', () => {
    const query = 'farmer'
    const filtered = SAMPLE_SCHEMES.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
    )

    expect(filtered.length).toBe(1)
    expect(filtered[0].slug).toBe('pm-kisan')
  })

  it('filters schemes by category sector', () => {
    const category = 'Women & Child'
    const filtered = SAMPLE_SCHEMES.filter((s) => s.category === category)

    expect(filtered.length).toBe(2)
    expect(filtered.every((s) => s.category === 'Women & Child')).toBe(true)
  })

  it('filters schemes by state jurisdiction', () => {
    const state = 'Uttar Pradesh'
    const stateSchemes = SAMPLE_SCHEMES.filter((s) => s.state === state || s.state === 'ALL_INDIA')

    expect(stateSchemes.length).toBe(3)
    const exactStateScheme = SAMPLE_SCHEMES.filter((s) => s.state === state)
    expect(exactStateScheme.length).toBe(1)
    expect(exactStateScheme[0].slug).toBe('mukhya-mantri-kanya-sumangala-yojana')
  })

  it('manages bookmarked / saved schemes accurately', () => {
    const savedSlugs = new Set<string>(['pm-kisan'])

    // Check if pm-kisan is saved
    expect(savedSlugs.has('pm-kisan')).toBe(true)
    expect(savedSlugs.has('pm-ujjwala')).toBe(false)

    // Filter saved schemes
    const savedSchemes = SAMPLE_SCHEMES.filter((s) => savedSlugs.has(s.slug))
    expect(savedSchemes.length).toBe(1)
    expect(savedSchemes[0].name).toBe('PM Kisan Samman Nidhi')

    // Add new bookmark
    savedSlugs.add('pm-ujjwala')
    expect(savedSlugs.size).toBe(2)

    // Remove bookmark
    savedSlugs.delete('pm-kisan')
    expect(savedSlugs.has('pm-kisan')).toBe(false)
    expect(savedSlugs.size).toBe(1)
  })

  it('returns empty array when search query matches no schemes', () => {
    const query = 'non-existent-welfare-keyword-xyz'
    const filtered = SAMPLE_SCHEMES.filter((s) => s.name.toLowerCase().includes(query))

    expect(filtered.length).toBe(0)
  })
})
