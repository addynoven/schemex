import { NextRequest, NextResponse } from "next/server";
import { generateAssistantReply, saveChatMessage } from "@/lib/chat-server";
import { query } from "@/lib/db";

async function resolveSession(rawParam: string) {
  const isNumeric = /^\d+$/.test(rawParam);
  let sessionRes;
  if (isNumeric) {
    sessionRes = await query(
      "SELECT id, user_id, title, session_uid FROM chat_sessions WHERE id = $1 OR session_uid = $2",
      [Number(rawParam), rawParam]
    );
  } else {
    sessionRes = await query(
      "SELECT id, user_id, title, session_uid FROM chat_sessions WHERE session_uid = $1",
      [rawParam]
    );
  }
  return sessionRes.rows[0] || null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const rawParam = (await context.params).sessionId;
    const { content } = await request.json();

    if (!rawParam || !String(content || "").trim()) {
      return NextResponse.json(
        { error: "sessionId and content are required" },
        { status: 400 },
      );
    }

    let session = await resolveSession(rawParam);

    // If session doesn't exist yet, auto-provision it
    if (!session) {
      const createRes = await query(
        `INSERT INTO chat_sessions (user_id, title, language_code, session_uid, created_at, updated_at)
         VALUES (1, 'New Welfare Consultation', 'en', $1, NOW(), NOW())
         ON CONFLICT (session_uid) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()
         RETURNING id, user_id, title, session_uid`,
        [rawParam]
      );
      session = createRes.rows[0];
    }

    const cleanContent = String(content).trim();

    // Auto-update default title to first user query snippet
    if (
      !session.title ||
      session.title === "New Welfare Consultation" ||
      session.title === "New Welfare Assistance" ||
      session.title.startsWith("New ")
    ) {
      const smartTitle =
        cleanContent.slice(0, 36) + (cleanContent.length > 36 ? "..." : "");
      await query(
        "UPDATE chat_sessions SET title = $1, updated_at = NOW() WHERE id = $2",
        [smartTitle, session.id],
      );
    }

    await saveChatMessage(session.id, "user", cleanContent);
    const reply = await generateAssistantReply(cleanContent);
    const assistant = await saveChatMessage(session.id, "assistant", reply);

    return NextResponse.json({
      id: assistant.id,
      role: "assistant",
      content: assistant.content,
      citations: assistant.citations || [],
      created_at: assistant.created_at,
    });
  } catch (error) {
    console.error("Failed to send chat message:", error);
    return NextResponse.json(
      { error: "Failed to send chat message" },
      { status: 500 },
    );
  }
}
