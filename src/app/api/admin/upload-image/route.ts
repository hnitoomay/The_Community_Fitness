import { NextResponse } from "next/server";

import { getCurrentServerAuthUser } from "@/lib/server/auth";
import {
  isAdminImageUploadType,
  saveAdminImageFile,
} from "@/lib/server/admin-image-storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authUser = await getCurrentServerAuthUser().catch(() => null);

  if (!authUser?.isAdmin) {
    return NextResponse.json(
      { error: "Admin access is required." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const typeValue = String(formData.get("type") ?? "");
  const fileValue = formData.get("file");
  const existingImagePath = String(formData.get("existingImagePath") ?? "").trim();

  if (!isAdminImageUploadType(typeValue)) {
    return NextResponse.json(
      { error: "Invalid image destination." },
      { status: 400 },
    );
  }

  if (!(fileValue instanceof File)) {
    return NextResponse.json(
      { error: "Select an image file." },
      { status: 400 },
    );
  }

  try {
    const imageUrl = await saveAdminImageFile({
      file: fileValue,
      type: typeValue,
      existingImagePath: existingImagePath || null,
    });

    return NextResponse.json({ imageUrl });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload image right now.",
      },
      { status: 400 },
    );
  }
}
