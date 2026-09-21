import type { LocalDatabase } from '../../../core/database/local-db';
import type { DocumentRequirement, SchemeRecommendation } from '../models/advisor.model';

export interface SchemeSearchRow {
  id: number;
  slug: string;
  title: string;
  ministry: string;
  state: string;
  category: string;
  is_central: number;
  benefit_summary: string;
  benefit_type: string;
  application_url: string;
  description: string;
}

export interface SearchSchemesDirectoryArgs {
  state?: string;
  category?: string;
  search_query?: string;
}

export interface SearchSchemesDirectoryResult {
  status: 'success' | 'error';
  total_count_in_directory: number;
  state_filtered: string;
  category_filtered: string;
  sample_schemes: SchemeRecommendation[];
  directory_url: string;
}

export interface CheckEligibilityArgs {
  state?: string;
  category?: string;
  topic?: string;
  occupation?: string;
  age?: number;
  annual_income?: number;
  caste_category?: string;
  gender?: string;
  jurisdiction?: 'both' | 'central_only' | 'state_only';
}

export interface CheckEligibilityResult {
  status: 'success' | 'error';
  total_matched_count: number;
  state_specific_count: number;
  national_count: number;
  top_recommendations: SchemeRecommendation[];
  citations: string[];
  sources: { title: string; slug: string; category?: string; state?: string }[];
}

export interface GetSchemeDetailsArgs {
  scheme_slug_or_id: string;
}

export interface GetSchemeDetailsResult {
  status: 'success' | 'error' | 'not_found';
  scheme?: SchemeRecommendation;
  application_url?: string;
  benefits?: { title: string; details: string; amount_inr?: number }[];
  documents?: DocumentRequirement[];
  steps?: string[];
}

/**
 * Normalizes state name or checks for All-India / National aliases
 */
export function isNationalState(state?: string): boolean {
  if (!state) return true;
  const s = state.trim().toUpperCase();
  return s === 'ALL_INDIA' || s === 'ALL-INDIA' || s === 'NATIONAL' || s === 'CENTRAL' || s === 'ALL';
}

/**
 * Tool 1: search_schemes_directory
 * Queries directory by state, category, or search query.
 */
export function executeSearchSchemesDirectory(
  db: LocalDatabase,
  args: SearchSchemesDirectoryArgs
): SearchSchemesDirectoryResult {
  try {
    const targetState = args.state?.trim();
    const isSpecificState = targetState && !isNationalState(targetState);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (isSpecificState) {
      conditions.push("(state = 'ALL_INDIA' OR LOWER(state) = LOWER(?))");
      params.push(targetState);
    }

    if (args.category && args.category.toLowerCase() !== 'all') {
      conditions.push('LOWER(category) LIKE LOWER(?)');
      params.push(`%${args.category.trim()}%`);
    }

    if (args.search_query && args.search_query.trim()) {
      const q = `%${args.search_query.trim()}%`;
      conditions.push('(LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(slug) LIKE LOWER(?))');
      params.push(q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.getFirstSync<{ total: number }>(
      `SELECT COUNT(*) as total FROM schemes ${whereClause}`,
      params
    );
    const totalCount = countRow?.total || 0;

    // Fetch sample schemes prioritizing target state schemes first, then central
    const orderClause = isSpecificState
      ? `ORDER BY CASE WHEN LOWER(state) = LOWER(?) THEN 0 ELSE 1 END, id ASC`
      : 'ORDER BY id ASC';

    const orderParams = isSpecificState ? [...params, targetState] : params;

    const rows = db.getAllSync<SchemeSearchRow>(
      `SELECT id, slug, title, ministry, state, category, is_central, benefit_summary, benefit_type, application_url, description
       FROM schemes
       ${whereClause}
       ${orderClause}
       LIMIT 4`,
      orderParams
    );

    const sampleSchemes: SchemeRecommendation[] = rows.map((r) => {
      const isNational = isNationalState(r.state) || r.is_central === 1;
      return {
        id: r.slug,
        title: r.title,
        ministry: r.ministry || (isNational ? 'Government of India' : `Govt of ${r.state}`),
        benefitAmount: r.benefit_type || '',
        benefitDescription: r.benefit_summary || r.description?.slice(0, 120) || 'Government Welfare Assistance',
        tags: ['✓ Verified', isNational ? 'Central Scheme' : `State Scheme (${r.state})`],
        category: r.category,
      };
    });

    return {
      status: 'success',
      total_count_in_directory: totalCount,
      state_filtered: targetState || 'All Jurisdictions',
      category_filtered: args.category || 'All Categories',
      sample_schemes: sampleSchemes,
      directory_url: `/schemes${args.category ? `?category=${encodeURIComponent(args.category)}` : ''}`,
    };
  } catch (err) {
    return {
      status: 'error',
      total_count_in_directory: 0,
      state_filtered: args.state || '',
      category_filtered: args.category || '',
      sample_schemes: [],
      directory_url: '/schemes',
    };
  }
}

/**
 * Tool 2: check_eligibility
 * Matches citizen demographics against schemes, strictly bounding by jurisdiction.
 */
export function executeCheckEligibility(
  db: LocalDatabase,
  args: CheckEligibilityArgs
): CheckEligibilityResult {
  try {
    const targetState = args.state?.trim();
    const isSpecificState = targetState && !isNationalState(targetState);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (args.jurisdiction === 'central_only') {
      conditions.push("(state = 'ALL_INDIA' OR is_central = 1)");
    } else if (args.jurisdiction === 'state_only' && isSpecificState) {
      conditions.push('LOWER(state) = LOWER(?)');
      params.push(targetState);
    } else if (isSpecificState) {
      conditions.push("(state = 'ALL_INDIA' OR LOWER(state) = LOWER(?))");
      params.push(targetState);
    }

    if (args.category && args.category.toLowerCase() !== 'all') {
      conditions.push('LOWER(category) LIKE LOWER(?)');
      params.push(`%${args.category.trim()}%`);
    }

    if (args.occupation && args.occupation.trim()) {
      const occ = `%${args.occupation.trim()}%`;
      conditions.push(
        '(LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(category) LIKE LOWER(?))'
      );
      params.push(occ, occ, occ);
    }

    if (args.topic && args.topic.trim()) {
      const top = `%${args.topic.trim()}%`;
      conditions.push(
        '(LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))'
      );
      params.push(top, top);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const orderClause = isSpecificState
      ? `ORDER BY CASE WHEN LOWER(state) = LOWER(?) THEN 0 ELSE 1 END, id ASC`
      : 'ORDER BY id ASC';

    const orderParams = isSpecificState ? [...params, targetState] : params;

    const rows = db.getAllSync<SchemeSearchRow>(
      `SELECT id, slug, title, ministry, state, category, is_central, benefit_summary, benefit_type, application_url, description
       FROM schemes
       ${whereClause}
       ${orderClause}
       LIMIT 10`,
      orderParams
    );

    let stateCount = 0;
    let nationalCount = 0;

    const recommendations: SchemeRecommendation[] = rows.slice(0, 3).map((r) => {
      const isNational = isNationalState(r.state) || r.is_central === 1;
      if (isNational) {
        nationalCount++;
      } else {
        stateCount++;
      }

      return {
        id: r.slug,
        title: r.title,
        ministry: r.ministry || (isNational ? 'Government of India' : `Govt of ${r.state}`),
        benefitAmount: r.benefit_type || '',
        benefitDescription: r.benefit_summary || r.description?.slice(0, 120) || 'Verified citizen welfare scheme',
        tags: ['✓ Verified', isNational ? 'Central Scheme' : `State Scheme (${r.state})`],
        category: r.category,
      };
    });

    const citations = recommendations.map((r) => r.id);
    const sources = recommendations.map((r) => ({
      title: r.title,
      slug: r.id,
      category: r.category,
      state: targetState || 'ALL_INDIA',
    }));

    return {
      status: 'success',
      total_matched_count: rows.length,
      state_specific_count: stateCount,
      national_count: nationalCount,
      top_recommendations: recommendations,
      citations,
      sources,
    };
  } catch (err) {
    return {
      status: 'error',
      total_matched_count: 0,
      state_specific_count: 0,
      national_count: 0,
      top_recommendations: [],
      citations: [],
      sources: [],
    };
  }
}

/**
 * Tool 3: get_scheme_details
 * Fetches required documents, benefits, and application guidelines for specific scheme(s).
 */
export function executeGetSchemeDetails(
  db: LocalDatabase,
  args: GetSchemeDetailsArgs
): GetSchemeDetailsResult {
  try {
    const queryTerm = args.scheme_slug_or_id.trim();

    const row = db.getFirstSync<SchemeSearchRow>(
      `SELECT id, slug, title, ministry, state, category, is_central, benefit_summary, benefit_type, application_url, description
       FROM schemes
       WHERE slug = ? OR id = ? OR LOWER(title) = LOWER(?) OR LOWER(slug) = LOWER(?)
       LIMIT 1`,
      [queryTerm, Number(queryTerm) || -1, queryTerm, queryTerm]
    );

    if (!row) {
      return { status: 'not_found' };
    }

    const isNational = isNationalState(row.state) || row.is_central === 1;
    const scheme: SchemeRecommendation = {
      id: row.slug,
      title: row.title,
      ministry: row.ministry || (isNational ? 'Government of India' : `Govt of ${row.state}`),
      benefitAmount: row.benefit_type || '',
      benefitDescription: row.benefit_summary || row.description || 'Verified welfare assistance',
      tags: ['✓ Verified', isNational ? 'Central Scheme' : `State Scheme (${row.state})`],
      category: row.category,
    };

    // Required Documents
    const docRows = db.getAllSync<{
      id: number;
      document_name: string;
      is_mandatory: number;
      description: string;
    }>(
      `SELECT id, document_name, is_mandatory, description
       FROM required_documents
       WHERE scheme_slug = ?
       ORDER BY is_mandatory DESC, id ASC`,
      [row.slug]
    );

    const documents: DocumentRequirement[] =
      docRows.length > 0
        ? docRows.map((d) => ({
            id: `doc_${d.id}`,
            name: d.document_name,
            mandatory: Boolean(d.is_mandatory),
          }))
        : [
            { id: 'doc_aadhaar', name: 'Aadhaar Card (linked with mobile)', mandatory: true },
            { id: 'doc_bank', name: 'DBT-Enabled Bank Passbook', mandatory: true },
            { id: 'doc_income', name: 'Income Certificate (Revenue Authority)', mandatory: true },
            { id: 'doc_domicile', name: 'Domicile / Residence Certificate', mandatory: true },
          ];

    // Benefits
    const benefitRows = db.getAllSync<{
      title: string;
      details: string;
      amount_inr: number;
    }>(
      `SELECT title, details, amount_inr
       FROM benefits
       WHERE scheme_slug = ?
       ORDER BY id ASC`,
      [row.slug]
    );

    const benefits = benefitRows.map((b) => ({
      title: b.title,
      details: b.details,
      amount_inr: b.amount_inr,
    }));

    const steps = [
      `1. Keep your verified documents ready in the Scheme App Vault.`,
      `2. Visit the official application portal: ${row.application_url || 'https://services.india.gov.in'}.`,
      `3. Complete biometric e-KYC using your Aadhaar-linked mobile OTP.`,
      `4. Submit the online form and note your Application Reference Number for tracking.`,
    ];

    return {
      status: 'success',
      scheme,
      application_url: row.application_url,
      benefits,
      documents,
      steps,
    };
  } catch (err) {
    return { status: 'error' };
  }
}

export const ADVISOR_TOOLS_DECLARATIONS_GROQ = [
  {
    type: 'function' as const,
    function: {
      name: 'check_eligibility',
      description:
        'Check which government welfare schemes a citizen qualifies for based on demographic criteria and optional sector/category. Use this when the citizen asks what welfare schemes they qualify for or provides demographic details seeking personalized recommendations.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Sector/category, e.g. Education, Business & Finance, Agriculture, Healthcare, Housing, Employment & Skills, Social Welfare, Women & Child.',
          },
          topic: {
            type: 'string',
            description: 'Specific sub-topic or keyword to match, e.g. scholarship, loan, subsidy, tablet.',
          },
          state: {
            type: 'string',
            description: 'Indian state or union territory name, e.g. Uttar Pradesh, Goa, Madhya Pradesh, Maharashtra, or ALL_INDIA.',
          },
          occupation: {
            type: 'string',
            description: 'Citizen occupation, e.g. student, farmer, artisan, unemployed, self-employed.',
          },
          age: {
            type: 'integer',
            description: 'Age in years.',
          },
          annual_income: {
            type: 'number',
            description: 'Annual household income in INR.',
          },
          caste_category: {
            type: 'string',
            description: 'Caste category, e.g. General, OBC, SC, ST, EWS.',
          },
          gender: {
            type: 'string',
            description: 'Gender, e.g. female, male, other.',
          },
          jurisdiction: {
            type: 'string',
            enum: ['both', 'central_only', 'state_only'],
            description: 'Scheme jurisdiction: "both" (default), "central_only", or "state_only".',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_schemes_directory',
      description:
        'Search and count available government welfare schemes in the official registry by state, category, or keyword. Use this whenever the citizen asks how many schemes exist in total, asks for all schemes in a state or sector, or wants a catalog count.',
      parameters: {
        type: 'object',
        properties: {
          state: {
            type: 'string',
            description: 'State name to filter by, e.g. "Uttar Pradesh", "Goa", "All India".',
          },
          category: {
            type: 'string',
            description: 'Category filter, e.g. "Education", "Agriculture", "Healthcare".',
          },
          search_query: {
            type: 'string',
            description: 'Keyword search query, e.g. "scholarship", "irrigation", "pension".',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_scheme_details',
      description:
        'Get comprehensive details, application process, and official required documents for a scheme by its slug or ID. Use this when the citizen asks how to apply, asks about required documents, or asks follow-up questions referencing schemes previously listed.',
      parameters: {
        type: 'object',
        properties: {
          scheme_slug_or_id: {
            type: 'string',
            description: 'Unique scheme slug or identifier from previous conversation turns.',
          },
        },
        required: ['scheme_slug_or_id'],
      },
    },
  },
];

export const ADVISOR_TOOLS_DECLARATIONS_GEMINI = [
  {
    functionDeclarations: [
      {
        name: 'check_eligibility',
        description:
          'Check which government welfare schemes a citizen qualifies for based on demographic criteria and optional sector/category.',
        parameters: {
          type: 'OBJECT',
          properties: {
            category: { type: 'STRING' },
            topic: { type: 'STRING' },
            state: { type: 'STRING' },
            occupation: { type: 'STRING' },
            age: { type: 'INTEGER' },
            annual_income: { type: 'NUMBER' },
            caste_category: { type: 'STRING' },
            gender: { type: 'STRING' },
            jurisdiction: { type: 'STRING' },
          },
        },
      },
      {
        name: 'search_schemes_directory',
        description:
          'Search and count available government welfare schemes in the official registry by state, category, or keyword.',
        parameters: {
          type: 'OBJECT',
          properties: {
            state: { type: 'STRING' },
            category: { type: 'STRING' },
            search_query: { type: 'STRING' },
          },
        },
      },
      {
        name: 'get_scheme_details',
        description:
          'Get comprehensive details, application process, and official required documents for a scheme by its slug or ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            scheme_slug_or_id: { type: 'STRING' },
          },
          required: ['scheme_slug_or_id'],
        },
      },
    ],
  },
];

