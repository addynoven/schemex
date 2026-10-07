import { describe, it, expect } from 'vitest'

interface ProfileFormData {
  full_name: string
  date_of_birth: string
  gender: string
  state: string
  district: string
  annual_income: number
  occupation: string
  caste_category: string
  residence_area: string
  marital_status: string
  has_land: boolean
  is_differently_abled: boolean
}

function calculateCompleteness(data: ProfileFormData): number {
  let score = 0
  if (data.full_name.trim()) score += 25
  if (data.date_of_birth) score += 15
  if (data.state) score += 15
  if (data.district.trim()) score += 15
  if (data.occupation) score += 15
  if (data.annual_income > 0) score += 15
  return Math.min(score, 100)
}

describe('Profile Completeness Tests', () => {
  it('calculates 100% completeness for a fully filled profile', () => {
    const fullProfile: ProfileFormData = {
      full_name: 'Rajesh Kumar Sharma',
      date_of_birth: '1988-01-01',
      gender: 'male',
      state: 'Madhya Pradesh',
      district: 'Sehore',
      annual_income: 90000,
      occupation: 'farmer',
      caste_category: 'OBC',
      residence_area: 'Rural',
      marital_status: 'Married',
      has_land: true,
      is_differently_abled: false,
    }

    const score = calculateCompleteness(fullProfile)
    expect(score).toBe(100)
  })

  it('calculates partial completeness score for incomplete profiles', () => {
    const partialProfile: ProfileFormData = {
      full_name: 'Rajesh',
      date_of_birth: '1988-01-01',
      gender: 'male',
      state: 'Madhya Pradesh',
      district: '',
      annual_income: 0,
      occupation: '',
      caste_category: 'OBC',
      residence_area: 'Rural',
      marital_status: 'Married',
      has_land: false,
      is_differently_abled: false,
    }

    const score = calculateCompleteness(partialProfile)
    expect(score).toBe(55) // 25 (name) + 15 (dob) + 15 (state) = 55
  })
})
