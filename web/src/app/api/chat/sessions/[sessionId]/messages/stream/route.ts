import { NextRequest } from "next/server";
import { generateAssistantReply, saveChatMessage } from "@/lib/chat-server";
import { query } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/legacy-auth";

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
  const rawParam = (await context.params).sessionId;
  const { content } = await request.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      try {
        if (!rawParam || !String(content || "").trim())
          throw new Error("sessionId and content are required");

        let session = await resolveSession(rawParam);

        if (!session) {
          const authUser = await getAuthenticatedUser(request);
          const userId = authUser?.id || 1;
          const createRes = await query(
            `INSERT INTO chat_sessions (user_id, title, language_code, session_uid, created_at, updated_at)
             VALUES ($1, 'New Welfare Consultation', 'en', $2, NOW(), NOW())
             ON CONFLICT (session_uid) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()
             RETURNING id, user_id, title, session_uid`,
            [userId, rawParam]
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
        send({ type: "token", token: reply, citations: [] });
        send({ type: "done", message_id: assistant.id });
      } catch (error) {
        console.error("Failed to stream chat message:", error);
        send({ type: "error", message: "Failed to stream chat message" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
