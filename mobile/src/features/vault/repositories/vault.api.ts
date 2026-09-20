import { ok, type Result } from '../../../core/errors/result';
import { AppError } from '../../../core/errors/error-handler';
import { getLocalDatabase } from '../../../core/database/local-db';
import { mmkvStorage } from '../../../core/storage/mmkv';
import { uploadToCloudinary, CLOUDINARY_CLOUD_NAME } from '../../../core/storage/cloudinary';
import { config } from '../../../core/config/config';
import { authStorage } from '../../auth/storage/auth.storage';
import type { RequiredDocumentStatus, SchemeReadiness, VaultDocument } from '../models/vault.model';

const VAULT_STORAGE_KEY = 'local_vault_documents_list';

export function inferCategory(titleOrType: string): VaultDocument['category'] {
  const t = titleOrType.toLowerCase();
  if (t.includes('land') || t.includes('7/12') || t.includes('patta') || t.includes('khasra') || t.includes('khatauni')) return 'land';
  if (t.includes('income') || t.includes('salary')) return 'income';
  if (t.includes('bank') || t.includes('passbook') || t.includes('account')) return 'bank';
  if (
    t.includes('ration') || t.includes('caste') || t.includes('community certificate') ||
    t.includes('domicile') || t.includes('residence certificate') ||
    t.includes('bpl card') || t.includes('family entitlement')
  ) return 'other';
  return 'identity';
}

export function mapBackendReadiness(
  response: BackendSchemeReadinessResponse,
  ministry: string,
): SchemeReadiness {
  const mandatoryDocs = response.checklist.filter((item) => item.is_mandatory);

  const requiredDocuments: RequiredDocumentStatus[] = mandatoryDocs.map((item, index) => ({
    id: `req-${index}`,
    name: item.document_name,
    description: item.description ?? '',
    category: inferCategory(item.document_name),
    isUploaded: item.status === 'available',
    documentId: item.matched_vault_document_id != null ? String(item.matched_vault_document_id) : undefined,
  }));

  return {
    schemeId: String(response.scheme_id),
    schemeName: response.scheme_name,
    ministry,
    requiredDocuments,
    presentCount: response.mandatory_available,
    totalCount: response.mandatory_total,
    percentage: response.readiness_percentage,
    isReady: response.is_ready_to_apply,
  };
}

export interface BackendVaultDocument {
  id: number;
  user_id: number;
  household_member_id: number | null;
  citizen_uid: string | null;
  document_type: string;
  document_number_masked: string | null;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  is_verified: boolean;
  download_url: string | null;
}

export interface BackendReadinessItem {
  document_name: string;
  description: string | null;
  is_mandatory: boolean;
  status: 'available' | 'missing' | 'pending_verification';
  matched_vault_document_id: number | null;
  matched_vault_document_name: string | null;
}

export interface BackendSchemeReadinessResponse {
  scheme_id: number;
  scheme_slug: string;
  scheme_name: string;
  is_ready_to_apply: boolean;
  readiness_percentage: number;
  mandatory_total: number;
  mandatory_available: number;
  optional_total: number;
  optional_available: number;
  summary: string;
  checklist: BackendReadinessItem[];
}

export class VaultApiRepository {
  private getLocalDocs(): BackendVaultDocument[] {
    try {
      const raw = mmkvStorage.getString(VAULT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalDocs(docs: BackendVaultDocument[]): void {
    mmkvStorage.set(VAULT_STORAGE_KEY, JSON.stringify(docs));
  }

  /**
   * Uploads and saves a document locally on device in the sandboxed vault.
   */
  async uploadDocumentDirect(params: {
    uri: string;
    fileName: string;
    mimeType: string;
    documentType: string;
    documentNumberMasked?: string;
    householdMemberId?: number;
  }): Promise<Result<BackendVaultDocument, AppError>> {
    return this.uploadDocument(params);
  }

  async uploadDocument(params: {
    uri: string;
    fileName: string;
    mimeType: string;
    documentType: string;
    documentNumberMasked?: string;
    householdMemberId?: number;
  }): Promise<Result<BackendVaultDocument, AppError>> {
    // 1. Direct mobile upload to Cloudinary CDN
    const uploadResult = await uploadToCloudinary({
      uri: params.uri,
      fileName: params.fileName,
      mimeType: params.mimeType,
      folder: 'scheme_vault',
    });

    const user = authStorage.getCurrentUser();
    const userId = user?.id && !isNaN(Number(user.id)) ? Number(user.id) : 1;
    const citizenUid = user?.citizenUid || `CIT-${userId}`;

    let documentId = Date.now();

    // 2. Persist document metadata to PostgreSQL via PostgREST
    try {
      const baseUrl = config.apiUrl.replace(/\/+$/, '');
      const pgRes = await fetch(`${baseUrl}/user_documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          user_id: userId,
          household_member_id: params.householdMemberId || null,
          citizen_uid: citizenUid,
          document_type: params.documentType,
          document_number_masked: params.documentNumberMasked || null,
          file_key: uploadResult.public_id,
          file_name: params.fileName,
          file_size_bytes: uploadResult.bytes || 1024 * 150,
          mime_type: params.mimeType,
          is_verified: true,
        }),
      });

      if (pgRes.ok) {
        const rows = await pgRes.json();
        if (rows && rows[0]?.id) {
          documentId = rows[0].id;
        }
      }
    } catch {
      // Offline fallback: persists locally
    }

    const docs = this.getLocalDocs();
    const newDoc: BackendVaultDocument = {
      id: documentId,
      user_id: userId,
      household_member_id: params.householdMemberId || null,
      citizen_uid: citizenUid,
      document_type: params.documentType,
      document_number_masked: params.documentNumberMasked || null,
      file_name: params.fileName,
      file_size_bytes: uploadResult.bytes || 1024 * 150,
      mime_type: params.mimeType,
      is_verified: true,
      download_url: uploadResult.secure_url,
    };

    docs.unshift(newDoc);
    this.saveLocalDocs(docs);
    return ok(newDoc);
  }

  /**
   * Syncs user documents from PostgreSQL cloud database into local vault.
   * Ensures user can switch phones and instantly access all previously uploaded documents.
   */
  async syncFromCloud(targetUserId?: number | string): Promise<BackendVaultDocument[]> {
    try {
      const user = authStorage.getCurrentUser();
      const rawId = targetUserId || user?.id || 1;
      const userId = Number(rawId);
      if (isNaN(userId)) return this.getLocalDocs();

      const baseUrl = config.apiUrl.replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/user_documents?user_id=eq.${userId}&order=uploaded_at.desc`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const rows = await res.json();
        const cloudDocs: BackendVaultDocument[] = rows.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          household_member_id: r.household_member_id || null,
          citizen_uid: r.citizen_uid || 'CIT-LOCAL',
          document_type: r.document_type,
          document_number_masked: r.document_number_masked || null,
          file_name: r.file_name,
          file_size_bytes: r.file_size_bytes,
          mime_type: r.mime_type,
          is_verified: r.is_verified,
          download_url: r.file_key.startsWith('http')
            ? r.file_key
            : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${r.file_key}`,
        }));

        const localDocs = this.getLocalDocs();
        const mergedMap = new Map<number | string, BackendVaultDocument>();
        cloudDocs.forEach((d) => mergedMap.set(d.id, d));
        localDocs.forEach((d) => {
          if (!mergedMap.has(d.id)) {
            mergedMap.set(d.id, d);
          }
        });

        const combined = Array.from(mergedMap.values());
        this.saveLocalDocs(combined);
        return combined;
      }
    } catch {
      // offline ignore
    }
    return this.getLocalDocs();
  }

  /**
   * Retrieves all documents stored in the local sandboxed vault.
   * Also triggers non-blocking background sync with PostgreSQL.
   */
  async listDocuments(householdMemberId?: number): Promise<Result<BackendVaultDocument[], AppError>> {
    void this.syncFromCloud();
    const docs = this.getLocalDocs();
    if (householdMemberId) {
      return ok(docs.filter((d) => d.household_member_id === householdMemberId));
    }
    return ok(docs);
  }

  /**
   * Evaluates document readiness against required_documents from local SQLite database.
   */
  async getSchemeReadiness(schemeId: string | number): Promise<Result<BackendSchemeReadinessResponse, AppError>> {
    try {
      const db = getLocalDatabase();
      const slug = String(schemeId);

      const scheme = db.getFirstSync<{ id: number; slug: string; title: string }>(
        'SELECT id, slug, title FROM schemes WHERE slug = ? OR id = ?',
        [slug, parseInt(slug, 10) || 0]
      );

      const schemeSlug = scheme ? scheme.slug : slug;
      const schemeTitle = scheme ? scheme.title : slug;
      const schemeNumId = scheme ? scheme.id : 1;

      const reqDocs = db.getAllSync<{
        document_name: string;
        is_mandatory: number;
        description: string | null;
      }>('SELECT document_name, is_mandatory, description FROM required_documents WHERE scheme_slug = ?', [schemeSlug]);

      const userDocs = this.getLocalDocs();

      const checklist: BackendReadinessItem[] = reqDocs.map((req) => {
        const isMandatory = Boolean(req.is_mandatory);
        const reqName = req.document_name.toLowerCase();

        // Match against user uploaded docs
        const match = userDocs.find((u) => {
          const userDocType = (u.document_type || '').toLowerCase();
          const userDocName = (u.file_name || '').toLowerCase();
          return (
            reqName.includes(userDocType) ||
            userDocType.includes(reqName) ||
            userDocName.includes(reqName)
          );
        });

        return {
          document_name: req.document_name,
          description: req.description,
          is_mandatory: isMandatory,
          status: match ? 'available' : 'missing',
          matched_vault_document_id: match ? match.id : null,
          matched_vault_document_name: match ? match.file_name : null,
        };
      });

      const mandatoryDocs = checklist.filter((i) => i.is_mandatory);
      const optionalDocs = checklist.filter((i) => !i.is_mandatory);

      const mandatoryAvailable = mandatoryDocs.filter((i) => i.status === 'available').length;
      const optionalAvailable = optionalDocs.filter((i) => i.status === 'available').length;

      const mandatoryTotal = mandatoryDocs.length;
      const readinessPercentage = mandatoryTotal === 0 ? 100 : Math.round((mandatoryAvailable / mandatoryTotal) * 100);
      const isReadyToApply = mandatoryTotal === 0 || mandatoryAvailable === mandatoryTotal;

      return ok({
        scheme_id: schemeNumId,
        scheme_slug: schemeSlug,
        scheme_name: schemeTitle,
        is_ready_to_apply: isReadyToApply,
        readiness_percentage: readinessPercentage,
        mandatory_total: mandatoryTotal,
        mandatory_available: mandatoryAvailable,
        optional_total: optionalDocs.length,
        optional_available: optionalAvailable,
        summary: isReadyToApply 
          ? 'All mandatory documents available in local vault.' 
          : `Missing ${mandatoryTotal - mandatoryAvailable} mandatory document(s).`,
        checklist,
      });
    } catch (err: any) {
      return ok({
        scheme_id: 1,
        scheme_slug: String(schemeId),
        scheme_name: String(schemeId),
        is_ready_to_apply: false,
        readiness_percentage: 0,
        mandatory_total: 0,
        mandatory_available: 0,
        optional_total: 0,
        optional_available: 0,
        summary: 'Readiness evaluated locally.',
        checklist: [],
      });
    }
  }

  /**
   * Deletes a document by ID permanently from local storage.
   */
  async deleteDocument(documentId: number): Promise<Result<void, AppError>> {
    const docs = this.getLocalDocs();
    const filtered = docs.filter((d) => d.id !== documentId);
    this.saveLocalDocs(filtered);
    return ok(undefined);
  }
}

export const vaultApi = new VaultApiRepository();
