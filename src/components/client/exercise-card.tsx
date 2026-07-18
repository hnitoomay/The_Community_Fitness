"use client";

import { Circle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientCard } from "@/components/client/client-card";
import { Badge } from "@/components/ui/badge";
import type { ExerciseRecord } from "@/types/client-plan";

interface ExerciseCardProps {
  exercise: ExerciseRecord;
  completed: boolean;
  onToggleComplete: () => void;
  onViewInstructions: () => void;
}

export function ExerciseCard({
  exercise,
  completed,
  onToggleComplete,
  onViewInstructions,
}: ExerciseCardProps) {
  return (
    <ClientCard className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-muted-bg)]">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
              {exercise.imagePlaceholder}
            </p>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[var(--color-text)]">{exercise.exerciseName}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {exercise.requiredEquipmentName} • {exercise.targetMuscle}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleComplete}
              className="rounded-full p-1 text-[var(--color-primary)]"
              aria-label={completed ? "Mark exercise incomplete" : "Mark exercise complete"}
            >
              {completed ? (
                <CheckCircle2 className="size-5 text-[var(--color-success)]" />
              ) : (
                <Circle className="size-5 text-[var(--color-text-secondary)]" />
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{exercise.sets}</Badge>
            <Badge variant="outline">{exercise.repetitionsOrDuration}</Badge>
            <Badge variant="outline">Rest {exercise.restTime}</Badge>
          </div>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        leadingIcon={<Info className="size-4" />}
        onClick={onViewInstructions}
      >
        View Instructions
      </Button>
    </ClientCard>
  );
}
