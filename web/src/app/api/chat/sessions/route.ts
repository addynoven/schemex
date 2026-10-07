import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/legacy-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const paramUserId = Number(new URL(request.url).searchParams.get("user_id"));
    const userId = user?.id || (paramUserId && paramUserId > 0 ? paramUserId : null);

    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const sessions = await query(
      `
      SELECT id, user_id, title, language_code, session_uid, created_at, updated_at
      FROM chat_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30
    `,
      [userId],
    );
    if (sessions.rows.length === 0) return NextResponse.json([]);

    const messagesRes = await query(
      `
      SELECT id, session_id, sender, content, citations, created_at
      FROM chat_messages WHERE session_id = ANY($1) ORDER BY created_at ASC
    `,
      [sessions.rows.map((session) => session.id)],
    );

    const grouped = new Map<number, any[]>();
    for (const message of messagesRes.rows) {
      const mapped = {
        id: message.id,
        session_id: message.session_id,
        role: message.sender || message.role || "assistant",
        sender: message.sender || message.role || "assistant",
        content: message.content,
        citations: message.citations || [],
        created_at: message.created_at,
      };
      const list = grouped.get(message.session_id) || [];
      list.push(mapped);
      grouped.set(message.session_id, list);
    }

    const enrichedSessions = sessions.rows.map((session) => {
      const msgs = grouped.get(session.id) || [];
      let displayTitle = session.title;

      // Auto-generate smart session title from first user query if default
      if (
        !displayTitle ||
        displayTitle === "New Welfare Consultation" ||
        displayTitle === "New Welfare Assistance" ||
        displayTitle.startsWith("New ")
      ) {
        const firstUserMsg = msgs.find(
          (m) => m.sender === "user" || m.role === "user",
        );
        if (firstUserMsg && firstUserMsg.content) {
          const snippet = firstUserMsg.content.trim().slice(0, 36);
          displayTitle =
            snippet + (firstUserMsg.content.trim().length > 36 ? "..." : "");
          // Async background DB row title backfill
          query(
            "UPDATE chat_sessions SET title = $1, updated_at = NOW() WHERE id = $2",
            [displayTitle, session.id],
          ).catch(() => {});
        }
      }

      return {
        ...session,
        title: displayTitle || "Welfare Consultation",
        messages: msgs,
        chat_messages: msgs,
      };
    });

    return NextResponse.json(enrichedSessions);
  } catch (error) {
    console.error("Failed to list chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to list chat sessions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const userId = user?.id || (Number(body.user_id) > 0 ? Number(body.user_id) : null);

    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const title = body.title || "New Welfare Assistance";
    const sessionUid = body.session_uid || `session_${Date.now()}`;
    const result = await query(
      `
      INSERT INTO chat_sessions (user_id, title, language_code, session_uid, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (session_uid) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()
      RETURNING id, user_id, title, language_code, session_uid, created_at, updated_at
    `,
      [userId, title, body.language_code || "en", sessionUid],
    );
    return NextResponse.json(
      { ...result.rows[0], messages: [] },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create chat session:", error);
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500 },
    );
  }
}
