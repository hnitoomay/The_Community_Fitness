import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const authHandler = toNextJsHandler(auth);

export async function GET(request: NextRequest) {
  return authHandler.GET(request);
}

export async function POST(request: NextRequest) {
  return authHandler.POST(request);
}

export async function PATCH(request: NextRequest) {
  return authHandler.PATCH(request);
}

export async function PUT(request: NextRequest) {
  return authHandler.PUT(request);
}

export async function DELETE(request: NextRequest) {
  return authHandler.DELETE(request);
}
