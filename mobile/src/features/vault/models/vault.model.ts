import { z } from 'zod';
import { KNOWLEDGE_DOCUMENTS, type KnowledgeDocument } from '../data/knowledge-documents';

export { KNOWLEDGE_DOCUMENTS, type KnowledgeDocument };

export const VaultDocumentCategorySchema = z.enum([
  'identity',
  'income-wealth',
  'property-land',
  'education',
  'social-category',
  'general-compliance',
  // UI legacy aliases
  'land',
  'income',
  'bank',
  'other',
]);
export type VaultDocumentCategory = z.infer<typeof VaultDocumentCategorySchema>;

export const PRESET_DOCUMENTS_BY_CATEGORY: Record<VaultDocumentCategory, string[]> = {
  identity: KNOWLEDGE_DOCUMENTS.filter((d) => d.category === 'identity').map((d) => d.name),
  'income-wealth': KNOWLEDGE_DOCUMENTS.filter((d) => d.category === 'income-wealth').map((d) => d.name),
  'property-land': KNOWLEDGE_DOCUMENTS.filter((d) => d.category === 'property-land').map((d) => d.name),
  education: KNOWLEDGE_DOCUMENTS.filter((d) => d.category === 'education').map((d) => d.name),
  'social-category': KNOWLEDGE_DOCUMENTS.filter((d) => d.category === 'social-category').map((d) => d.name),
  'general-compliance': KNOWLEDGE_DOCUMENTS.filter((d) => d.category === 'general-compliance').map((d) => d.name),
  // UI aliases
  income: KNOWLEDGE_DOCUMENTS.filter(
    (d) => d.category === 'income-wealth' && !d.name.toLowerCase().includes('bank')
  ).map((d) => d.name),
  bank: KNOWLEDGE_DOCUMENTS.filter(
    (d) => d.category === 'income-wealth' && d.name.toLowerCase().includes('bank')
  ).map((d) => d.name),
  land: KNOWLEDGE_DOCUMENTS.filter((d) => d.category === 'property-land').map((d) => d.name),
  other: KNOWLEDGE_DOCUMENTS.filter(
    (d) => d.category === 'social-category' || d.category === 'general-compliance'
  ).map((d) => d.name),
};

export const CATEGORY_LABELS: Record<VaultDocumentCategory, { label: string; icon: string }> = {
  identity: { label: 'Identity', icon: 'id-card-o' },
  'income-wealth': { label: 'Income & Bank', icon: 'bank' },
  'property-land': { label: 'Land & Property', icon: 'map-o' },
  education: { label: 'Education', icon: 'graduation-cap' },
  'social-category': { label: 'Social Category', icon: 'users' },
  'general-compliance': { label: 'Compliance & Other', icon: 'file-text-o' },
  // aliases
  income: { label: 'Income', icon: 'file-text-o' },
  bank: { label: 'Bank', icon: 'bank' },
  land: { label: 'Land', icon: 'map-o' },
  other: { label: 'Other', icon: 'file-o' },
};

export const VaultDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  fileName: z.string(),
  fileSize: z.string(),
  mimeType: z.string().default('application/pdf'),
  category: VaultDocumentCategorySchema,
  uploadDate: z.string(),
  isVerified: z.boolean().default(false),
  extractedData: z.record(z.string(), z.string()).optional(),
  fileUri: z.string().optional(),
  downloadUrl: z.string().optional(),
});
export type VaultDocument = z.infer<typeof VaultDocumentSchema>;

export interface DocumentUploadPayload {
  title: string;
  category: VaultDocumentCategory;
  method: UploadMethod;
  fileUri?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const RequiredDocumentStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: VaultDocumentCategorySchema,
  isUploaded: z.boolean(),
  documentId: z.string().optional(),
});
export type RequiredDocumentStatus = z.infer<typeof RequiredDocumentStatusSchema>;

export const SchemeReadinessSchema = z.object({
  schemeId: z.string(),
  schemeName: z.string(),
  ministry: z.string(),
  requiredDocuments: z.array(RequiredDocumentStatusSchema),
  presentCount: z.number(),
  totalCount: z.number(),
  percentage: z.number(),
  isReady: z.boolean(),
});
export type SchemeReadiness = z.infer<typeof SchemeReadinessSchema>;

export type UploadMethod = 'camera' | 'gallery' | 'file';

export type VaultDevScreen =
  | '1_open_vault'
  | '2_scheme_readiness'
  | '3_upload_document'
  | '5_document_saved'
  | '6_updated_readiness';

/**
 * Normalizes document name: lowercase, strip punctuation/dashes, collapse spaces.
 * Matches backend `_normalize_doc_name` in service.py.
 */
export function normalizeDocName(name: string): string {
  let s = (name || '').toLowerCase();
  s = s.replace(/[\u2013\u2014]/g, ' '); // en/em dash
  s = s.replace(/[-_]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Knowledge-backed synonym registry.
 * Maps synonyms to canonical names present in KNOWLEDGE_DOCUMENTS.
 */
const KNOWLEDGE_SYNONYM_GROUPS: { canonicalName: string; aliases: string[] }[] = [
  {
    canonicalName: 'Aadhaar Card',
    aliases: [
      'aadhaar',
      'aadhaar card',
      'aadhar',
      'aadhar card',
      'uidai',
      'parent aadhaar card',
      'aadhaar card of woman head',
    ],
  },
  {
    canonicalName: 'PAN Card',
    aliases: ['pan card', 'pan', 'permanent account number', 'pan proof'],
  },
  {
    canonicalName: 'Bank Passbook',
    aliases: [
      'bank passbook',
      'bank account',
      'bank statement',
      'passbook',
      'bank account details',
      'bank account statement',
      'aadhaar linked bank passbook',
    ],
  },
  {
    canonicalName: 'Income Certificate',
    aliases: ['income certificate', 'income proof', 'salary certificate', 'salary slip'],
  },
  {
    canonicalName: 'Ration Card',
    aliases: [
      'ration card',
      'family ration card',
      'ration',
      'family entitlement card',
      'ration card health card',
      'ration card antyodaya bpl apl',
      'ration card yellow orange',
    ],
  },
  {
    canonicalName: 'Land Records',
    aliases: [
      'land record',
      'land records',
      'land ownership record',
      'land possession certificate',
      'khasra',
      'khatauni',
      '7/12',
      '7 12',
      '712',
      'patta',
      'jamabandi',
      'land revenue passbook',
      'khasra land ownership record',
    ],
  },
  {
    canonicalName: 'Birth Certificate',
    aliases: ['birth certificate', 'age proof', 'age certificate', 'age proof certificate'],
  },
  {
    canonicalName: 'Caste Certificate',
    aliases: [
      'caste certificate',
      'community certificate',
      'sc certificate',
      'st certificate',
      'obc certificate',
      'disability caste certificate',
    ],
  },
  {
    canonicalName: 'Academic Marksheet',
    aliases: [
      'marksheet',
      'academic marksheet',
      '10th marksheet',
      '12th marksheet',
      '12th class marksheet',
      'qualification certificate',
      'passing certificate',
      'educational qualification certificate',
      'marksheet grade certificate',
      'degree diploma certificate marksheet',
    ],
  },
  {
    canonicalName: 'Udyam Registration Certificate',
    aliases: [
      'udyam registration',
      'msme registration',
      'business proof',
      'udyam certificate',
      'udyam registration certificate',
    ],
  },
  {
    canonicalName: 'Domicile Certificate',
    aliases: [
      'domicile certificate',
      'residence certificate',
      'bonafide certificate',
      'karnataka domicile certificate',
      'maharashtra domicile certificate',
      'mp domicile certificate',
    ],
  },
  {
    canonicalName: 'Disability Certificate',
    aliases: ['disability certificate', 'handicap certificate', 'pwd certificate'],
  },
];

/**
 * Returns canonical document name strictly backed by backend/knowledge OKF registry.
 */
export function getCanonicalDocumentType(docName: string): string {
  const norm = normalizeDocName(docName);
  if (!norm) return (docName || '').trim();

  // 1. Direct match in local SQLite canonical_documents table (if initialized)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocalDatabase } = require('@/core/database/local-db');
    const db = getLocalDatabase();
    const row = db.getFirstSync(
      'SELECT name FROM canonical_documents WHERE lower(name) = ? OR lower(id) = ? OR lower(slug) = ? LIMIT 1',
      [norm, norm, norm]
    ) as { name?: string } | null;
    if (row && row.name) return row.name;
  } catch {
    // Fallthrough to in-memory KNOWLEDGE_DOCUMENTS
  }

  // 2. Direct match with canonical KnowledgeDocument by name, id, or slug
  const directMatch = KNOWLEDGE_DOCUMENTS.find(
    (d) =>
      normalizeDocName(d.name) === norm ||
      normalizeDocName(d.id) === norm ||
      normalizeDocName(d.slug) === norm
  );
  if (directMatch) return directMatch.name;

  // 2. Match via synonym groups
  for (const group of KNOWLEDGE_SYNONYM_GROUPS) {
    const isHit = group.aliases.some((alias) => {
      const normAlias = normalizeDocName(alias);
      return norm === normAlias || norm.includes(normAlias) || normAlias.includes(norm);
    });
    if (isHit) return group.canonicalName;
  }

  // 3. Substring match against knowledge documents
  const subMatch = KNOWLEDGE_DOCUMENTS.find((d) => {
    const dNorm = normalizeDocName(d.name);
    return norm.includes(dNorm) || dNorm.includes(norm);
  });
  if (subMatch) return subMatch.name;

  return (docName || '').trim();
}

/**
 * Evaluates whether two document names represent the exact same document requirement.
 * Enforces single-upload constraint: a citizen cannot upload the same document type twice.
 */
export function isSameDocumentType(typeA: string, typeB: string): boolean {
  if (!typeA || !typeB) return false;
  return (
    getCanonicalDocumentType(typeA).toLowerCase() ===
    getCanonicalDocumentType(typeB).toLowerCase()
  );
}


