import { describe, it, expect } from 'vitest'
import type { SchemeDocumentReadiness, UserDocument } from '@/lib/api'

const SAMPLE_VAULT_DOCUMENTS: UserDocument[] = [
  {
    id: 101,
    user_id: 1,
    document_type: 'Aadhaar Card',
    document_number_masked: 'XXXX-XXXX-4532',
    file_name: 'aadhaar_front.pdf',
    file_size_bytes: 512000,
    mime_type: 'application/pdf',
    is_verified: true,
  },
  {
    id: 102,
    user_id: 1,
    document_type: 'PAN Card',
    document_number_masked: 'XXXXX1234X',
    file_name: 'pan_card.jpg',
    file_size_bytes: 256000,
    mime_type: 'image/jpeg',
    is_verified: true,
  },
]

const SAMPLE_READINESS: SchemeDocumentReadiness = {
  scheme_id: 1,
  scheme_name: 'PM Kisan Samman Nidhi',
  scheme_slug: 'pm-kisan',
  is_ready_to_apply: false,
  readiness_percentage: 50,
  mandatory_total: 2,
  mandatory_available: 1,
  optional_total: 0,
  optional_available: 0,
  summary: '1 of 2 mandatory documents ready in your vault.',
  checklist: [
    {
      document_name: 'Aadhaar Card',
      description: 'Identity & UIDAI Verification',
      is_mandatory: true,
      status: 'available',
      matched_vault_document_id: 101,
      matched_vault_document_name: 'aadhaar_front.pdf',
    },
    {
      document_name: 'Land Ownership Record',
      description: 'Khasra / Khatauni certificate',
      is_mandatory: true,
      status: 'missing',
      matched_vault_document_id: null,
      matched_vault_document_name: null,
    },
  ],
}

describe('Document Vault & Scheme Readiness Tests', () => {
  it('stores and tracks user documents in vault', () => {
    expect(SAMPLE_VAULT_DOCUMENTS.length).toBe(2)
    const aadhaar = SAMPLE_VAULT_DOCUMENTS.find((d) => d.document_type === 'Aadhaar Card')
    expect(aadhaar).toBeDefined()
    expect(aadhaar?.is_verified).toBe(true)
    expect(aadhaar?.document_number_masked).toBe('XXXX-XXXX-4532')
  })

  it('calculates scheme application readiness score', () => {
    expect(SAMPLE_READINESS.scheme_id).toBe(1)
    expect(SAMPLE_READINESS.readiness_percentage).toBe(50)
    expect(SAMPLE_READINESS.is_ready_to_apply).toBe(false)
    expect(SAMPLE_READINESS.mandatory_total).toBe(2)
    expect(SAMPLE_READINESS.mandatory_available).toBe(1)
  })

  it('segregates available vs missing checklist items', () => {
    const available = SAMPLE_READINESS.checklist.filter((i) => i.status === 'available')
    const missing = SAMPLE_READINESS.checklist.filter((i) => i.status === 'missing')

    expect(available.length).toBe(1)
    expect(available[0].document_name).toBe('Aadhaar Card')
    expect(available[0].matched_vault_document_id).toBe(101)

    expect(missing.length).toBe(1)
    expect(missing[0].document_name).toBe('Land Ownership Record')
    expect(missing[0].is_mandatory).toBe(true)
  })
})
