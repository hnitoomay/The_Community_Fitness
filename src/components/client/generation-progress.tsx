import { CheckCircle2, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationProgressProps {
  activeStageIndex: number;
  stages: string[];
}

export function GenerationProgress({
  activeStageIndex,
  stages,
}: GenerationProgressProps) {
  return (
    <div className="space-y-3">
      {stages.map((stage, index) => {
        const isComplete = index < activeStageIndex;
        const isActive = index === activeStageIndex;

        return (
          <div
            key={stage}
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-4 py-3",
              isActive
                ? "border-[var(--color-primary)] bg-[rgba(214,31,44,0.08)]"
                : "border-[var(--color-border)] bg-white",
            )}
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-[var(--color-muted-bg)]">
              {isComplete ? (
                <CheckCircle2 className="size-4 text-[var(--color-success)]" />
              ) : isActive ? (
                <LoaderCircle className="size-4 animate-spin text-[var(--color-primary)]" />
              ) : (
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  {index + 1}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">{stage}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isComplete ? "Complete" : isActive ? "In progress" : "Pending"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
