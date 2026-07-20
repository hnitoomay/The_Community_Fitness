import type { AdminImageUploadType } from "@/lib/server/admin-image-storage";

export async function uploadAdminImage(input: {
  file: File;
  type: AdminImageUploadType;
  existingImagePath?: string | null;
}) {
  const formData = new FormData();
  formData.set("file", input.file);
  formData.set("type", input.type);

  if (input.existingImagePath) {
    formData.set("existingImagePath", input.existingImagePath);
  }

  const response = await fetch("/api/admin/upload-image", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as
    | { imageUrl: string }
    | { error?: string };

  if (!response.ok || !("imageUrl" in payload)) {
    const message =
      "error" in payload && payload.error
        ? payload.error
        : "Unable to upload image right now.";

    throw new Error(message);
  }

  return payload.imageUrl;
}
