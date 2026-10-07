import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

function cloudinaryUrl(fileKey: string | null): string | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return cloudName && fileKey
    ? `https://res.cloudinary.com/${cloudName}/auto/upload/${fileKey}`
    : null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("user_id"));
    if (!userId)
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );

    const result = await query(
      `
      SELECT id, user_id, household_member_id, citizen_uid, document_type,
             document_number_masked, file_key, file_name, file_size_bytes,
             mime_type, is_verified, uploaded_at, verified_at
      FROM user_documents
      WHERE user_id = $1
      ORDER BY uploaded_at DESC
      LIMIT 100
    `,
      [userId],
    );

    return NextResponse.json(
      result.rows.map((row) => ({
        ...row,
        download_url: cloudinaryUrl(row.file_key),
      })),
    );
  } catch (error) {
    console.error("Failed to list vault documents:", error);
    return NextResponse.json(
      { error: "Failed to list vault documents" },
      { status: 500 },
    );
  }
}
