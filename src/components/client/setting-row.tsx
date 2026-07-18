import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingRowProps {
  label: string;
  description?: string;
  onClick?: () => void;
  destructive?: boolean;
}

export function SettingRow({
  label,
  description,
  onClick,
  destructive = false,
}: SettingRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 text-left transition hover:border-[var(--color-primary)]"
    >
      <div>
        <p
          className={cn(
            "font-medium",
            destructive ? "text-[var(--color-error)]" : "text-[var(--color-text)]",
          )}
        >
          {label}
        </p>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
        ) : null}
      </div>
      <ChevronRight
        className={cn(
          "size-4 shrink-0",
          destructive ? "text-[var(--color-error)]" : "text-[var(--color-text-secondary)]",
        )}
      />
    </button>
  );
}
