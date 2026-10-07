import { NextRequest, NextResponse } from "next/server";
import {
  createAccessToken,
  getToken,
  getUserIdFromToken,
} from "@/lib/legacy-auth";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const token =
      getToken(request) ||
      (await request.json().catch(() => ({}))).refresh_token;
    const userId = token ? getUserIdFromToken(token) : null;
    if (!userId)
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const result = await query<{ role: string }>(
      "SELECT role FROM users WHERE id = $1",
      [userId],
    );
    if (result.rowCount === 0)
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const accessToken = createAccessToken(userId, result.rows[0].role);
    return NextResponse.json({
      access_token: accessToken,
      refresh_token: accessToken,
      token_type: "bearer",
    });
  } catch (error) {
    console.error("Failed to refresh auth token:", error);
    return NextResponse.json(
      { error: "Failed to refresh auth token" },
      { status: 500 },
    );
  }
}
