import { query } from "@/lib/db";

const SYSTEM_INSTRUCTION = `You are the Sovereign Citizen Welfare AI Advisor. Provide personalized, accurate, and empathetic assistance to Indian citizens navigating central and state government schemes. Always respond in the same language as the citizen (English, Hindi, Hinglish). Use clear markdown lists and highlight scheme names in bold. When recommending schemes, include direct Markdown links in the format [Scheme Name](/schemes/scheme-slug).`;

export async function generateAssistantReply(content: string): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  // =========================================================================
  // 1. PRIMARY LLM: Groq API (openai/gpt-oss-120b / qwen/qwen3.8-27b)
  // =========================================================================
  if (groqApiKey && groqApiKey.startsWith("gsk_")) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content },
          ],
          temperature: 0.1,
          max_tokens: 1024,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim()) {
          console.log(`✅ [Groq LLM] Generated reply using model ${groqModel}`);
          return text;
        }
      } else {
        console.warn(`⚠️ [Groq LLM] API returned status ${res.status}, failing over to Gemini...`);
      }
    } catch (err: any) {
      console.warn("⚠️ [Groq LLM] Call failed or timed out, failing over to Gemini:", err.message || err);
    }
  }

  // =========================================================================
  // 2. SECONDARY FAILOVER LLM: Google Gemini API
  // =========================================================================
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  if (geminiApiKey && geminiApiKey.startsWith("AIzaSy")) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: [{ role: "user", parts: [{ text: content }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
          }),
        },
      );

      if (response.ok) {
        const data = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = data.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
        if (text && text.trim()) {
          console.log(`✅ [Gemini LLM] Generated reply using model ${geminiModel}`);
          return text;
        }
      }
    } catch (err) {
      console.warn("⚠️ [Gemini LLM] Call failed, failing over to local PostgreSQL orchestrator:", err);
    }
  }

  // =========================================================================
  // 3. TERTIARY OFFLINE FAILOVER: PostgreSQL Welfare Directory Search
  // =========================================================================
  const lower = content.toLowerCase().trim();

  // A. Casual Greetings & Out-of-Scope
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

  // B. Document & Application Procedure Inquiries
  if (
    lower.includes("document") ||
    lower.includes("kya chahiye") ||
    lower.includes("certificate") ||
    lower.includes("proof") ||
    lower.includes("kagaj")
  ) {
    if (lower.includes("kisan") || lower.includes("farmer") || lower.includes("samman nidhi")) {
      return `### Required Documents for PM-Kisan Samman Nidhi (PM-KISAN)

To apply or complete e-KYC for PM-Kisan Samman Nidhi, you need the following verified documents:

1. **Aadhaar Card**: Linked with an active mobile number for UIDAI e-KYC OTP verification.
2. **Land Record (Khasra / Khatauni)**: Verified land ownership document proving cultivable agricultural land.
3. **Bank Passbook**: Active bank account linked with Aadhaar for Direct Benefit Transfer (DBT).
4. **Citizenship & Domicile Proof**: Resident proof of the beneficiary state.

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

  // D. Search Local PostgreSQL Database for Specific Matching Schemes
  try {
    if (process.env.DATABASE_URL) {
      const searchTerms = lower
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !["what", "schemes", "available", "for", "in", "the", "and", "tell", "about"].includes(w));

      let dbSchemes: any[] = [];
      if (searchTerms.length > 0) {
        const dbRes = await query(
          `SELECT id, name, slug, ministry, state, category, description
           FROM schemes
           WHERE name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1 OR state ILIKE $1
           ORDER BY id ASC
           LIMIT 3`,
          [`%${searchTerms[0]}%`]
        );
        dbSchemes = dbRes.rows;
      }

      if (dbSchemes.length > 0) {
        const schemeList = dbSchemes
          .map(
            (s, idx) =>
              `### ${idx + 1}. [${s.name}](/schemes/${s.slug})
• **Jurisdiction**: ${s.state === "ALL_INDIA" ? "National (Central Government)" : `${s.state} State`}
• **Category**: ${s.category || "General Welfare"}
• **Overview**: ${s.description ? s.description.slice(0, 160) + "..." : "Official welfare scheme initiative."}`
          )
          .join("\n\n");

        return `### Verified Welfare Schemes Matching Your Query

We found **${dbSchemes.length} matching Agriculture & Welfare initiatives** in the official directory:

${schemeList}

👉 Check your 100% personalized eligibility score across all 4,148 schemes using our [Eligibility Check Tool](/check)!`;
      }
    }
  } catch (err) {
    console.warn("Local DB scheme lookup skipped:", err);
  }

  // E. Fallback Welfare Guidance (When querying Agriculture / Farmers)
  if (lower.includes("farmer") || lower.includes("kisan") || lower.includes("agriculture") || lower.includes("madhya pradesh") || lower.includes("mp")) {
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
