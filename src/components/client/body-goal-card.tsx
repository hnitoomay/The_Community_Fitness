import { CheckCircle2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BodyGoalRecord } from "@/types/client-journey";

interface BodyGoalCardProps {
  goal: BodyGoalRecord;
  selected: boolean;
  onSelect: () => void;
}

export function BodyGoalCard({ goal, selected, onSelect }: BodyGoalCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-3 rounded-[1.5rem] border bg-white p-3 text-left transition",
        selected
          ? "border-[var(--color-primary)] ring-4 ring-[rgba(214,31,44,0.12)]"
          : "border-[var(--color-border)] hover:border-[var(--color-primary)]",
      )}
    >
      <div className="relative overflow-hidden rounded-[1.15rem] bg-[var(--color-muted-bg)]">
        <div className="flex aspect-[4/5] items-center justify-center">
          <div className="text-center">
            <ImageIcon className="mx-auto size-8 text-[var(--color-primary)]" />
            <p className="mt-3 px-4 text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
              {goal.imagePlaceholder}
            </p>
          </div>
        </div>
        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
          {goal.genderGroup === "all" ? "All" : goal.genderGroup}
        </div>
        {selected ? (
          <div className="absolute right-3 top-3 rounded-full bg-white p-1 text-[var(--color-primary)]">
            <CheckCircle2 className="size-5" />
          </div>
        ) : null}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{goal.label}</h3>
        <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
          {goal.description}
        </p>
      </div>
    </button>
  );
}
