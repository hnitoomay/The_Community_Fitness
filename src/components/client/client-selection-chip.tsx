import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientSelectionChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function ClientSelectionChip({
  label,
  selected,
  onClick,
}: ClientSelectionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
        selected
          ? "border-[var(--color-primary)] bg-[rgba(214,31,44,0.08)] text-[var(--color-primary)]"
          : "border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)]",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full border",
          selected
            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
            : "border-[var(--color-border)] text-transparent",
        )}
      >
        <Check className="size-3.5" />
      </span>
    </button>
  );
}
