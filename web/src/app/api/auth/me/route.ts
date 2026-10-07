import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/legacy-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user)
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_verified: user.is_verified,
      citizen_uid: user.citizen_uid,
      household_uid: user.household_uid,
      profile: user.full_name
        ? {
            full_name: user.full_name,
            date_of_birth: user.date_of_birth,
            gender: user.gender,
            state: user.state,
            district: user.district,
            annual_income: user.annual_income,
            occupation: user.occupation,
            caste_category: user.caste_category,
            residence_area: user.residence_area,
            marital_status: user.marital_status,
            has_land: user.has_land,
            is_differently_abled: user.is_differently_abled,
          }
        : null,
    });
  } catch (error) {
    console.error("Failed to load authenticated user:", error);
    return NextResponse.json(
      { error: "Failed to load authenticated user" },
      { status: 500 },
    );
  }
}
