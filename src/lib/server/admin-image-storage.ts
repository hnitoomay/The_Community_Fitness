import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const adminImageUploadTypes = [
  "body-goals",
  "exercises",
  "equipment",
] as const;

export type AdminImageUploadType = (typeof adminImageUploadTypes)[number];

const allowedMimeTypeToExtension = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const maxImageSizeBytes = 5 * 1024 * 1024;

function sanitizeFileBaseName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim().toLowerCase();
  const sanitized = baseName
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "image";
}

function getTargetDirectory(type: AdminImageUploadType) {
  return path.join(process.cwd(), "public", "images", type);
}

function getPublicImagePath(type: AdminImageUploadType, fileName: string) {
  return `/images/${type}/${fileName}`;
}

function resolveManagedImagePath(imagePath: string) {
  return path.resolve(process.cwd(), "public", imagePath.replace(/^\//, ""));
}

export function isAdminImageUploadType(value: string): value is AdminImageUploadType {
  return adminImageUploadTypes.includes(value as AdminImageUploadType);
}

export function isManagedAdminImagePath(
  value: string,
  type: AdminImageUploadType,
) {
  return value.startsWith(`/images/${type}/`);
}

export function validateAdminImageFile(file: File) {
  if (!(file instanceof File) || file.size === 0) {
    return "Select an image file.";
  }

  if (!(file.type in allowedMimeTypeToExtension)) {
    return "Only JPG, JPEG, PNG, and WEBP files are allowed.";
  }

  if (file.size > maxImageSizeBytes) {
    return "Image size must be 5MB or smaller.";
  }

  return null;
}

export async function deleteManagedImageIfPresent(
  imagePath: string,
  type: AdminImageUploadType,
) {
  if (!isManagedAdminImagePath(imagePath, type)) {
    return;
  }

  const targetDirectory = path.resolve(getTargetDirectory(type));
  const absoluteImagePath = resolveManagedImagePath(imagePath);

  if (!absoluteImagePath.startsWith(targetDirectory)) {
    return;
  }

  try {
    await unlink(absoluteImagePath);
  } catch {
    // Ignore missing files so image replacement remains non-blocking.
  }
}

export async function saveAdminImageFile(input: {
  file: File;
  type: AdminImageUploadType;
  existingImagePath?: string | null;
}) {
  const validationError = validateAdminImageFile(input.file);

  if (validationError) {
    throw new Error(validationError);
  }

  const extension =
    allowedMimeTypeToExtension[
      input.file.type as keyof typeof allowedMimeTypeToExtension
    ];
  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${sanitizeFileBaseName(
    input.file.name,
  )}.${extension}`;
  const targetDirectory = getTargetDirectory(input.type);
  const absoluteFilePath = path.join(targetDirectory, fileName);
  const buffer = Buffer.from(await input.file.arrayBuffer());

  await mkdir(targetDirectory, { recursive: true });
  await writeFile(absoluteFilePath, buffer);

  if (input.existingImagePath) {
    await deleteManagedImageIfPresent(input.existingImagePath, input.type);
  }

  return getPublicImagePath(input.type, fileName);
}
