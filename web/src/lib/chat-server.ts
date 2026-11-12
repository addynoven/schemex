import { generateText, isStepCount } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { query } from "@/lib/db";
import {
  advisorTools,
  executeSearchSchemes,
  executeGetSchemeDocuments,
  executeCheckEligibility,
  type ToolResult,
} from "@/lib/chat-tools";

export {
  advisorTools,
  executeSearchSchemes,
  executeGetSchemeDocuments,
  executeCheckEligibility,
};

export interface ChatMetrics {
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AssistantReplyResult {
  content: string;
  provider: "groq" | "gemini" | "offline-database";
  isDegraded: boolean;
  metrics: ChatMetrics;
}

const SYSTEM_INSTRUCTION = `You are the Sovereign Citizen Welfare AI Advisor. Provide personalized, accurate, and empathetic assistance to Indian citizens navigating central and state government schemes.

CRITICAL RULES:
1. Always respond in the same language as the citizen (English, Hindi, or Hinglish).
2. NEVER guess or hallucinate scheme names or slugs. Always use the searchSchemes tool first to find matching schemes in the official directory.
3. When recommending schemes, include direct Markdown links in the format [Scheme Name](/schemes/scheme-slug).
4. SEQUENTIAL CHAINING:
   - If the citizen shares their profile (age, income, state, or occupation) or asks whether they qualify/are eligible, FIRST search schemes, THEN call checkEligibility for each candidate scheme to verify exact match rules before claiming they are eligible.
   - If the citizen ONLY asked about schemes/eligibility, provide a concise summary of the Top 3 eligible picks with clear reasons why they qualify. Do NOT call getSchemeDocuments unless they explicitly asked for documents ("what docs", "kagaj", "documents needed").
   - If the citizen explicitly asks for required documents, call getSchemeDocuments with the candidate slugs. Combine common documents (e.g. Aadhaar Card, Bank Passbook) so you do not repeat them.
5. If the citizen is just greeting you (e.g., "hello", "namaste", "hi"), respond politely in 1-2 lines with: "Namaste! I am your AI Citizen Welfare Advisor, your official guide to Indian central and state government benefits." and ask how you can help them (State, Occupation, or Sector). Do not dump schemes unsolicited.
6. When explaining application procedures, provide a 3-step guide: Step 1 (Calculate match score at /check), Step 2 (Verify vault certificates at /vault), and Step 3 (Direct portal submission at /schemes).`;

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "for", "to", "of", "and", "or", "is", "are",
  "what", "which", "who", "where", "how", "can", "tell", "me", "about", "give",
  "please", "help", "with", "available", "i", "my", "we", "our", "you", "your",
  "hello", "hi", "hey", "namaste", "namaskar", "kya", "hai", "ke", "liye", "ko",
  "scheme", "schemes", "small"
]);

export async function generateAssistantReply(content: string): Promise<string>;
export async function generateAssistantReply(
  content: string,
  options: { returnDetails: true }
): Promise<AssistantReplyResult>;
export async function generateAssistantReply(
  content: string,
  options?: { returnDetails?: boolean }
): Promise<string | AssistantReplyResult> {
  const startTime = performance.now();
  const groqApiKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  // 1. PRIMARY LLM: Groq via Vercel AI SDK
  if (groqApiKey && groqApiKey.startsWith("gsk_") && process.env.NODE_ENV !== "test") {
    try {
      const groqProvider = createGroq({ apiKey: groqApiKey });
      const result = await generateText({
        model: groqProvider(groqModel),
        system: SYSTEM_INSTRUCTION,
        prompt: content,
        tools: advisorTools,
        stopWhen: isStepCount(3),
        temperature: 0.1,
        abortSignal: AbortSignal.timeout(4000),
      });

      if (result.text && result.text.trim()) {
        const latencyMs = Math.round(performance.now() - startTime);
        const metrics: ChatMetrics = {
          latencyMs,
          promptTokens: (result as any).usage?.promptTokens || 0,
          completionTokens: (result as any).usage?.completionTokens || 0,
          totalTokens: (result as any).usage?.totalTokens || 0,
        };
        console.log(`✅ [Groq Vercel AI SDK] Reply in ${metrics.latencyMs}ms (${metrics.totalTokens} tokens)`);

        if (options?.returnDetails) {
          return {
            content: result.text,
            provider: "groq",
            isDegraded: false,
            metrics,
          };
        }
        return result.text;
      }
    } catch (err: any) {
      console.warn("⚠️ [Groq AI SDK] Call failed, failing over to Gemini:", err.message || err);
    }
  }

  // 2. SECONDARY FAILOVER: Google Gemini via Vercel AI SDK
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (geminiApiKey && geminiApiKey.startsWith("AIzaSy") && process.env.NODE_ENV !== "test") {
    try {
      const googleProvider = createGoogleGenerativeAI({ apiKey: geminiApiKey });
      const result = await generateText({
        model: googleProvider(geminiModel),
        system: SYSTEM_INSTRUCTION,
        prompt: content,
        tools: advisorTools,
        stopWhen: isStepCount(3),
        temperature: 0.1,
        abortSignal: AbortSignal.timeout(4000),
      });

      if (result.text && result.text.trim()) {
        const latencyMs = Math.round(performance.now() - startTime);
        const metrics: ChatMetrics = {
          latencyMs,
          promptTokens: (result as any).usage?.promptTokens || 0,
          completionTokens: (result as any).usage?.completionTokens || 0,
          totalTokens: (result as any).usage?.totalTokens || 0,
        };
        console.log(`✅ [Gemini Vercel AI SDK] Reply in ${metrics.latencyMs}ms (${metrics.totalTokens} tokens)`);

        if (options?.returnDetails) {
          return {
            content: result.text,
            provider: "gemini",
            isDegraded: false,
            metrics,
          };
        }
        return result.text;
      }
    } catch (err: any) {
      console.warn("⚠️ [Gemini AI SDK] Call failed, failing over to local database orchestrator:", err.message || err);
    }
  }

  // 3. TERTIARY OFFLINE FALLBACK: Pure Database Engine
  const offlineContent = await offlineDatabaseOrchestrator(content);
  const latencyMs = Math.round(performance.now() - startTime);
  const metrics: ChatMetrics = {
    latencyMs,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  if (options?.returnDetails) {
    return {
      content: offlineContent,
      provider: "offline-database",
      isDegraded: true,
      metrics,
    };
  }
  return offlineContent;
}

// =============================================================================
// Offline Database Orchestrator (Data-Driven, Heuristic-Free)
// =============================================================================

async function offlineDatabaseOrchestrator(content: string): Promise<string> {
  const tokens = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // If no substantive search keywords, treat as casual greeting
  if (tokens.length === 0) {
    return `Namaste! I am your AI Citizen Welfare Advisor, your official guide to Indian central and state government benefits.\n\nTell me your **State**, **Occupation**, or what assistance you need (scholarships, farmer subsidies, housing, pensions)!`;
  }

  // Workflow / How-To inquiries
  const isWorkflow = tokens.some((t) => ["apply", "eligibility", "process", "workflow"].includes(t));
  if (isWorkflow && !tokens.some((t) => ["farmer", "kisan", "scholarship", "housing", "pension"].includes(t))) {
    return `### How to Check Eligibility & Apply Online\n\nFollow this step-by-step guide to secure your welfare benefits:\n\n1. **Step 1: Calculate Match Score**: Open our [Instant Eligibility Evaluator](/check) and enter your age, state, occupation, and family income.\n2. **Step 2: Verify Vault Documents**: Upload required certificates to your [Citizen Vault](/vault) to calculate your document readiness percentage.\n3. **Step 3: Direct Portal Submission**: Browse the verified [Welfare Directory](/schemes) and click **"Apply on Official Portal"** for direct access to official government submission portals.`;
  }

  // Search real database via deterministic tool
  const searchKeyword = tokens.find((t) => !["document", "documents", "certificate", "proof", "eligible", "eligibility"].includes(t)) || tokens[0];
  const schemesRes = await executeSearchSchemes(searchKeyword);

  if (schemesRes.status === "error") {
    return `### Service Temporarily Degraded\n\nOur citizen welfare database is currently experiencing intermittent connectivity issues. We are unable to complete a real-time schemes lookup at this second.\n\n👉 **What you can do**:\n• Please retry your query in a few moments.\n• Visit our direct [Instant Eligibility Evaluator](/check) or [Citizen Vault](/vault).\n• Contact support if this condition persists.`;
  }

  const schemes = schemesRes.data;

  if (schemes.length > 0) {
    const isDocQuery = tokens.some((t) => ["document", "documents", "certificate", "proof", "chahiye"].includes(t));
    if (isDocQuery) {
      const docRes = await executeGetSchemeDocuments(schemes.map((s) => s.slug));
      if (docRes.status === "error") {
        return `### Service Temporarily Degraded\n\nUnable to fetch statutory document requirements due to an active database connection issue. Please retry in a few moments.`;
      }
      const docRecords = docRes.data;
      const targetScheme = schemes[0];
      const targetDocs = docRecords.find((d: any) => d.scheme_slug === targetScheme.slug)?.documents || [];
      
      if (targetDocs.length === 0) {
        return `### Documents for ${targetScheme.name}\n\nSpecific document requirements for **[${targetScheme.name}](/schemes/${targetScheme.slug})** have not yet been cataloged in our database.\n\n👉 Standard government verification typically requires identity proof (Aadhaar Card) and bank account details. Check your [Citizen Vault](/vault) or verify requirements directly on the official portal!`;
      }

      const docList = targetDocs.map((d: any, i: number) => `${i + 1}. **${d.document_name}**: ${d.description || "Verified statutory requirement"}`).join("\n");

      return `### Required Documents for ${targetScheme.name}\n\nTo apply or complete verification for **[${targetScheme.name}](/schemes/${targetScheme.slug})**, you need the following verified documents:\n\n${docList}\n\n👉 **Next Steps**:\n• Upload your documents to your [Citizen Vault](/vault) to calculate your application readiness score!\n• Evaluate your full match status using our [Eligibility Check Tool](/check).`;
    }

    // Eligibility check inquiry branch
    const isEligibilityQuery = tokens.some((t) => ["eligible", "eligibility", "qualify"].includes(t));
    if (isEligibilityQuery) {
      const targetScheme = schemes[0];
      const evalRes = await executeCheckEligibility({
        slug: targetScheme.slug,
        occupation: tokens.find((t) => ["farmer", "student", "artisan"].includes(t)),
        state: tokens.includes("mp") ? "Madhya Pradesh" : undefined,
      });

      if (evalRes.status === "error") {
        return `### Service Temporarily Degraded\n\nUnable to evaluate scheme eligibility rules due to a temporary service error. Please evaluate your full match status using our [Eligibility Check Tool](/check).`;
      }

      const evalResult = evalRes.data;
      const statusBadge = evalResult.status === "eligible" ? "✅ **100% Eligible**" : evalResult.status === "nearly_eligible" ? "⚠️ **Nearly Eligible**" : "❌ **Ineligible**";
      return `### Eligibility Evaluation: ${targetScheme.name}\n\nBased on official database criteria:\n\n• **Match Status**: ${statusBadge} (${evalResult.match_percentage}% match)\n• **Scheme Details**: [${targetScheme.name}](/schemes/${targetScheme.slug})\n• **Category**: ${targetScheme.category || "General Welfare"}\n\n👉 Run a full profile evaluation across all central and state benefits using our [Eligibility Evaluator](/check)!`;
    }

    const schemeItems = schemes
      .map(
        (s: any, idx: number) =>
          `${idx + 1}. **[${s.name}](/schemes/${s.slug})** (${s.category || "General Welfare"})\n   • **Benefit**: ${s.description ? s.description.slice(0, 140) + "..." : "Government welfare benefit"}`
      )
      .join("\n");

    const categoryTitle = schemes[0].category ? `${schemes[0].category} Schemes` : "Matching Welfare Schemes";
    const stateSubtitle = schemes[0].state && schemes[0].state !== "ALL_INDIA" ? ` in ${schemes[0].state}` : " across India";

    return `### Verified ${categoryTitle}${stateSubtitle}\n\nHere are the top programs matching your search:\n\n${schemeItems}\n\n👉 Check your full eligibility across all schemes using our [Eligibility Check Tool](/check)!`;
  }

  return `### No Matching Schemes Found\n\nI couldn't find any active government welfare schemes matching **"${content}"** in our database.\n\n👉 **Recommended next steps**:\n• Search by your **State** (e.g. *Madhya Pradesh*, *Maharashtra*) or **Category** (e.g. *Agriculture*, *Education*, *Pensions*).\n• Evaluate your full profile match using our [Instant Eligibility Evaluator](/check).\n• Browse all active government programs in our [Welfare Directory](/schemes).`;
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
