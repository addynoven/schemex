import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

async function resolveSession(rawParam: string) {
  const isNumeric = /^\d+$/.test(rawParam);
  let sessionRes;
  if (isNumeric) {
    sessionRes = await query(
      "SELECT id, user_id, title, language_code, session_uid, created_at, updated_at FROM chat_sessions WHERE id = $1 OR session_uid = $2",
      [Number(rawParam), rawParam]
    );
  } else {
    sessionRes = await query(
      "SELECT id, user_id, title, language_code, session_uid, created_at, updated_at FROM chat_sessions WHERE session_uid = $1",
      [rawParam]
    );
  }
  return sessionRes.rows[0] || null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const rawParam = (await context.params).sessionId;
    const session = await resolveSession(rawParam);
    if (!session)
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 },
      );

    const messagesRes = await query(
      "SELECT id, session_id, sender, content, citations, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
      [session.id],
    );

    const mappedMessages = messagesRes.rows.map((m) => ({
      id: m.id,
      session_id: m.session_id,
      role: m.sender || m.role || "assistant",
      sender: m.sender || m.role || "assistant",
      content: m.content,
      citations: m.citations || [],
      created_at: m.created_at,
    }));

    return NextResponse.json({
      ...session,
      messages: mappedMessages,
      chat_messages: mappedMessages,
    });
  } catch (error) {
    console.error("Failed to load chat session:", error);
    return NextResponse.json(
      { error: "Failed to load chat session" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const rawParam = (await context.params).sessionId;
    const session = await resolveSession(rawParam);
    if (!session)
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 },
      );

    const { title } = await request.json();
    const result = await query(
      "UPDATE chat_sessions SET title = $1, updated_at = NOW() WHERE id = $2 RETURNING id, user_id, title, language_code, session_uid, created_at, updated_at",
      [title, session.id],
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update chat session:", error);
    return NextResponse.json(
      { error: "Failed to update chat session" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const rawParam = (await context.params).sessionId;
    const session = await resolveSession(rawParam);
    if (!session)
      return NextResponse.json(
        { error: "Chat session not found" },
        { status: 404 },
      );

    await query("DELETE FROM chat_sessions WHERE id = $1", [session.id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete chat session:", error);
    return NextResponse.json(
      { error: "Failed to delete chat session" },
      { status: 500 },
    );
  }
}
