import { getAdminToken, getCitizenToken } from "@/lib/session";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000/api";

export function getAuthHeaders(
  role: "citizen" | "admin" = "citizen",
): Record<string, string> {
  const token = role === "admin" ? getAdminToken() : getCitizenToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}
