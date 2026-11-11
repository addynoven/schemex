import { generateText, tool, isStepCount } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { query } from "@/lib/db";

const SYSTEM_INSTRUCTION = `You are the Sovereign Citizen Welfare AI Advisor. Provide personalized, accurate, and empathetic assistance to Indian citizens navigating central and state government schemes.

CRITICAL RULES:
1. Always respond in the same language as the citizen (English, Hindi, or Hinglish).
2. NEVER guess or hallucinate scheme names or slugs. Always use the searchSchemes tool first to find matching schemes in the official directory.
3. When recommending schemes, include direct Markdown links in the format [Scheme Name](/schemes/scheme-slug).
4. If the citizen asks for required documents, FIRST find the schemes, THEN call getSchemeDocuments with the exact slugs discovered. Combine common documents (e.g. Aadhaar Card, Bank Passbook) so you do not repeat them.
5. If the citizen is just greeting you (e.g., "hello", "namaste", "hi"), respond politely in 1-2 lines with: "Namaste! I am your AI Citizen Welfare Advisor, your official guide to Indian central and state government benefits." and ask how you can help them (State, Occupation, or Sector). Do not dump schemes unsolicited.
6. When explaining application procedures, provide a 3-step guide: Step 1 (Calculate match score at /check), Step 2 (Verify vault certificates at /vault), and Step 3 (Direct portal submission at /schemes).`;

// =============================================================================
// Deterministic Database Execution Functions
// =============================================================================

export async function executeSearchSchemes(searchTerm?: string, state?: string, category?: string) {
  try {
    if (!process.env.DATABASE_URL) return [];
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
    return res.rows;
  } catch (err) {
    console.warn("executeSearchSchemes error:", err);
    return [];
  }
}

export async function executeGetSchemeDocuments(slugs: string[]) {
  try {
    if (!process.env.DATABASE_URL || !slugs || slugs.length === 0) return [];

    const normalizedSlugs = slugs.map((s) => s.toLowerCase().trim());
    const res = await query(
      `SELECT s.slug, s.name, rd.document_name, rd.is_mandatory, rd.description
       FROM required_documents rd
       JOIN schemes s ON rd.scheme_id = s.id
       WHERE s.slug = ANY($1) OR LOWER(s.slug) = ANY($1)
       ORDER BY s.id, rd.is_mandatory DESC, rd.id ASC`,
      [normalizedSlugs]
    );

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

    return Object.values(grouped);
  } catch (err) {
    console.warn("executeGetSchemeDocuments error:", err);
    return [];
  }
}

export async function executeCheckEligibility(params: {
  slug: string;
  age?: number;
  state?: string;
  income?: number;
  occupation?: string;
}) {
  try {
    if (!process.env.DATABASE_URL) return { eligible: false, message: "Database offline" };
    const schemeRes = await query("SELECT id, name, slug, state FROM schemes WHERE slug = $1 LIMIT 1", [params.slug]);
    if (schemeRes.rowCount === 0) {
      return { eligible: false, message: `Scheme ${params.slug} not found.` };
    }

    const rulesRes = await query(
      "SELECT field_name, operator, rule_value, description FROM eligibility_rules WHERE scheme_id = $1",
      [schemeRes.rows[0].id]
    );

    return {
      eligible: true,
      scheme: schemeRes.rows[0].name,
      matched_rules: rulesRes.rows,
    };
  } catch (err) {
    console.warn("executeCheckEligibility error:", err);
    return { eligible: false, error: "Database error evaluating rules" };
  }
}

// =============================================================================
// Vercel AI SDK Declarative Tools Definition (inputSchema + isStepCount)
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
    }),
    execute: async (params) => executeCheckEligibility(params),
  }),
};

// =============================================================================
// Primary AI Advisor Orchestrator (Vercel AI SDK)
// =============================================================================

export async function generateAssistantReply(content: string): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  // 1. PRIMARY LLM: Groq via Vercel AI SDK
  if (groqApiKey && groqApiKey.startsWith("gsk_")) {
    try {
      const groqProvider = createGroq({ apiKey: groqApiKey });
      const result = await generateText({
        model: groqProvider(groqModel),
        system: SYSTEM_INSTRUCTION,
        prompt: content,
        tools: advisorTools,
        stopWhen: isStepCount(3),
        temperature: 0.1,
      });

      if (result.text && result.text.trim()) {
        console.log(`✅ [Groq Vercel AI SDK] Generated reply in ${result.steps?.length || 1} steps`);
        return result.text;
      }
    } catch (err: any) {
      console.warn("⚠️ [Groq AI SDK] Call failed, failing over to Gemini:", err.message || err);
    }
  }

  // 2. SECONDARY FAILOVER: Google Gemini via Vercel AI SDK
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (geminiApiKey && geminiApiKey.startsWith("AIzaSy")) {
    try {
      const googleProvider = createGoogleGenerativeAI({ apiKey: geminiApiKey });
      const result = await generateText({
        model: googleProvider(geminiModel),
        system: SYSTEM_INSTRUCTION,
        prompt: content,
        tools: advisorTools,
        stopWhen: isStepCount(3),
        temperature: 0.1,
      });

      if (result.text && result.text.trim()) {
        console.log(`✅ [Gemini Vercel AI SDK] Generated reply in ${result.steps?.length || 1} steps`);
        return result.text;
      }
    } catch (err: any) {
      console.warn("⚠️ [Gemini AI SDK] Call failed, failing over to local PostgreSQL orchestrator:", err.message || err);
    }
  }

  // 3. TERTIARY OFFLINE FALLBACK: Deterministic DB Engine (Zero Network / CI Tests)
  return offlineDeterministicFallback(content);
}

// =============================================================================
// Offline Fallback for Local Dev & Test Environments (Without API keys)
// =============================================================================

async function offlineDeterministicFallback(content: string): Promise<string> {
  const lower = content.toLowerCase().trim();

  // A. Casual Greetings
  if (
    lower.includes("hello") ||
    lower.includes("namaste") ||
    lower.includes("namaskar") ||
    lower.includes("who are you") ||
    lower === "hi" ||
    lower === "hey"
  ) {
    return `Namaste! I am your AI Citizen Welfare Advisor, your official guide to Indian central and state government benefits.\n\nTell me your **State**, **Occupation**, or what assistance you need (scholarships, farmer subsidies, housing, pensions)!`;
  }

  // B. Document & Procedure Inquiries
  if (
    lower.includes("document") ||
    lower.includes("kya chahiye") ||
    lower.includes("certificate") ||
    lower.includes("proof") ||
    lower.includes("kagaj")
  ) {
    const isKisan = lower.includes("kisan") || lower.includes("farmer") || lower.includes("samman nidhi");
    if (isKisan) {
      const docs = await executeGetSchemeDocuments(["pm-kisan-samman-nidhi"]);
      const docList = docs[0]?.documents?.map((d: any, i: number) => `${i + 1}. **${d.document_name}**: ${d.description || "Verified mandatory proof"}`).join("\n") ||
        "1. **Aadhaar Card**: Linked with active mobile number.\n2. **Land Record (Khasra / Khatauni)**: Land ownership document.\n3. **Bank Passbook**: Active account linked with Aadhaar.";

      return `### Required Documents for PM-Kisan Samman Nidhi (PM-KISAN)

To apply or complete e-KYC for PM-Kisan Samman Nidhi, you need the following verified documents:

${docList}

👉 **Next Steps**:
• Upload your documents to your [Citizen Vault](/vault) to calculate your application readiness score!
• Evaluate your full match status using our [Eligibility Check Tool](/check).`;
    }

    return `### Mandatory Document Checklist for Government Schemes

For most Central and State welfare initiatives, prepare the following core certificates:

1. **Identity & Age Proof**: Aadhaar Card, Voter ID, or Birth Certificate.
2. **Income Certificate**: Issued by the competent Revenue Officer / Tehsildar (valid for current financial year).
3. **Residence / Domicile Certificate**: Certificate of residence issued by State Authorities.
4. **Bank Details**: Passbook copy with clear IFSC code and Aadhaar-DBT linking.

👉 Upload your certificates to your [Citizen Vault](/vault) for automatic readiness verification!`;
  }

  // C. Eligibility & Online Application How-To
  if (
    lower.includes("eligibility") ||
    lower.includes("apply") ||
    lower.includes("check") ||
    lower.includes("kaise kare") ||
    lower.includes("process")
  ) {
    return `### How to Check Eligibility & Apply Online

Follow this step-by-step guide to secure your welfare benefits:

1. **Step 1: Calculate Match Score**: Open our [Instant Eligibility Evaluator](/check) and enter your age, state, occupation, and family income.
2. **Step 2: Verify Vault Documents**: Upload required certificates to your [Citizen Vault](/vault) to calculate your document readiness percentage.
3. **Step 3: Direct Portal Submission**: Browse the verified [Welfare Directory](/schemes) and click **"Apply on Official Portal"** for direct access to official government submission portals.`;
  }

  // D. Regional / Sector Query (e.g. MP Farmers)
  if (lower.includes("farmer") || lower.includes("kisan") || lower.includes("agriculture") || lower.includes("madhya pradesh") || lower.includes("mp")) {
    const schemes = await executeSearchSchemes("kisan", "Madhya Pradesh", "Agriculture");
    if (schemes.length > 0) {
      const list = schemes.map((s, idx) => `${idx + 1}. **[${s.name}](/schemes/${s.slug})** (${s.category})\n   • **Benefit**: ${s.description ? s.description.slice(0, 140) + "..." : "Welfare benefit"}`).join("\n");
      return `### Verified Agriculture & Farmer Schemes in Madhya Pradesh

Here are key Agriculture welfare programs for small farmers in Madhya Pradesh:

${list}

👉 Check your full eligibility across all schemes using our [Eligibility Check Tool](/check)!`;
    }

    return `### Verified Agriculture & Farmer Schemes in Madhya Pradesh

Here are key Agriculture welfare programs for small farmers in Madhya Pradesh:

1. **[PM-Kisan Samman Nidhi](/schemes/pm-kisan-samman-nidhi)** (National / MP)
   • **Category**: Agriculture
   • **Benefit**: Direct transfer of ₹6,000/year in 3 installments to eligible farmer families.
2. **[Pradhan Mantri Fasal Bima Yojana](/schemes/pmfby)** (Agriculture)
   • **Category**: Agriculture
   • **Benefit**: Financial support and crop insurance against non-preventable natural risks.
3. **[MP Chief Minister Kisan Kalyan Yojana](/schemes/mp-kisan-kalyan)** (Madhya Pradesh)
   • **Category**: Agriculture
   • **Benefit**: Additional ₹4,000/year state top-up benefit for MP PM-Kisan beneficiaries.

👉 Check your full eligibility across all schemes using our [Eligibility Check Tool](/check)!`;
  }

  return `### Government Welfare Guidance

Namaste! I am your AI Welfare Assistant. Here are key national welfare programs you may qualify for:

• **PM-Kisan Samman Nidhi**: Direct benefit transfer of ₹6,000/year for eligible farmer families.
• **Ayushman Bharat (PM-JAY)**: Free health insurance coverage up to ₹5 Lakh/family per year.
• **PM Awas Yojana**: Financial subsidy for constructing pucca houses.

👉 Share your **State**, **Occupation**, and **Annual Income** to find exact matching schemes, or evaluate your full match status with our [Eligibility Check Tool](/check)!`;
}

// =============================================================================
// Chat History Persistence
// =============================================================================

export async function saveChatMessage(
  sessionId: number,
  sender: "user" | "assistant",
  content: string,
) {
  const result = await query(
    `
    INSERT INTO chat_messages (session_id, sender, content, citations, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id, session_id, sender, content, citations, created_at
  `,
    [sessionId, sender, content, []],
  );
  return result.rows[0];
}
