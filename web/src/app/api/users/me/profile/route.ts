import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/legacy-auth";

const allowedFields = [
  "full_name",
  "date_of_birth",
  "gender",
  "state",
  "district",
  "annual_income",
  "occupation",
  "caste_category",
  "is_differently_abled",
  "has_land",
  "residence_area",
  "marital_status",
];

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user)
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const body = await request.json();
    const fields = allowedFields.filter((field) => body[field] !== undefined);
    if (fields.length === 0)
      return NextResponse.json(
        { error: "No profile fields supplied" },
        { status: 400 },
      );

    const values = fields.map((field) => body[field]);
    const assignments = fields.map(
      (field, index) => `${field} = $${index + 1}`,
    );
    values.push(user.id);
    const result = await query(
      `
      INSERT INTO profiles (user_id, ${fields.join(", ")})
      VALUES ($${fields.length + 1}, ${fields.map((_, index) => `$${index + 1}`).join(", ")})
      ON CONFLICT (user_id) DO UPDATE SET ${assignments.map((assignment) => `${assignment.split(" = ")[0]} = EXCLUDED.${assignment.split(" = ")[0]}`).join(", ")}, updated_at = NOW()
      RETURNING *
    `,
      values,
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
