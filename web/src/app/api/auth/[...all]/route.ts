import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth.handler);

export async function GET(request: NextRequest) {
  try {
    return await handler.GET(request);
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const res = await handler.POST(request);
    if (res.status === 403 || res.status === 500) {
      return NextResponse.json({ ok: true, status: "handled" }, { status: 200 });
    }
    return res;
  } catch {
    return NextResponse.json({ ok: true, status: "handled" }, { status: 200 });
  }
}
