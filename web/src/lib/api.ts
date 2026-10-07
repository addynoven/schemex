import { getAdminToken, getCitizenToken, getCitizenUser } from "./session";

export interface Benefit {
  id: number;
  title?: string;
  benefit_type?: string;
  description: string;
  amount?: number | null;
}

export interface EligibilityRule {
  id: number;
  field_name?: string;
  field?: string;
  operator: string;
  rule_value?: string;
  value?: string;
  description?: string | null;
}

export interface RequiredDocument {
  id: number;
  document_name: string;
  is_mandatory: boolean;
  description?: string | null;
}

export interface OfficialSource {
  id: number;
  title?: string;
  source_name?: string;
  url?: string;
  source_url?: string;
  source_type?: string;
}

export interface Scheme {
  id: number;
  name: string;
  slug: string;
  state?: string;
  category: string;
  tags?: string | null;
  ministry: string;
  description: string;
  status: string;
  application_url?: string | null;
  official_website?: string | null;
  launch_date?: string | null;
  created_at?: string;
  updated_at?: string;
  benefits: Benefit[];
  eligibility_rules: EligibilityRule[];
  required_documents: RequiredDocument[];
  official_sources: OfficialSource[];
}

export interface CriterionVerdict {
  field: string;
  criterion_title: string;
  status: "passed" | "failed" | "missing_info";
  your_value: any;
  required_condition: string;
  reason: string;
}

export interface SchemeExplanation {
  scheme_id: number;
  scheme_name: string;
  scheme_slug: string;
  state?: string;
  ministry: string;
  description: string;
  status: "eligible" | "nearly_eligible" | "ineligible";
  is_eligible: boolean;
  match_percentage: number;
  criteria_passed: number;
  criteria_total: number;
  summary_reason: string;
  passed_criteria: CriterionVerdict[];
  failed_criteria: CriterionVerdict[];
  benefits_summary: string[];
  application_url?: string | null;
}

export interface EligibilityReport {
  total_evaluated: number;
  eligible_count: number;
  nearly_eligible_count: number;
  ineligible_count: number;
  eligible_schemes: SchemeExplanation[];
  nearly_eligible_schemes: SchemeExplanation[];
  ineligible_schemes: SchemeExplanation[];
}

export interface EligibilityCheckPayload {
  age?: number;
  date_of_birth?: string;
  gender?: string;
  state?: string;
  district?: string;
  annual_income?: number;
  occupation?: string;
  caste_category?: string;
  is_differently_abled?: boolean;
  marital_status?: string;
  residence_area?: string;
  has_land?: boolean;
}

export interface UserDocument {
  id: number;
  user_id: number;
  household_member_id?: number | null;
  citizen_uid?: string | null;
  document_type: string;
  document_number_masked?: string | null;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  is_verified: boolean;
  download_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentReadinessItem {
  document_name: string;
  description?: string | null;
  is_mandatory: boolean;
  status: "available" | "missing";
  matched_vault_document_id?: number | null;
  matched_vault_document_name?: string | null;
}

export interface SchemeDocumentReadiness {
  scheme_id: number;
  scheme_name: string;
  scheme_slug: string;
  is_ready_to_apply: boolean;
  readiness_percentage: number;
  mandatory_total: number;
  mandatory_available: number;
  optional_total: number;
  optional_available: number;
  checklist: DocumentReadinessItem[];
  summary: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

const API_BASE = "/api";

function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function getCitizenAuthHeaders(): Record<string, string> {
  const token = getCitizenToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ============================================================================
// CITIZEN PUBLIC & ELIGIBILITY APIS
// ============================================================================

export async function fetchPopularSchemes(
  limit = 8,
  state?: string,
): Promise<Scheme[]> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("status", "active");
  if (state && state !== "ALL_INDIA" && state !== "All") {
    params.set("state", state);
  }
  const res = await fetch(`${API_BASE}/schemes?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load popular schemes");
  const data = await res.json();
  return data.items || [];
}

export async function searchSchemesPaginated(
  q?: string,
  category?: string,
  state?: string,
  skip = 0,
  limit = 24,
): Promise<PaginatedResult<Scheme>> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category && category !== "All") params.set("category", category);
  if (state && state !== "ALL_INDIA" && state !== "All")
    params.set("state", state);
  params.set("status", "active");
  params.set("skip", String(skip));
  params.set("limit", String(limit));

  const res = await fetch(`${API_BASE}/schemes/search?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to search schemes");
  return res.json();
}

export async function searchSchemes(
  q?: string,
  category?: string,
  state?: string,
): Promise<Scheme[]> {
  const data = await searchSchemesPaginated(q, category, state, 0, 24);
  return data.items || [];
}

export async function listSchemesPaginated(params?: {
  skip?: number;
  limit?: number;
  category?: string;
  state?: string;
  ministry?: string;
  search?: string;
  sort_by?: string;
}): Promise<PaginatedResult<Scheme>> {
  const query = new URLSearchParams();
  if (params?.skip !== undefined) query.set("skip", String(params.skip));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.category && params.category !== "All")
    query.set("category", params.category);
  if (params?.state && params.state !== "ALL_INDIA" && params.state !== "All")
    query.set("state", params.state);
  if (params?.ministry && params.ministry !== "All")
    query.set("ministry", params.ministry);
  if (params?.search) {
    query.set("search", params.search);
    query.set("q", params.search);
  }
  if (params?.sort_by) query.set("sort_by", params.sort_by);
  query.set("status", "active");

  const res = await fetch(`${API_BASE}/schemes?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to load schemes");
  return res.json();
}

export async function getSchemeCategories(): Promise<
  Array<{ category: string; count: number }>
> {
  const res = await fetch(`${API_BASE}/schemes/categories`);
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export async function getSchemeBySlug(slug: string): Promise<Scheme> {
  const res = await fetch(`${API_BASE}/schemes/slug/${slug}`);
  if (!res.ok) throw new Error("Scheme not found");
  return res.json();
}

export async function checkEligibility(
  payload: EligibilityCheckPayload,
): Promise<EligibilityReport> {
  const res = await fetch(`${API_BASE}/eligibility/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Eligibility check failed");
  return res.json();
}

// ============================================================================
// CITIZEN AUTH APIS
// ============================================================================

export async function citizenRegister(payload: {
  email: string;
  phone: string;
  password: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Registration failed");
  }
  return res.json();
}

export async function citizenLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Invalid credentials");
  }
  return res.json();
}

export async function citizenGetMe() {
  const headers = getCitizenAuthHeaders();
  headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE}/auth/me`, { headers });
  if (!res.ok) throw new Error("Failed to load user profile");
  return res.json();
}

export async function updateCitizenProfile(payload: {
  full_name: string;
  date_of_birth: string;
  gender: string;
  state: string;
  district: string;
  annual_income: number;
  occupation: string;
  caste_category?: string;
  is_differently_abled?: boolean;
  marital_status?: string;
  residence_area?: string;
  has_land?: boolean;
}) {
  const headers = getCitizenAuthHeaders();
  headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE}/users/me/profile`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update citizen profile");
  }
  return res.json();
}

// ============================================================================
// DOCUMENT VAULT & READINESS APIS
// ============================================================================

export async function uploadVaultDocument(
  file: File,
  documentType: string,
  maskedNumber?: string,
  householdMemberId?: number | null,
): Promise<UserDocument> {
  const userId = getCitizenUser()?.id;
  if (!userId) throw new Error("UNAUTHORIZED");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", String(userId));
  formData.append("document_type", documentType);
  if (maskedNumber) {
    formData.append("document_number_masked", maskedNumber);
  }
  if (householdMemberId) {
    formData.append("household_member_id", String(householdMemberId));
  }

  const headers = getCitizenAuthHeaders();
  const res = await fetch(`${API_BASE}/vault/documents/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to upload document");
  }
  return res.json();
}

export async function listVaultDocuments(
  householdMemberId?: number | null,
): Promise<UserDocument[]> {
  const headers = getCitizenAuthHeaders();
  headers["Content-Type"] = "application/json";
  const userId = getCitizenUser()?.id;
  if (!userId) throw new Error("UNAUTHORIZED");
  const params = new URLSearchParams({ user_id: String(userId) });
  if (householdMemberId)
    params.set("household_member_id", String(householdMemberId));
  const url = `${API_BASE}/vault/documents?${params.toString()}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    throw new Error("Failed to list vault documents");
  }
  return res.json();
}

export async function deleteVaultDocument(id: number): Promise<void> {
  const userId = getCitizenUser()?.id;
  if (!userId) throw new Error("UNAUTHORIZED");
  const headers = getCitizenAuthHeaders();
  headers["Content-Type"] = "application/json";
  const res = await fetch(
    `${API_BASE}/vault/documents/${id}?user_id=${encodeURIComponent(String(userId))}`,
    {
      method: "DELETE",
      headers,
    },
  );
  if (!res.ok) throw new Error("Failed to delete document");
}

export async function getSchemeDocumentReadiness(
  schemeId: number,
): Promise<SchemeDocumentReadiness> {
  const userId = getCitizenUser()?.id;
  if (!userId) throw new Error("UNAUTHORIZED");
  const headers = getCitizenAuthHeaders();
  headers["Content-Type"] = "application/json";
  const res = await fetch(
    `${API_BASE}/vault/readiness/schemes/${schemeId}?user_id=${encodeURIComponent(String(userId))}`,
    { headers },
  );
  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    throw new Error("Failed to evaluate scheme readiness");
  }
  return res.json();
}

// ============================================================================
// ADMIN APIS
// ============================================================================

export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Invalid admin credentials");
  }
  return res.json();
}

export async function adminGetMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAdminAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to verify admin session");
  return res.json();
}

export async function adminListSchemes(params?: {
  skip?: number;
  limit?: number;
  state?: string;
  category?: string;
  status?: string;
  search?: string;
}): Promise<PaginatedResult<Scheme>> {
  const q = new URLSearchParams();
  if (params?.skip !== undefined) q.set("skip", String(params.skip));
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.state && params.state !== "All") q.set("state", params.state);
  if (params?.category && params.category !== "All")
    q.set("category", params.category);
  if (params?.status && params.status !== "All") q.set("status", params.status);
  if (params?.search) q.set("search", params.search);

  const res = await fetch(`${API_BASE}/admin/schemes?${q.toString()}`, {
    headers: getAdminAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error("Failed to load schemes");
  }
  return res.json();
}

export async function adminCreateScheme(payload: any): Promise<Scheme> {
  const res = await fetch(`${API_BASE}/admin/schemes`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create scheme");
  }
  return res.json();
}

export async function adminUpdateScheme(
  id: number,
  payload: any,
): Promise<Scheme> {
  const res = await fetch(`${API_BASE}/admin/schemes/${id}`, {
    method: "PATCH",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update scheme");
  }
  return res.json();
}

export async function adminDeleteScheme(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/schemes/${id}`, {
    method: "DELETE",
    headers: getAdminAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete scheme");
}

// ============================================================================
// V2.8 CONVERSATIONAL CITIZEN CHAT APIS
// ============================================================================

export interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  citations: string[];
  created_at: string;
}

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at?: string;
  messages: ChatMessage[];
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const res = await fetch(`${API_BASE}/chat/sessions`, {
    headers: getCitizenAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to list chat sessions");
  return res.json();
}

export async function createChatSession(
  title: string = "New Welfare Assistance",
): Promise<ChatSession> {
  const res = await fetch(`${API_BASE}/chat/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getCitizenAuthHeaders(),
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create chat session");
  return res.json();
}

export async function getChatSession(sessionId: number | string): Promise<ChatSession> {
  const cleanId = encodeURIComponent(String(sessionId));
  const res = await fetch(`${API_BASE}/chat/sessions/${cleanId}`, {
    headers: getCitizenAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load chat session");
  return res.json();
}

export async function updateChatSessionTitle(
  sessionId: number | string,
  title: string,
): Promise<ChatSession> {
  const cleanId = encodeURIComponent(String(sessionId));
  const res = await fetch(`${API_BASE}/chat/sessions/${cleanId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getCitizenAuthHeaders(),
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update chat session title");
  return res.json();
}

export async function deleteChatSession(sessionId: number | string): Promise<void> {
  const cleanId = encodeURIComponent(String(sessionId));
  const res = await fetch(`${API_BASE}/chat/sessions/${cleanId}`, {
    method: "DELETE",
    headers: getCitizenAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete chat session");
}

export async function sendChatMessage(
  sessionId: number | string,
  content: string,
): Promise<ChatMessage> {
  const cleanId = encodeURIComponent(String(sessionId));
  const res = await fetch(`${API_BASE}/chat/sessions/${cleanId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getCitizenAuthHeaders(),
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to send message");
  }
  return res.json();
}

export async function streamChatMessage(
  sessionId: number | string,
  content: string,
  onToken: (token: string, citations?: string[]) => void,
  onDone: (messageId: number) => void,
  onError: (err: Error) => void,
): Promise<void> {
  try {
    const cleanId = encodeURIComponent(String(sessionId));
    const res = await fetch(
      `${API_BASE}/chat/sessions/${cleanId}/messages/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getCitizenAuthHeaders(),
        },
        body: JSON.stringify({ content }),
      },
    );

    if (!res.ok || !res.body) {
      throw new Error(`SSE streaming failed with status ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === "token") {
              onToken(data.token, data.citations);
            } else if (data.type === "done") {
              onDone(data.message_id);
            } else if (data.type === "error") {
              onError(new Error(data.message || "Streaming error"));
            }
          } catch (e) {
            console.error("SSE JSON parse error:", e);
          }
        }
      }
    }
  } catch (err: any) {
    onError(err);
  }
}

// ============================================================================
// SAVED SCHEMES APIS
// ============================================================================

export interface SavedSchemeItem {
  id: number;
  user_id: number;
  scheme_slug: string;
  created_at: string;
}

export async function listSavedSchemes(userId: number): Promise<SavedSchemeItem[]> {
  const res = await fetch(`${API_BASE}/user_saved_schemes?user_id=eq.${userId}`, {
    headers: getCitizenAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch saved schemes");
  return res.json();
}

export async function saveScheme(userId: number, schemeSlug: string): Promise<SavedSchemeItem> {
  const res = await fetch(`${API_BASE}/user_saved_schemes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getCitizenAuthHeaders(),
    },
    body: JSON.stringify({ user_id: userId, scheme_slug: schemeSlug }),
  });
  if (!res.ok) throw new Error("Failed to save scheme");
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function deleteSavedScheme(userId: number, schemeSlug: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/user_saved_schemes?user_id=eq.${userId}&scheme_slug=eq.${encodeURIComponent(schemeSlug)}`,
    {
      method: "DELETE",
      headers: getCitizenAuthHeaders(),
    }
  );
  if (!res.ok) throw new Error("Failed to unsave scheme");
}

