"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdminImageUploadType } from "@/lib/server/admin-image-storage";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  type: AdminImageUploadType;
  value: string;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  onRemoveCurrent?: () => void;
  onPreviewUrlChange?: (previewUrl: string) => void;
  error?: string;
  helperText?: string;
}

function validateImageFile(file: File) {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedMimeTypes.includes(file.type)) {
    return "Only JPG, JPEG, PNG, and WEBP files are allowed.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "Image size must be 5MB or smaller.";
  }

  return "";
}

export function ImageUpload({
  type,
  value,
  selectedFile,
  onFileChange,
  onRemoveCurrent,
  onPreviewUrlChange,
  error,
  helperText,
}: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      onPreviewUrlChange?.(value);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    onPreviewUrlChange?.(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [onPreviewUrlChange, selectedFile, value]);

  const handleFile = (file: File | null) => {
    if (!file) {
      setLocalError("");
      onFileChange(null);
      return;
    }

    const validationError = validateImageFile(file);

    if (validationError) {
      setLocalError(validationError);
      onFileChange(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    setLocalError("");
    onFileChange(file);
  };

  const currentError = error || localError;
  const previewLabel = selectedFile
    ? selectedFile.name
    : value
      ? value.split("/").pop() || value
      : "No image selected";

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={inputId}
        name="imageFile"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "rounded-[1.5rem] border border-dashed bg-white p-4 transition-colors",
          dragActive
            ? "border-[var(--color-primary)] bg-[rgba(214,31,44,0.04)]"
            : "border-[var(--color-border)]",
          currentError ? "border-[var(--color-error)]" : undefined,
        )}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-muted-bg)] text-[var(--color-primary)]">
              <ImageIcon className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Upload {type.replace("-", " ")} image
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {previewLabel}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                JPG, PNG, or WEBP up to 5MB
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              leadingIcon={<Upload className="size-4" />}
              onClick={() => inputRef.current?.click()}
            >
              Choose Image
            </Button>
            {selectedFile ? (
              <Button
                type="button"
                variant="ghost"
                leadingIcon={<X className="size-4" />}
                onClick={() => handleFile(null)}
              >
                Clear Selection
              </Button>
            ) : value && onRemoveCurrent ? (
              <Button
                type="button"
                variant="ghost"
                leadingIcon={<X className="size-4" />}
                onClick={onRemoveCurrent}
              >
                Delete Image
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {helperText ? (
        <p className="text-sm text-[var(--color-text-secondary)]">{helperText}</p>
      ) : null}
      {currentError ? (
        <p className="text-sm text-[var(--color-error)]">{currentError}</p>
      ) : null}
    </div>
  );
}
