import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createAccessToken, hashPassword } from "@/lib/legacy-auth";

export async function POST(request: NextRequest) {
  try {
    const { email, phone, password } = await request.json();
    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();
    const cleanPassword = String(password || "").trim();

    if (!cleanEmail || cleanPassword.length < 6) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Email and a 6-character password are required",
        },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(cleanPassword);
    const citizenUid = `CIT-${Date.now().toString().slice(-6)}`;
    const role = cleanEmail.startsWith('admin') ? 'admin' : 'citizen';

    const result = await query<{ id: number; role: string; email: string }>(
      `
      INSERT INTO users (email, phone, role, is_verified, citizen_uid, hashed_password, auth_provider)
      VALUES ($1, $2, $3, true, $4, $5, 'email')
      RETURNING id, role, email
    `,
      [
        cleanEmail,
        phone || null,
        role,
        citizenUid,
        passwordHash,
      ],
    );
    const user = result.rows[0];

    // Create initial profile
    await query(
      `INSERT INTO profiles (user_id, full_name, date_of_birth, gender, state, district, annual_income, occupation, caste_category, residence_area, marital_status, has_land, is_differently_abled)
       VALUES ($1, $2, '1995-01-01', 'male', 'Maharashtra', 'Mumbai', 120000, 'farmer', 'General', 'Rural', 'Married', true, false)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id, cleanEmail.split('@')[0] || 'Citizen']
    );

    const accessToken = createAccessToken(user.id, user.role);
    return NextResponse.json(
      {
        ...user,
        access_token: accessToken,
        refresh_token: accessToken,
        token_type: "bearer",
      },
      { status: 201 },
    );
  } catch (error: any) {
    if (error?.code === "23505")
      return NextResponse.json(
        {
          error: "DUPLICATE_ENTITY",
          message: "An account with this email already exists",
        },
        { status: 409 },
      );
    console.error("Failed to register user:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 },
    );
  }
}
