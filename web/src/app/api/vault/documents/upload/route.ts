import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const userId = Number(form.get("user_id"));
    if (!(file instanceof File) || !userId) {
      return NextResponse.json(
        { error: "file and user_id are required" },
        { status: 400 },
      );
    }

    const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
    const apiKey = requiredEnv("CLOUDINARY_API_KEY");
    const apiSecret = requiredEnv("CLOUDINARY_API_SECRET");
    const folder = "scheme_vault";
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("folder", folder);
    uploadForm.append("signature", signature);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: "POST", body: uploadForm },
    );
    if (!cloudinaryResponse.ok) {
      const detail = await cloudinaryResponse.text();
      console.error("Cloudinary upload failed:", detail);
      return NextResponse.json(
        { error: "Document storage upload failed" },
        { status: 502 },
      );
    }

    const uploaded = (await cloudinaryResponse.json()) as {
      public_id: string;
      secure_url: string;
      bytes?: number;
      format?: string;
    };
    const documentType = String(form.get("document_type") || "generic");
    const maskedNumber = form.get("document_number_masked");
    const householdMemberId = form.get("household_member_id");

    const result = await query(
      `
      INSERT INTO user_documents (
        user_id, household_member_id, citizen_uid, document_type,
        document_number_masked, file_key, file_name, file_size_bytes,
        mime_type, is_verified, verified_at, uploaded_at
      )
      SELECT $1, $2, u.citizen_uid, $3, $4, $5, $6, $7, $8, true, NOW(), NOW()
      FROM users u
      WHERE u.id = $1
      RETURNING *
    `,
      [
        userId,
        householdMemberId ? Number(householdMemberId) : null,
        documentType,
        maskedNumber ? String(maskedNumber) : null,
        uploaded.public_id,
        file.name,
        uploaded.bytes || file.size,
        file.type || `application/${uploaded.format || "octet-stream"}`,
      ],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Citizen account not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        ...result.rows[0],
        download_url: uploaded.secure_url,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to upload vault document:", error);
    return NextResponse.json(
      { error: "Failed to upload vault document" },
      { status: 500 },
    );
  }
}
