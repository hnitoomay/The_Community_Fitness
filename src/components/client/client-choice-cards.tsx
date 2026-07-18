import { cn } from "@/lib/utils";
import type { ChoiceOption } from "@/types/client-journey";

interface ClientChoiceCardsProps {
  options: ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: 2 | 3;
}

export function ClientChoiceCards({
  options,
  value,
  onChange,
  columns = 2,
}: ClientChoiceCardsProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 3 ? "grid-cols-3" : "grid-cols-2",
      )}
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-12 rounded-2xl border px-4 py-3 text-sm font-medium transition",
              selected
                ? "border-[var(--color-primary)] bg-[rgba(214,31,44,0.08)] text-[var(--color-primary)]"
                : "border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
