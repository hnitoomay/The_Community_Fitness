import { cn } from "@/lib/utils";

interface HistoryTabButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function HistoryTabButton({
  label,
  selected,
  onClick,
}: HistoryTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-medium transition",
        selected
          ? "bg-[var(--color-primary)] text-white"
          : "bg-white text-[var(--color-text-secondary)] hover:bg-zinc-100",
      )}
    >
      {label}
    </button>
  );
}
