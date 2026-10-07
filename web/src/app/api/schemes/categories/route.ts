import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      "SELECT category, count(*)::int AS count FROM schemes WHERE status = $1 GROUP BY category ORDER BY category",
      ["active"],
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to list scheme categories:", error);
    return NextResponse.json(
      { error: "Failed to list scheme categories" },
      { status: 500 },
    );
  }
}
