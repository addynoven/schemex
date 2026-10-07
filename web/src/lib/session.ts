import type { EligibilityCheckPayload, EligibilityReport } from './api'

const PROFILE_KEY = 'scheme_citizen_profile'
const REPORT_KEY = 'scheme_eligibility_report'
const ADMIN_TOKEN_KEY = 'scheme_admin_jwt'
const ADMIN_USER_KEY = 'scheme_admin_user'
const CITIZEN_TOKEN_KEY = 'scheme_citizen_jwt'
const CITIZEN_USER_KEY = 'scheme_citizen_user'

let inMemoryReport: EligibilityReport | null = null
let inMemoryProfile: EligibilityCheckPayload | null = null
const inMemoryStore: Record<string, string> = {}

function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    if (typeof window === 'undefined') return false
    const storage = window[type]
    const testKey = '__storage_test__'
    storage.setItem(testKey, testKey)
    storage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

function getItem(key: string): string | null {
  if (isStorageAvailable('localStorage')) {
    return localStorage.getItem(key)
  }
  return inMemoryStore[key] || null
}

function setItem(key: string, value: string): void {
  if (isStorageAvailable('localStorage')) {
    localStorage.setItem(key, value)
  } else {
    inMemoryStore[key] = value
  }
}

function removeItem(key: string): void {
  if (isStorageAvailable('localStorage')) {
    localStorage.removeItem(key)
  } else {
    delete inMemoryStore[key]
  }
}

export function saveCitizenProfile(profile: EligibilityCheckPayload) {
  inMemoryProfile = profile
  if (isStorageAvailable('sessionStorage')) {
    try {
      sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    } catch (e) {
      console.warn('SessionStorage quota exceeded, using in-memory profile store.', e)
    }
  }
}

export function getSavedCitizenProfile(): EligibilityCheckPayload | null {
  if (inMemoryProfile) return inMemoryProfile
  if (isStorageAvailable('sessionStorage')) {
    const data = sessionStorage.getItem(PROFILE_KEY)
    if (!data) return null
    try {
      inMemoryProfile = JSON.parse(data)
      return inMemoryProfile
    } catch {
      return null
    }
  }
  return null
}

export function saveEligibilityReport(report: EligibilityReport) {
  inMemoryReport = report
  if (isStorageAvailable('sessionStorage')) {
    try {
      sessionStorage.setItem(REPORT_KEY, JSON.stringify(report))
    } catch (e) {
      console.warn('SessionStorage quota exceeded, using in-memory report store.', e)
      try {
        const compact = {
          ...report,
          ineligible_schemes: [],
        }
        sessionStorage.setItem(REPORT_KEY, JSON.stringify(compact))
      } catch {
        // Keep in memory
      }
    }
  }
}

export function getSavedEligibilityReport(): EligibilityReport | null {
  if (inMemoryReport) return inMemoryReport
  if (isStorageAvailable('sessionStorage')) {
    const data = sessionStorage.getItem(REPORT_KEY)
    if (!data) return null
    try {
      inMemoryReport = JSON.parse(data)
      return inMemoryReport
    } catch {
      return null
    }
  }
  return null
}

// Admin Auth Session
export function saveAdminToken(token: string) {
  setItem(ADMIN_TOKEN_KEY, token)
}

export function getAdminToken(): string | null {
  return getItem(ADMIN_TOKEN_KEY)
}

export function removeAdminToken() {
  removeItem(ADMIN_TOKEN_KEY)
  removeItem(ADMIN_USER_KEY)
}

export function saveAdminUser(user: any) {
  setItem(ADMIN_USER_KEY, JSON.stringify(user))
}

export function getAdminUser(): any | null {
  const data = getItem(ADMIN_USER_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

// Citizen Auth Session
export function saveCitizenToken(token: string) {
  setItem(CITIZEN_TOKEN_KEY, token)
  if (typeof document !== 'undefined') {
    document.cookie = `scheme_citizen_jwt=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`
  }
}
export const setCitizenToken = saveCitizenToken

export function getCitizenToken(): string | null {
  const local = getItem(CITIZEN_TOKEN_KEY)
  if (local) return local
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(^| )scheme_citizen_jwt=([^;]+)/)
    if (match) return decodeURIComponent(match[2])
  }
  return null
}

export function removeCitizenToken() {
  removeItem(CITIZEN_TOKEN_KEY)
  removeItem(CITIZEN_USER_KEY)
  if (typeof document !== 'undefined') {
    document.cookie = 'scheme_citizen_jwt=; path=/; max-age=0; SameSite=Lax'
  }
}
export const clearCitizenToken = removeCitizenToken

export function saveCitizenUser(user: any) {
  setItem(CITIZEN_USER_KEY, JSON.stringify(user))
}

export function getCitizenUser(): any | null {
  const data = getItem(CITIZEN_USER_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}
