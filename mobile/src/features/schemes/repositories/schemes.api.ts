import { AppError } from '../../../core/errors/error-handler';
import { ok, type Result } from '../../../core/errors/result';
import { getLocalDatabase } from '../../../core/database/local-db';
import { mmkvStorage } from '../../../core/storage/mmkv';
import { apiClient } from '../../../core/api/client';
import {
  BenefitType,
  PaginatedSchemes,
  SchemeCategory,
  SchemeFilter,
  SchemeItem,
} from '../models/schemes.model';

export const KEY_LOCAL_CATALOG_VERSION = 'schemes_catalog_version';

export interface CatalogVersionInfo {
  version: number;
  lastUpdatedAt: string;
  totalSchemes: number;
  isUpdateAvailable: boolean;
  localVersion: number;
}

export interface DeltaSyncResult {
  syncedCount: number;
  newVersion: number;
  isSuccess: boolean;
}

export interface BackendBenefit {
  id: number;
  scheme_slug: string;
  title: string;
  benefit_type: string;
  amount_inr: number;
  frequency: string;
  details: string;
}

export interface BackendEligibilityRule {
  id: number;
  scheme_slug: string;
  field_name: string;
  operator: string;
  rule_value: string;
  description: string;
}

export interface BackendRequiredDoc {
  id: number;
  scheme_slug: string;
  document_name: string;
  is_mandatory: boolean;
  description: string | null;
}

export interface RawSchemeRow {
  id: number;
  slug: string;
  title: string;
  ministry: string;
  state: string;
  category: string;
  is_central: number;
  benefit_summary: string;
  benefit_type?: string;
  rules_count: number;
  docs_count: number;
  application_url: string | null;
  description: string;
  last_verified_at: string | null;
}

const CACHE_KEY_SAVED_SCHEMES = 'saved_schemes_list';

function normalizeCategory(rawCategory: string): SchemeCategory {
  if (!rawCategory) return 'General';
  return rawCategory.trim();
}

function normalizeBenefitType(row: RawSchemeRow, benefits?: BackendBenefit[]): BenefitType {
  const texts = [
    row.title || '',
    row.category || '',
    row.description || '',
    row.benefit_summary || '',
    ...(benefits || []).map((b) => `${b.title} ${b.details}`),
  ];
  const combined = texts.join(' ').toLowerCase();

  if (
    /\b(pension|allowance|scholarship|stipend|savings deposit|fixed deposit|dbt)\b/.test(combined) &&
    !/\b(business loan|micro-credit|mudra|collateral-free|loan)\b/.test(combined)
  ) {
    return 'cash_grant';
  }

  if (
    /\b(loan|loans|micro-credit|mudra|collateral-free|lending|overdraft|credit guarantee)\b/.test(combined)
  ) {
    return 'loan';
  }

  if (/\b(subsidy|subsidized|rebate|concession)\b/.test(combined)) {
    return 'subsidy';
  }

  return 'cash_grant';
}

function extractBenefitAmount(summary?: string, benefits?: BackendBenefit[]): string | undefined {
  if (benefits && benefits.length > 0) {
    const b = benefits[0];
    if (b.amount_inr && b.amount_inr > 0) {
      const formatted = b.amount_inr >= 100000 
        ? `₹${(b.amount_inr / 100000).toFixed(0)} Lakh` 
        : `₹${b.amount_inr.toLocaleString('en-IN')}`;
      const freq = b.frequency && b.frequency !== 'One-time' ? ` / ${b.frequency.toLowerCase()}` : '';
      return `${formatted}${freq}`;
    }
  }

  if (summary) {
    const match = summary.match(/(?:₹\s*|\bRs\.?\s*)(\d[\d,.]*)\s*(lakhs?|crores?|cr|thousand|k)?(?:\s*(?:\/|per)\s*(year|yr|month|installment|annum))?/i);
    if (match && match[1]) {
      const num = match[1].replace(/[.,]$/, '').trim();
      if (num) {
        const unit = match[2] ? ` ${match[2].trim()}` : '';
        const freq = match[3] ? ` / ${match[3].trim()}` : '';
        return `₹${num}${unit}${freq}`;
      }
    }
  }
  return undefined;
}

export function mapRowToSchemeItem(
  row: RawSchemeRow,
  benefits: BackendBenefit[] = [],
  rules: BackendEligibilityRule[] = [],
  docs: BackendRequiredDoc[] = [],
  isBookmarked = false
): SchemeItem {
  const benefitAmount = extractBenefitAmount(row.benefit_summary, benefits);
  const benefitType = (row.benefit_type as BenefitType) || normalizeBenefitType(row, benefits);

  return {
    id: row.slug || String(row.id),
    title: row.title,
    ministry: row.ministry || 'Government of India',
    benefitAmount,
    benefitSummary: row.benefit_summary || row.description,
    jurisdiction: row.state === 'ALL_INDIA' || !row.state ? 'All India' : row.state,
    category: normalizeCategory(row.category),
    benefitType,
    tags: [row.category || 'General'],
    description: row.description || '',
    launchDate: row.last_verified_at || undefined,
    officialUrl: row.application_url || undefined,
    isBookmarked,
    rawBenefits: benefits.map((b) => ({ title: b.title, description: b.details || b.title })),
    eligibilityRules: rules.map((r) => ({
      field_name: r.field_name,
      operator: r.operator,
      rule_value: r.rule_value,
    })),
    requiredDocuments: docs.map((d) => ({
      document_name: d.document_name,
      is_mandatory: Boolean(d.is_mandatory),
      description: d.description || undefined,
    })),
  };
}

export class SchemesApiRepository {
  /**
   * Fetches schemes with pagination and total count from local SQLite database (0ms network).
   */
  async getSchemesPaginated(
    filter?: Partial<SchemeFilter>,
    skip: number = 0,
    limit: number = 50
  ): Promise<Result<PaginatedSchemes, AppError>> {
    try {
      const db = getLocalDatabase();
      const whereClauses: string[] = [];
      const params: unknown[] = [];

      if (filter?.query && filter.query.trim().length > 0) {
        whereClauses.push('(title LIKE ? OR description LIKE ? OR ministry LIKE ?)');
        const q = `%${filter.query.trim()}%`;
        params.push(q, q, q);
      }

      if (filter?.category && filter.category !== 'all') {
        whereClauses.push('category = ?');
        params.push(filter.category);
      }

      if (filter?.jurisdiction && filter.jurisdiction !== 'All India') {
        if (filter.jurisdiction === 'Central' || filter.jurisdiction === 'Central Only') {
          whereClauses.push("(state = 'ALL_INDIA' OR is_central = 1)");
        } else {
          whereClauses.push("(state = ? OR state = 'ALL_INDIA')");
          params.push(filter.jurisdiction);
        }
      }

      if (filter?.benefitType && filter.benefitType !== 'all') {
        whereClauses.push('benefit_type = ?');
        params.push(filter.benefitType);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count query
      const countRow = db.getFirstSync<{ count: number }>(
        `SELECT COUNT(*) as count FROM schemes ${whereSql}`,
        params
      );
      const total = countRow?.count ?? 0;

      // Select page
      const effectiveLimit = Math.min(Math.max(limit, 1), 100);
      const rows = db.getAllSync<RawSchemeRow>(
        `SELECT * FROM schemes ${whereSql} ORDER BY id ASC LIMIT ? OFFSET ?`,
        [...params, effectiveLimit, skip]
      );

      const savedIds = new Set(this.getSavedSchemeIds());
      const items = rows.map((r) => mapRowToSchemeItem(r, [], [], [], savedIds.has(r.slug)));

      return ok({
        items,
        total,
        skip,
        limit: effectiveLimit,
        hasMore: skip + items.length < total,
      });
    } catch (err: any) {
      console.error('getSchemesPaginated SQLite query error:', err);
      return ok({
        items: [],
        total: 0,
        skip,
        limit,
        hasMore: false,
      });
    }
  }

  /**
   * Fetches unpaginated schemes list matching filter for react-query.
   */
  async getSchemes(filter?: Partial<SchemeFilter>): Promise<Result<SchemeItem[], AppError>> {
    const res = await this.getSchemesPaginated(filter, 0, 100);
    if (res.ok) {
      return ok(res.data.items);
    }
    return ok([]);
  }

  /**
   * Returns distinct categories and scheme counts from local SQLite database.
   */
  async getCategories(): Promise<Result<Array<{ category: string; count: number }>, AppError>> {
    try {
      const db = getLocalDatabase();
      const rows = db.getAllSync<{ category: string; count: number }>(
        `SELECT category, COUNT(*) as count FROM schemes WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC`
      );
      return ok(rows);
    } catch (err: any) {
      return ok([]);
    }
  }

  /**
   * Returns states list with counts from local SQLite database.
   */
  async getStates(): Promise<Result<Array<{ state: string; count: number }>, AppError>> {
    try {
      const db = getLocalDatabase();
      const rows = db.getAllSync<{ state: string; count: number }>(
        `SELECT state, COUNT(*) as count FROM schemes WHERE state IS NOT NULL AND state != 'ALL_INDIA' GROUP BY state ORDER BY count DESC`
      );
      return ok(rows);
    } catch (err: any) {
      return ok([]);
    }
  }

  /**
   * Returns complete scheme details including rules and benefits by slug.
   */
  async getSchemeBySlug(slug: string): Promise<Result<SchemeItem, AppError>> {
    try {
      const db = getLocalDatabase();
      const row = db.getFirstSync<RawSchemeRow>('SELECT * FROM schemes WHERE slug = ? OR id = ?', [slug, slug]);
      if (!row) {
        return ok(mapRowToSchemeItem({
          id: 0,
          slug,
          title: slug,
          ministry: '',
          state: '',
          category: 'General',
          is_central: 0,
          benefit_summary: '',
          rules_count: 0,
          docs_count: 0,
          application_url: null,
          description: '',
          last_verified_at: null,
        }));
      }

      const actualSlug = row.slug;
      const benefits = db.getAllSync<BackendBenefit>('SELECT * FROM benefits WHERE scheme_slug = ?', [actualSlug]);
      const rules = db.getAllSync<BackendEligibilityRule>('SELECT * FROM eligibility_rules WHERE scheme_slug = ?', [actualSlug]);
      const docs = db.getAllSync<BackendRequiredDoc>('SELECT * FROM required_documents WHERE scheme_slug = ?', [actualSlug]);

      const savedIds = new Set(this.getSavedSchemeIds());
      const item = mapRowToSchemeItem(row, benefits, rules, docs, savedIds.has(actualSlug));
      return ok(item);
    } catch (err: any) {
      return ok(mapRowToSchemeItem({
        id: 0,
        slug,
        title: slug,
        ministry: '',
        state: '',
        category: 'General',
        is_central: 0,
        benefit_summary: '',
        rules_count: 0,
        docs_count: 0,
        application_url: null,
        description: '',
        last_verified_at: null,
      }));
    }
  }

  async getSchemeById(id: string | number): Promise<Result<SchemeItem, AppError>> {
    const slug = String(id);
    return this.getSchemeBySlug(slug);
  }

  // Bookmarking / Saved Schemes (Stored in MMKV)
  private getSavedSchemeIds(): string[] {
    try {
      const raw = mmkvStorage.getString(CACHE_KEY_SAVED_SCHEMES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async getSavedSchemes(): Promise<Result<SchemeItem[], AppError>> {
    const slugs = this.getSavedSchemeIds();
    const items: SchemeItem[] = [];
    for (const slug of slugs) {
      const res = await this.getSchemeBySlug(slug);
      if (res.ok) items.push(res.data);
    }
    return ok(items);
  }

  async saveScheme(schemeId: string): Promise<Result<boolean, AppError>> {
    const current = new Set(this.getSavedSchemeIds());
    current.add(schemeId);
    mmkvStorage.set(CACHE_KEY_SAVED_SCHEMES, JSON.stringify(Array.from(current)));
    return ok(true);
  }

  async removeSavedScheme(schemeId: string): Promise<Result<boolean, AppError>> {
    const current = new Set(this.getSavedSchemeIds());
    current.delete(schemeId);
    mmkvStorage.set(CACHE_KEY_SAVED_SCHEMES, JSON.stringify(Array.from(current)));
    return ok(true);
  }

  // ─── Catalog Versioning & Delta Sync Engine ─────────────────────────────────

  getLocalCatalogVersion(): number {
    try {
      const val = mmkvStorage.getString(KEY_LOCAL_CATALOG_VERSION);
      return val ? Number(val) : 0;
    } catch {
      return 0;
    }
  }

  setLocalCatalogVersion(version: number): void {
    mmkvStorage.set(KEY_LOCAL_CATALOG_VERSION, String(version));
  }

  async checkCatalogVersion(): Promise<Result<CatalogVersionInfo, AppError>> {
    try {
      const res = await apiClient.request<{
        version: number;
        last_updated_at: string;
        total_schemes: number;
      }>('/schemes/version', { skipAuth: true });

      const localVersion = this.getLocalCatalogVersion();

      if (!res.ok) {
        return ok({
          version: localVersion,
          lastUpdatedAt: '',
          totalSchemes: 4147,
          isUpdateAvailable: false,
          localVersion,
        });
      }

      const cloudVersion = Number(res.data.version || 0);
      const isUpdateAvailable = localVersion > 0 && cloudVersion > localVersion;

      // If localVersion was never set, initialize it with cloudVersion on first successful check
      if (localVersion === 0 && cloudVersion > 0) {
        this.setLocalCatalogVersion(cloudVersion);
      }

      return ok({
        version: cloudVersion,
        lastUpdatedAt: res.data.last_updated_at,
        totalSchemes: res.data.total_schemes,
        isUpdateAvailable,
        localVersion: localVersion || cloudVersion,
      });
    } catch {
      const localVersion = this.getLocalCatalogVersion();
      return ok({
        version: localVersion,
        lastUpdatedAt: '',
        totalSchemes: 4147,
        isUpdateAvailable: false,
        localVersion,
      });
    }
  }

  async syncDeltaFromCloud(): Promise<Result<DeltaSyncResult, AppError>> {
    try {
      const localVersion = this.getLocalCatalogVersion();
      const res = await apiClient.request<{
        schemes: RawSchemeRow[];
        count: number;
        synced_version: number;
        has_more: boolean;
      }>('/schemes/sync', {
        params: { since: localVersion, limit: 500 },
        skipAuth: true,
      });

      if (!res.ok) {
        return ok({ syncedCount: 0, newVersion: localVersion, isSuccess: false });
      }

      const { schemes, synced_version } = res.data;
      if (schemes && schemes.length > 0) {
        const db = getLocalDatabase();
        for (const s of schemes) {
          db.runSync(
            `INSERT OR REPLACE INTO schemes (
              id, slug, title, ministry, state, category, is_central,
              benefit_summary, benefit_type, rules_count, docs_count,
              application_url, description, last_verified_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              s.id,
              s.slug,
              s.title,
              s.ministry,
              s.state,
              s.category,
              s.is_central,
              s.benefit_summary,
              s.benefit_type || 'cash_grant',
              s.rules_count,
              s.docs_count,
              s.application_url,
              s.description,
              s.last_verified_at,
            ]
          );
        }
      }

      if (synced_version && synced_version > localVersion) {
        this.setLocalCatalogVersion(synced_version);
      }

      mmkvStorage.set('sync_ts_schemes_list', String(Date.now()));

      return ok({
        syncedCount: schemes?.length || 0,
        newVersion: synced_version || localVersion,
        isSuccess: true,
      });
    } catch {
      return ok({ syncedCount: 0, newVersion: this.getLocalCatalogVersion(), isSuccess: false });
    }
  }
}

export const schemesApiRepository = new SchemesApiRepository();
export const schemesApi = schemesApiRepository;
