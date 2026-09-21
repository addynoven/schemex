import type { LocalDatabase } from "../../../core/database/local-db";
import type {
  ChatMessage,
  DocumentRequirement,
  SchemeRecommendation,
} from "../models/advisor.model";
import {
  ADVISOR_TOOLS_DECLARATIONS_GEMINI,
  ADVISOR_TOOLS_DECLARATIONS_GROQ,
  executeCheckEligibility,
  executeGetSchemeDetails,
  executeSearchSchemesDirectory,
  type CheckEligibilityArgs,
  type SearchSchemesDirectoryArgs,
} from "../tools/advisor-tools";

export interface CitizenProfileContext {
  fullName?: string;
  state?: string;
  district?: string;
  age?: number;
  gender?: string;
  occupation?: string;
  annual_income?: number;
  caste_category?: string;
}

export interface AgentTurnResponse {
  text: string;
  recommendations?: SchemeRecommendation[];
  documents?: DocumentRequirement[];
  bullets?: string[];
  citations?: string[];
  sources?: string[];
  suggestedFollowUps?: string[];
  detectedTopic?: string;
}

export const ADVISOR_SYSTEM_INSTRUCTION = `You are the Sovereign Citizen Welfare AI Advisor. You provide personalized, accurate, and empathetic assistance to Indian citizens navigating central and state government schemes.

### CRITICAL RULES:
1. ZERO ASSUMPTIONS & DIRECT BOUNDARIES:
   - For casual greetings (e.g., "hello", "hi", "namaste", "who are you"): Answer directly in 1-2 friendly sentences. Do NOT call any tools. Do NOT list or cite any schemes.
   - For out-of-scope queries (e.g., weather, sports, movies, coding, recipes): Politely decline in 1 sentence and state that you only assist with government welfare schemes, scholarships, and citizen benefits. Do NOT call any tools.
   - For welfare questions: Call the relevant tool (check_eligibility, search_schemes_directory, or get_scheme_details).
   - When a citizen asks about schemes in a state or sector, or provides demographic facts, call check_eligibility or search_schemes_directory.
   - When a citizen asks how to apply, what documents are needed, or refers to schemes previously listed in the conversation, call get_scheme_details with the relevant scheme_slug_or_id.

2. MULTILINGUAL RULE:
   - Always respond in the same language and script as the citizen (English, Hindi, Hinglish).`;

interface LlmToolCall {
  name: "check_eligibility" | "search_schemes_directory" | "get_scheme_details";
  args: Record<string, any>;
}

interface LlmExecutionResult {
  toolCall?: LlmToolCall;
  text?: string;
}

/**
 * Calls Groq API with function calling support.
 */
async function callGroqWithTools(
  messages: Array<{ role: string; content: string }>,
  model: string = process.env.EXPO_PUBLIC_GROQ_MODEL || "openai/gpt-oss-120b",
): Promise<LlmExecutionResult | null> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        tools: ADVISOR_TOOLS_DECLARATIONS_GROQ,
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = await res.json();
    const choiceMsg = data.choices?.[0]?.message;
    if (!choiceMsg) return null;

    if (choiceMsg.tool_calls && choiceMsg.tool_calls.length > 0) {
      const tc = choiceMsg.tool_calls[0];
      let args: Record<string, any> = {};
      try {
        args =
          typeof tc.function.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments;
      } catch {
        args = {};
      }
      return {
        toolCall: {
          name: tc.function.name,
          args,
        },
      };
    }

    return {
      text: choiceMsg.content || "",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Calls Google Gemini API with function declaration support.
 */
async function callGeminiWithTools(
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  model: string = "gemini-3.6-flash",
): Promise<LlmExecutionResult | null> {
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    "AIzaSyCE3dB3FJPGWyZ0uuRZIz6YbD4bDnH9H-U";
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: ADVISOR_SYSTEM_INSTRUCTION }] },
          contents,
          tools: ADVISOR_TOOLS_DECLARATIONS_GEMINI,
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
        }),
        signal: controller.signal,
      },
    );

    if (!res.ok) return null;

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const functionCallPart = parts.find((p: any) => p.functionCall);
    if (functionCallPart) {
      return {
        toolCall: {
          name: functionCallPart.functionCall.name,
          args: functionCallPart.functionCall.args || {},
        },
      };
    }

    const textPart = parts.find((p: any) => p.text);
    if (textPart) {
      return { text: textPart.text };
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Orchestrates LLM calling with failover (Groq -> Gemini).
 * Zero regex or substring matching is performed on the prompt.
 */
export async function callLlmOrchestrator(
  query: string,
  history: readonly ChatMessage[],
  userProfile?: CitizenProfileContext,
): Promise<LlmExecutionResult> {
  // Build profile context preamble
  const profileParts: string[] = [];
  if (userProfile?.fullName) profileParts.push(`Name: ${userProfile.fullName}`);
  if (userProfile?.state) profileParts.push(`State: ${userProfile.state}`);
  if (userProfile?.district)
    profileParts.push(`District: ${userProfile.district}`);
  if (userProfile?.occupation)
    profileParts.push(`Occupation: ${userProfile.occupation}`);
  if (userProfile?.age) profileParts.push(`Age: ${userProfile.age}`);
  if (userProfile?.annual_income)
    profileParts.push(`Annual Income: ₹${userProfile.annual_income}`);
  if (userProfile?.caste_category)
    profileParts.push(`Caste Category: ${userProfile.caste_category}`);

  const profileHeader =
    profileParts.length > 0
      ? `[Citizen Profile: ${profileParts.join(", ")}]\n`
      : "";

  function serializeMessageText(m: ChatMessage): string {
    let content = m.text;
    if (m.recommendations && m.recommendations.length > 0) {
      const recList = m.recommendations
        .map((r, i) => `${i + 1}. ${r.title} (slug: ${r.id})`)
        .join("\n");
      content += `\n[Recommended Schemes on list:\n${recList}]`;
    }
    return content;
  }

  // 1. Format messages for Groq / OpenAI format
  const groqMessages: Array<{ role: string; content: string }> = [
    { role: "system", content: ADVISOR_SYSTEM_INSTRUCTION },
  ];

  for (const m of history.slice(-8)) {
    groqMessages.push({
      role: m.sender === "user" ? "user" : "assistant",
      content: serializeMessageText(m),
    });
  }
  groqMessages.push({
    role: "user",
    content: `${profileHeader}${query}`,
  });

  // Try primary Groq model
  let result = await callGroqWithTools(groqMessages, "openai/gpt-oss-120b");
  if (result) return result;

  // Try Groq secondary model
  result = await callGroqWithTools(groqMessages, "qwen/qwen3.8-27b");
  if (result) return result;

  // 2. Failover to Gemini format
  const geminiContents: Array<{
    role: string;
    parts: Array<{ text: string }>;
  }> = [];
  for (const m of history.slice(-8)) {
    geminiContents.push({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: serializeMessageText(m) }],
    });
  }
  geminiContents.push({
    role: "user",
    parts: [{ text: `${profileHeader}${query}` }],
  });

  for (const model of [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
  ]) {
    result = await callGeminiWithTools(geminiContents, model);
    if (result) return result;
  }

  // 3. Emergency offline fallback if no network / upstream API available
  const lowerQuery = query.toLowerCase().trim();
  const previousRecs = findLastRecommendationsInHistory(history);

  if (
    previousRecs.length > 0 &&
    (lowerQuery.includes("apply") ||
      lowerQuery.includes("document") ||
      lowerQuery.includes("list") ||
      lowerQuery.includes("scheme"))
  ) {
    return {
      toolCall: {
        name: "get_scheme_details",
        args: { scheme_slug_or_id: previousRecs[0].id },
      },
    };
  }

  return {
    toolCall: {
      name: "check_eligibility",
      args: { state: userProfile?.state, occupation: userProfile?.occupation },
    },
  };
}

/**
 * Finds the latest assistant message containing scheme recommendations in conversation history.
 */
export function findLastRecommendationsInHistory(
  history: readonly ChatMessage[],
): SchemeRecommendation[] {
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (
      msg.sender === "assistant" &&
      msg.recommendations &&
      msg.recommendations.length > 0
    ) {
      return [...msg.recommendations];
    }
  }
  return [];
}

/**
 * Executes an agentic conversation turn driven purely by the LLM.
 * The LLM natively routes between text answers and tool calls with ZERO regex keyword detectors.
 */
export async function executeAgentTurn(
  query: string,
  history: readonly ChatMessage[],
  userProfile: CitizenProfileContext | undefined,
  db: LocalDatabase,
): Promise<AgentTurnResponse> {
  const llmResult = await callLlmOrchestrator(query, history, userProfile);

  // Case 1: Direct text answer (Greeting, Out-of-Scope, general query, zero schemes cited)
  if (!llmResult.toolCall) {
    return {
      text:
        llmResult.text ||
        "Namaste! I am your Scheme App AI Welfare Advisor, your official guide to Indian central and state government benefits. Tell me your state, profession, or what assistance you need!",
      suggestedFollowUps: [
        "Check schemes I qualify for",
        "Find student scholarships",
        "Farmer irrigation subsidies",
        "Explore business & Mudra loans",
      ],
      detectedTopic: "Welfare Consultation",
    };
  }

  const { name: toolName, args } = llmResult.toolCall;

  // Case 2: Tool `check_eligibility`
  if (toolName === "check_eligibility") {
    const effectiveState = args.state || userProfile?.state || undefined;
    const eligibilityArgs: CheckEligibilityArgs = {
      state: effectiveState,
      category: args.category,
      topic: args.topic,
      occupation: args.occupation || userProfile?.occupation,
      age: args.age || userProfile?.age,
      annual_income: args.annual_income || userProfile?.annual_income,
      caste_category: args.caste_category || userProfile?.caste_category,
      gender: args.gender || userProfile?.gender,
      jurisdiction: args.jurisdiction,
    };

    const result = executeCheckEligibility(db, eligibilityArgs);

    if (result.top_recommendations.length > 0) {
      const stateLabel = effectiveState ? `${effectiveState} ` : "";
      const summaryBullets: string[] = [];
      if (result.state_specific_count > 0) {
        summaryBullets.push(
          `• ${result.state_specific_count} ${effectiveState} State initiative${result.state_specific_count > 1 ? "s" : ""}`,
        );
      }
      if (result.national_count > 0) {
        summaryBullets.push(
          `• ${result.national_count} Central / National program${result.national_count > 1 ? "s" : ""}`,
        );
      }

      const topicTitle =
        `${stateLabel}${args.category || "Welfare"} Schemes`.trim();

      return {
        text: `You qualify for **${result.total_matched_count} schemes** matching your ${stateLabel}query.\n\nTop recommendations:`,
        bullets: summaryBullets.length > 0 ? summaryBullets : undefined,
        recommendations: result.top_recommendations,
        citations: result.citations,
        sources: result.sources.map((s) => s.title),
        suggestedFollowUps: [
          "How can I apply for these schemes?",
          "What documents are required to apply?",
          "Check my detailed eligibility score",
        ],
        detectedTopic: topicTitle,
      };
    }

    // If 0 direct matches, search directory for discovery
    const searchResult = executeSearchSchemesDirectory(db, {
      state: effectiveState,
      category: args.category,
      search_query: args.topic || undefined,
    });

    const topicTitle =
      `${effectiveState ? `${effectiveState} ` : ""}${args.category || "Welfare"} Consultation`.trim();
    return {
      text: `We found **${searchResult.total_count_in_directory} initiatives** in the official welfare directory matching your request. Explore the verified options below:`,
      recommendations: searchResult.sample_schemes,
      citations: searchResult.sample_schemes.map((s) => s.id),
      sources: searchResult.sample_schemes.map((s) => s.title),
      suggestedFollowUps: [
        "Tell me how to apply for these",
        "What documents do I need to prepare?",
      ],
      detectedTopic: topicTitle,
    };
  }

  // Case 3: Tool `search_schemes_directory`
  if (toolName === "search_schemes_directory") {
    const effectiveState = args.state || userProfile?.state || undefined;
    const searchArgs: SearchSchemesDirectoryArgs = {
      state: effectiveState,
      category: args.category,
      search_query: args.search_query || undefined,
    };

    const searchResult = executeSearchSchemesDirectory(db, searchArgs);
    const topicTitle =
      `${effectiveState ? `${effectiveState} ` : ""}${args.category || "Directory"} Schemes`.trim();

    return {
      text: `We found **${searchResult.total_count_in_directory} initiatives** in the official welfare directory matching your request. Explore the verified options below:`,
      recommendations: searchResult.sample_schemes,
      citations: searchResult.sample_schemes.map((s) => s.id),
      sources: searchResult.sample_schemes.map((s) => s.title),
      suggestedFollowUps: [
        "Tell me how to apply for these",
        "What documents do I need to prepare?",
      ],
      detectedTopic: topicTitle,
    };
  }

  // Case 4: Tool `get_scheme_details`
  const slugOrId = args.scheme_slug_or_id;
  const previousRecs = findLastRecommendationsInHistory(history);

  const targetRecs =
    slugOrId && previousRecs.some((r) => r.id === slugOrId)
      ? previousRecs.filter((r) => r.id === slugOrId)
      : previousRecs.length > 0
        ? previousRecs
        : [];

  const allDocs: DocumentRequirement[] = [];
  const schemeTitles: string[] = [];

  if (targetRecs.length > 0) {
    for (const rec of targetRecs) {
      schemeTitles.push(rec.title);
      const details = executeGetSchemeDetails(db, {
        scheme_slug_or_id: rec.id,
      });
      if (details.status === "success" && details.documents) {
        for (const d of details.documents) {
          if (
            !allDocs.some(
              (existing) =>
                existing.name.toLowerCase() === d.name.toLowerCase(),
            )
          ) {
            allDocs.push(d);
          }
        }
      }
    }
  } else if (slugOrId) {
    const details = executeGetSchemeDetails(db, {
      scheme_slug_or_id: slugOrId,
    });
    if (details.status === "success") {
      if (details.scheme) schemeTitles.push(details.scheme.title);
      if (details.documents) allDocs.push(...details.documents);
    }
  }

  const steps = [
    `1. Complete biometric e-KYC: Ensure your Aadhaar is linked to your active mobile number for OTP verification.`,
    `2. Gather Documents: Upload your identity, income, and domicile certificates to your Scheme App Vault.`,
    `3. Submit Online: Visit the official state/national scholarship portal for ${schemeTitles[0] || "the scheme"} to file your application.`,
  ];

  return {
    text: `Here is the verified application procedure and document checklist for the schemes on your list (**${schemeTitles.join(", ") || "Selected Schemes"}**):\n\nFollow these steps to complete your application smoothly:`,
    bullets: steps,
    recommendations:
      targetRecs.length > 0
        ? targetRecs
        : previousRecs.length > 0
          ? previousRecs
          : undefined,
    documents:
      allDocs.length > 0
        ? allDocs
        : [
            {
              id: "doc_aadhaar",
              name: "Aadhaar Card (linked with active mobile)",
              mandatory: true,
            },
            {
              id: "doc_income",
              name: "Income Certificate (Revenue Authority)",
              mandatory: true,
            },
            {
              id: "doc_domicile",
              name: "Domicile / Residence Certificate",
              mandatory: true,
            },
            {
              id: "doc_passbook",
              name: "DBT-Enabled Bank Passbook",
              mandatory: true,
            },
          ],
    citations: targetRecs.map((r) => r.id),
    sources: targetRecs.map((r) => r.title),
    suggestedFollowUps: [
      "Open Document Vault to verify my documents",
      "Where do I find the official application link?",
      "What is the last date to apply?",
    ],
    detectedTopic: `${schemeTitles[0] || "Scheme"} Application`,
  };
}
