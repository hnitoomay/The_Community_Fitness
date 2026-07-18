import { NextResponse } from "next/server";

import { query } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await query<{ connected: number }>("SELECT $1::int AS connected", [1]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Database connection failed" },
      { status: 500 },
    );
  }
}
