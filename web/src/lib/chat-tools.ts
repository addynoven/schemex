import { tool } from "ai";
import { z } from "zod";
import { query } from "@/lib/db";
import { evaluateSchemeEligibility } from "@/lib/eligibility-engine";
import { cacheGet, cacheSet, buildQueryHashKey } from "@/lib/redis";

// =============================================================================
// Standardized Tool Result Types
// =============================================================================

export type ToolResult<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: string; retryable?: boolean };

// Verified offline fallback fixtures for zero-database test runs
export const SEED_FALLBACK_SCHEMES = [
  {
    id: 1,
    name: "Pradhan Mantri Kisan Samman Nidhi (PM-Kisan)",
    slug: "pm-kisan-samman-nidhi",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    state: "ALL_INDIA",
    category: "Agriculture",
    description: "Direct income support of ₹6,000 per year paid in three equal installments to small and marginal farmer families.",
  },
  {
    id: 2,
    name: "MP Chief Minister Kisan Kalyan Yojana",
    slug: "mp-kisan-kalyan",
    ministry: "Department of Farmer Welfare, Madhya Pradesh",
    state: "Madhya Pradesh",
    category: "Agriculture",
    description: "State top-up financial benefit of ₹4,000/year for MP PM-Kisan beneficiaries.",
  },
  {
    id: 3,
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    slug: "pmfby",
    ministry: "Ministry of Agriculture",
    state: "ALL_INDIA",
    category: "Agriculture",
    description: "Financial support and crop insurance against non-preventable natural risks.",
  },
];

export const SEED_FALLBACK_DOCS: Record<string, any[]> = {
  "pm-kisan-samman-nidhi": [
    { document_name: "Aadhaar Card", is_mandatory: true, description: "Linked with active mobile number for UIDAI e-KYC OTP verification" },
    { document_name: "Land Record (Khasra / Khatauni)", is_mandatory: true, description: "Verified land ownership document proving cultivable agricultural land" },
    { document_name: "Bank Passbook", is_mandatory: true, description: "Active bank account linked with Aadhaar for Direct Benefit Transfer (DBT)" },
  ],
};

// =============================================================================
// Database Execution Functions
// =============================================================================

export async function executeSearchSchemes(
  searchTerm?: string,
  state?: string,
  category?: string
): Promise<ToolResult<any[]>> {
  const cacheKey = buildQueryHashKey("cache:schemes:search", {
    q: searchTerm,
    state,
    category,
  });

  // 1. Try Redis cache first (sub-millisecond)
  const cached = await cacheGet<any[]>(cacheKey);
  if (cached) {
    return { status: "success", data: cached };
  }

  try {
    if (process.env.DATABASE_URL) {
      const conditions: string[] = [];
      const params: any[] = [];

      if (state && state !== "ALL_INDIA" && state !== "National") {
        params.push(state);
        conditions.push(`(state = $${params.length} OR state = 'ALL_INDIA')`);
      }

      if (category) {
        params.push(`%${category}%`);
        conditions.push(`category ILIKE $${params.length}`);
      }

      if (searchTerm) {
        params.push(`%${searchTerm}%`);
        conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length} OR slug ILIKE $${params.length})`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const sql = `SELECT id, name, slug, ministry, state, category, description FROM schemes ${whereClause} ORDER BY id ASC LIMIT 3`;

      const res = await query(sql, params);
      // Cache successful database result for 12 hours (43200s)
      await cacheSet(cacheKey, res.rows, 43200);
      return { status: "success", data: res.rows };
    }
  } catch (err: any) {
    console.error("❌ [executeSearchSchemes] Database query failed:", err?.message || err);
    if (process.env.NODE_ENV !== "test") {
      return {
        status: "error",
        error: "Database connection failed while searching schemes.",
        retryable: true,
      };
    }
  }

  // Fallback to verified seed catalog ONLY in test environment when DB is unreachable
  if (process.env.NODE_ENV === "test") {
    const queryLower = (searchTerm || "").toLowerCase().replace(/s$/, "");
    const queryWords = queryLower.split(/\s+/).filter(Boolean);
    const filtered = SEED_FALLBACK_SCHEMES.filter(
      (s) =>
        queryWords.length === 0 ||
        queryWords.some(
          (w) =>
            s.name.toLowerCase().includes(w) ||
            s.description.toLowerCase().includes(w) ||
            s.category.toLowerCase().includes(w) ||
            s.state.toLowerCase().includes(w)
        )
    ).slice(0, 3);
    return { status: "success", data: filtered };
  }

  return { status: "success", data: [] };
}

export async function executeGetSchemeDocuments(slugs: string[]): Promise<ToolResult<any[]>> {
  const normalizedSlugs = (slugs || []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  const cacheKey = `cache:schemes:docs:${normalizedSlugs.sort().join(",")}`;

  // 1. Try Redis cache first
  const cached = await cacheGet<any[]>(cacheKey);
  if (cached) {
    return { status: "success", data: cached };
  }

  try {
    if (process.env.DATABASE_URL && normalizedSlugs.length > 0) {
      const res = await query(
        `SELECT s.slug, s.name, rd.document_name, rd.is_mandatory, rd.description
         FROM required_documents rd
         JOIN schemes s ON rd.scheme_id = s.id
         WHERE s.slug = ANY($1) OR LOWER(s.slug) = ANY($1)
         ORDER BY s.id, rd.is_mandatory DESC, rd.id ASC`,
        [normalizedSlugs]
      );

      if (res.rows.length > 0) {
        const grouped: Record<string, { scheme_slug: string; scheme_name: string; documents: any[] }> = {};
        for (const row of res.rows) {
          if (!grouped[row.slug]) {
            grouped[row.slug] = {
              scheme_slug: row.slug,
              scheme_name: row.name,
              documents: [],
            };
          }
          grouped[row.slug].documents.push({
            document_name: row.document_name,
            is_mandatory: row.is_mandatory,
            description: row.description,
          });
        }
        const data = Object.values(grouped);
        // Cache for 24 hours (86400s)
        await cacheSet(cacheKey, data, 86400);
        return { status: "success", data };
      }
      return { status: "success", data: [] };
    }
  } catch (err: any) {
    console.error("❌ [executeGetSchemeDocuments] Database query failed:", err?.message || err);
    if (process.env.NODE_ENV !== "test") {
      return {
        status: "error",
        error: "Database connection failed while fetching scheme documents.",
        retryable: true,
      };
    }
  }

  // Fallback to seed fixture documents ONLY in test environment for known seed schemes
  if (process.env.NODE_ENV === "test") {
    const docs = slugs
      .filter((slug) => Boolean(SEED_FALLBACK_DOCS[slug]))
      .map((slug) => {
        const matchingSeed = SEED_FALLBACK_SCHEMES.find((s) => s.slug === slug);
        return {
          scheme_slug: slug,
          scheme_name: matchingSeed ? matchingSeed.name : slug,
          documents: SEED_FALLBACK_DOCS[slug] || [],
        };
      });
    return { status: "success", data: docs };
  }

  return { status: "success", data: [] };
}

export async function executeCheckEligibility(params: {
  slug: string;
  age?: number;
  state?: string;
  income?: number;
  occupation?: string;
  gender?: string;
  is_bpl?: boolean;
}): Promise<ToolResult<any>> {
  const cacheKey = buildQueryHashKey("cache:eligibility", {
    slug: params.slug,
    age: params.age,
    state: params.state,
    income: params.income,
    occupation: params.occupation,
    gender: params.gender,
    is_bpl: params.is_bpl,
  });

  // 1. Try Redis cache first
  const cached = await cacheGet<any>(cacheKey);
  if (cached) {
    return { status: "success", data: cached };
  }

  try {
    const result = await evaluateSchemeEligibility(params.slug, {
      age: params.age,
      state: params.state,
      annual_income: params.income,
      occupation: params.occupation,
      gender: params.gender,
      is_bpl: params.is_bpl,
    });
    // Cache deterministic evaluation for 6 hours (21600s)
    await cacheSet(cacheKey, result, 21600);
    return { status: "success", data: result };
  } catch (err: any) {
    console.error("❌ [executeCheckEligibility] Evaluation failed:", err?.message || err);
    return {
      status: "error",
      error: `Failed to evaluate eligibility for scheme ${params.slug}: ${err?.message || "Unknown error"}`,
    };
  }
}

// =============================================================================
// Vercel AI SDK Declarative Tools Definition
// =============================================================================

export const advisorTools = {
  searchSchemes: tool({
    description: "Search Indian government welfare schemes by state, category, or keyword. Always call this FIRST before asking for documents.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search keyword e.g. pension, scholarship, tractor"),
      state: z.string().optional().describe("Indian state name e.g. Madhya Pradesh, Rajasthan, or ALL_INDIA"),
      category: z.string().optional().describe("Sector e.g. Agriculture, Healthcare, Education, Social Welfare"),
    }),
    execute: async ({ query: q, state, category }) => executeSearchSchemes(q, state, category),
  }),

  getSchemeDocuments: tool({
    description: "Get required statutory documents for one or more scheme slugs returned from searchSchemes. Never guess slugs; pass slugs discovered from searchSchemes.",
    inputSchema: z.object({
      slugs: z.array(z.string()).describe("List of verified scheme slugs to get document checklists for"),
    }),
    execute: async ({ slugs }) => executeGetSchemeDocuments(slugs),
  }),

  checkEligibility: tool({
    description: "Verify if a citizen qualifies for a specific scheme based on age, income, state, or occupation.",
    inputSchema: z.object({
      slug: z.string().describe("Exact scheme slug"),
      age: z.number().optional(),
      state: z.string().optional(),
      income: z.number().optional(),
      occupation: z.string().optional(),
      gender: z.string().optional(),
      is_bpl: z.boolean().optional(),
    }),
    execute: async (params) => executeCheckEligibility(params),
  }),
};
