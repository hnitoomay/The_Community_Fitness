import { Camera, UserRound } from "lucide-react";

interface ProfileAvatarPlaceholderProps {
  imageUrl?: string | null;
  name?: string | null;
  showUploadButton?: boolean;
  uploadLabel?: string;
}

function getInitials(name: string | null | undefined) {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return null;
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function ProfileAvatarPlaceholder({
  imageUrl,
  name,
  showUploadButton = true,
  uploadLabel = "Upload profile image placeholder",
}: ProfileAvatarPlaceholderProps) {
  const initials = getInitials(name);

  return (
    <div className="flex justify-center">
      <div className="relative">
        <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-muted-bg)] text-[var(--color-text-secondary)]">
          {imageUrl ? (
            <div
              aria-hidden="true"
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          ) : initials ? (
            <span className="text-3xl font-semibold text-[var(--color-text)]">{initials}</span>
          ) : (
            <UserRound className="size-12" />
          )}
        </div>
        {showUploadButton ? (
          <button
            type="button"
            className="absolute bottom-1 right-1 flex size-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]"
            aria-label={uploadLabel}
          >
            <Camera className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
