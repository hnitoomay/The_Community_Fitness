"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { CalendarGrid } from "@/components/client/calendar-grid";
import { ClientAuthGate } from "@/components/client/client-auth-gate";
import { ClientCard } from "@/components/client/client-card";
import { ClientPage } from "@/components/client/client-page";
import { ClientShell } from "@/components/client/client-shell";
import { ClientStatusRow } from "@/components/client/client-status-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildDailyPlanHref } from "@/lib/client-navigation-state";
import { buildCalendarMonthGrid, formatMonthLabel } from "@/lib/calendar-month-grid";
import { getTodayDateOnly, parseDateOnly, shiftMonth } from "@/lib/date-only";
import type { ActiveGeneratedPlanCalendarData } from "@/types/generated-plan";

const OUTDATED_PLAN_MESSAGE =
  "ဒီ Plan သည် ယခင် Profile နှင့် Measurement အချက်အလက်များအပေါ် အခြေခံထားပါသည်။";

interface CalendarScreenProps {
  planData: ActiveGeneratedPlanCalendarData | null;
  isPlanOutdated: boolean;
}

function buildWorkoutHref(planDate: string, planId?: number) {
  return buildDailyPlanHref(planDate, "workout", planId ?? null);
}

export function CalendarScreen({
  planData,
  isPlanOutdated,
}: CalendarScreenProps) {
  const todayIso = getTodayDateOnly("Asia/Rangoon");
  const planDays = planData?.days ?? [];
  const initialSelectedDate =
    planDays.find((day) => day.planDate === todayIso)?.planDate ?? planDays[0]?.planDate ?? todayIso;
  const initialDisplayedMonth = parseDateOnly(initialSelectedDate);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [displayedYear, setDisplayedYear] = useState(initialDisplayedMonth.year);
  const [displayedMonthIndex, setDisplayedMonthIndex] = useState(
    initialDisplayedMonth.monthIndex,
  );
  const monthLabel = formatMonthLabel(displayedYear, displayedMonthIndex);
  const calendarDays = useMemo(
    () =>
      planData
        ? buildCalendarMonthGrid({
            displayedYear,
            displayedMonthIndex,
            planData,
            selectedDate,
            todayIso,
          })
        : [],
    [displayedMonthIndex, displayedYear, planData, selectedDate, todayIso],
  );
  const summary = useMemo(
    () =>
      planData
        ? {
            workoutDays: planData.days.filter((day) => day.dayType === "workout").length,
            restDays: planData.days.filter((day) => day.dayType === "rest").length,
            cardioDays: planData.days.filter((day) => day.dayType === "cardio").length,
            stretchingDays: planData.days.filter((day) => day.dayType === "stretching").length,
          }
        : {
            workoutDays: 0,
            restDays: 0,
            cardioDays: 0,
            stretchingDays: 0,
          },
    [planData],
  );

  if (!planData) {
    return (
      <ClientAuthGate>
        <ClientShell
          title="1 Month Plan"
          subtitle="Open assessment to create your first generated plan."
          headerTone="brand"
        >
          <ClientPage className="space-y-4">
            <ClientCard className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                No generated plan yet
              </h2>
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                Generate an AI assessment first, then create a one-month workout and nutrition
                plan.
              </p>
              <Link href="/assessment">
                <Button size="lg" className="w-full">
                  Open Assessment
                </Button>
              </Link>
            </ClientCard>
          </ClientPage>
        </ClientShell>
      </ClientAuthGate>
    );
  }

  const selectedDay = planData.days.find((day) => day.planDate === selectedDate) ?? null;
  const isReadOnlyPlan = planData.plan.status !== "active";
  const workoutHref = selectedDay
    ? buildWorkoutHref(selectedDay.planDate, isReadOnlyPlan ? planData.plan.id : undefined)
    : null;

  const showPreviousMonth = () => {
    const previousMonth = shiftMonth(displayedYear, displayedMonthIndex, -1);
    setDisplayedYear(previousMonth.year);
    setDisplayedMonthIndex(previousMonth.monthIndex);
  };

  const showNextMonth = () => {
    const nextMonth = shiftMonth(displayedYear, displayedMonthIndex, 1);
    setDisplayedYear(nextMonth.year);
    setDisplayedMonthIndex(nextMonth.monthIndex);
  };

  return (
    <ClientAuthGate>
      <ClientShell
        title="1 Month Plan"
        subtitle={`${planData.plan.startDate} - ${planData.plan.endDate}`}
        headerTone="brand"
      >
        <ClientPage className="space-y-4 overflow-x-hidden">
          {isReadOnlyPlan ? (
            <ClientCard className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">
                    Previous Plan
                  </h2>
                  <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                    Archived plans are read-only and do not replace your active plan.
                  </p>
                </div>
                <Badge variant="outline">Previous Plan</Badge>
              </div>
              <Link href="/calendar">
                <Button variant="secondary" size="lg" className="w-full">
                  Back to Active Plan
                </Button>
              </Link>
            </ClientCard>
          ) : isPlanOutdated ? (
            <ClientCard className="space-y-3 border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.04)]">
              <p className="text-sm leading-6 text-[var(--color-text)]">
                {OUTDATED_PLAN_MESSAGE}
              </p>
              <Link href="/assessment">
                <Button size="lg" className="w-full">
                  AI Assessment
                </Button>
              </Link>
            </ClientCard>
          ) : (
            <div className="flex justify-start">
              <Badge variant="success">Active Plan</Badge>
            </div>
          )}

          <div className="-mt-1 flex items-center justify-between rounded-2xl bg-[rgba(214,31,44,0.08)] px-3 py-2">
            <button
              type="button"
              aria-label="Show previous month"
              className="relative z-10 flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]"
              onClick={showPreviousMonth}
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>
            <p className="text-sm font-semibold text-[var(--color-text)]">{monthLabel}</p>
            <button
              type="button"
              aria-label="Show next month"
              className="relative z-10 flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]"
              onClick={showNextMonth}
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>

          <ClientCard className="space-y-4 overflow-hidden">
            <CalendarGrid days={calendarDays} onSelectDate={setSelectedDate} />
          </ClientCard>

          <ClientCard className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Selected Day</p>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">{selectedDate}</h2>
              </div>
              <Badge>{selectedDay ? selectedDay.focusCategory ?? selectedDay.dayType : "No plan"}</Badge>
            </div>
            {selectedDay ? (
              <>
                <div className="space-y-3 rounded-2xl bg-[var(--color-muted-bg)] p-4">
                  <ClientStatusRow label="Day type" value={selectedDay.dayType} />
                  <ClientStatusRow
                    label="Estimated duration"
                    value={
                      selectedDay.estimatedDurationMinutes === null
                        ? "-"
                        : `${selectedDay.estimatedDurationMinutes} mins`
                    }
                  />
                  <ClientStatusRow label="Exercises" value={`${selectedDay.exerciseCount}`} />
                  <ClientStatusRow
                    label="Nutrition"
                    value={
                      selectedDay.mealTypes.length > 0
                        ? selectedDay.mealTypes.join(", ")
                        : "No meals"
                    }
                  />
                </div>
                {workoutHref ? (
                  <Link href={workoutHref}>
                    <Button size="lg" className="w-full">
                      View Daily Plan
                    </Button>
                  </Link>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl bg-[var(--color-muted-bg)] p-4 text-sm text-[var(--color-text-secondary)]">
                No plan for this date.
              </div>
            )}
          </ClientCard>

          <ClientCard className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Monthly Summary</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[var(--color-muted-bg)] p-4">
                <p className="text-2xl font-semibold text-[var(--color-text)]">{summary.workoutDays}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Workout days</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-muted-bg)] p-4">
                <p className="text-2xl font-semibold text-[var(--color-text)]">{summary.restDays}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Rest days</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-muted-bg)] p-4">
                <p className="text-2xl font-semibold text-[var(--color-text)]">{summary.cardioDays}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Cardio days</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-muted-bg)] p-4">
                <p className="text-2xl font-semibold text-[var(--color-text)]">
                  {summary.stretchingDays}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">Stretching days</p>
              </div>
            </div>
          </ClientCard>
        </ClientPage>
      </ClientShell>
    </ClientAuthGate>
  );
}
