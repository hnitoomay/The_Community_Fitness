import { Dumbbell, MoonStar, Salad } from "lucide-react";

import type { CalendarGridDay } from "@/lib/calendar-month-grid";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  days: CalendarGridDay[];
  onSelectDate: (date: string) => void;
}

function getCategoryTone(category: string | null) {
  if (!category || category === "Rest Day") {
    return "text-zinc-500";
  }

  if (category === "Cardio") {
    return "text-amber-700";
  }

  if (category === "Stretching") {
    return "text-sky-700";
  }

  return "text-rose-700";
}

export function CalendarGrid({
  days,
  onSelectDate,
}: CalendarGridProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          if (!day.isCurrentMonth) {
            return <div key={day.date} className="aspect-square rounded-xl" aria-hidden="true" />;
          }

          const restDay = day.workoutCategory === "Rest Day";
          const dayLabel = restDay
            ? "Rest"
            : day.workoutCategory === "Stretching"
              ? "Stretch"
              : day.workoutCategory;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date)}
              className={cn(
                "flex aspect-square min-w-0 flex-col justify-between overflow-hidden rounded-xl border p-1.5 text-left transition-colors",
                day.isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                  : "border-[var(--color-border)] bg-white text-[var(--color-text)]",
                !day.isSelected && day.isMuted ? "text-zinc-400" : null,
                !day.isSelected && day.isToday ? "border-[var(--color-primary)]" : null,
              )}
              aria-pressed={day.isSelected}
            >
              <div className="flex w-full items-start justify-between gap-1">
                <span
                  className={cn(
                    "text-sm font-semibold leading-none",
                    day.isSelected
                      ? "text-white"
                      : day.isToday
                        ? "text-[var(--color-primary)]"
                        : day.isMuted
                          ? "text-zinc-400"
                          : "text-[var(--color-text)]",
                  )}
                >
                  {day.dayOfMonth}
                </span>
                {day.hasPlan ? (
                  <span
                    className={cn(
                      "inline-flex size-4 items-center justify-center rounded-full",
                      day.isSelected
                        ? "bg-white/15 text-white"
                        : restDay
                          ? "bg-zinc-100 text-zinc-500"
                          : "bg-[rgba(214,31,44,0.1)] text-[var(--color-primary)]",
                    )}
                    aria-label={restDay ? "Rest day" : "Workout day"}
                  >
                    {restDay ? <MoonStar className="size-2.5" /> : <Dumbbell className="size-2.5" />}
                  </span>
                ) : null}
              </div>
              <div className="flex w-full items-end justify-between gap-1">
                {day.hasPlan ? (
                  <span
                    className={cn(
                      "max-w-full truncate text-[9px] font-medium leading-none",
                      day.isSelected ? "text-white/90" : getCategoryTone(day.workoutCategory),
                    )}
                  >
                    {dayLabel}
                  </span>
                ) : (
                  <span aria-hidden="true" className="h-2" />
                )}
                {day.hasNutrition ? (
                  <span
                    className={cn(
                      "inline-flex size-3.5 items-center justify-center rounded-full",
                      day.isSelected
                        ? "bg-white/15 text-white"
                        : "bg-emerald-100 text-emerald-700",
                    )}
                    aria-label="Nutrition plan"
                  >
                    <Salad className="size-2.5" />
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
