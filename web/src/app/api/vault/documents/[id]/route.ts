import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("user_id"));
    const documentId = Number((await context.params).id);
    if (!userId || !documentId) {
      return NextResponse.json(
        { error: "user_id and document id are required" },
        { status: 400 },
      );
    }

    const result = await query(
      "DELETE FROM user_documents WHERE id = $1 AND user_id = $2 RETURNING id",
      [documentId, userId],
    );
    if (result.rowCount === 0)
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete vault document:", error);
    return NextResponse.json(
      { error: "Failed to delete vault document" },
      { status: 500 },
    );
  }
}
