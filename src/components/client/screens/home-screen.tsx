"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDashed,
  Clock3,
  Dumbbell,
  Eye,
  MoonStar,
  Salad,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { ClientAuthGate } from "@/components/client/client-auth-gate";
import { ClientCard } from "@/components/client/client-card";
import { ClientPage } from "@/components/client/client-page";
import { ClientShell } from "@/components/client/client-shell";
import { Badge } from "@/components/ui/badge";
import { buildDailyPlanHref } from "@/lib/client-navigation-state";
import { addDaysDateOnly, parseDateOnly, sameDateOnly } from "@/lib/date-only";
import type {
  HomeActivePlanState,
  HomeSetupState,
  HomeSetupStepState,
  HomeWorkoutDayPreview,
  HomeWorkoutExercisePreview,
  HomeWorkoutPlanPreview,
} from "@/types/home-workout";
import type { WorkoutSessionStatus } from "@/types/workout-tracking";

interface HomeScreenProps {
  firstName: string;
  homeState: HomeSetupState;
  activePlanPreview: HomeWorkoutPlanPreview | null;
  todayDateOnly: string;
}

function getInitialSelectedDate(todayDateOnly: string, activePlanPreview: HomeWorkoutPlanPreview | null) {
  if (!activePlanPreview || activePlanPreview.days.length === 0) {
    return todayDateOnly;
  }

  const hasToday = activePlanPreview.days.some((day) => sameDateOnly(day.planDate, todayDateOnly));

  if (hasToday) {
    return todayDateOnly;
  }

  return activePlanPreview.days[0].planDate;
}

function formatDateLabel(dateOnly: string) {
  const { year, monthIndex, day } = parseDateOnly(dateOnly);

  return new Date(year, monthIndex, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "long",
  });
}

function formatWeekday(dateOnly: string) {
  const { year, monthIndex, day } = parseDateOnly(dateOnly);

  return new Date(year, monthIndex, day).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function formatDayNumber(dateOnly: string) {
  return String(parseDateOnly(dateOnly).day);
}

function getStatusLabel(status: WorkoutSessionStatus) {
  switch (status) {
    case "completed":
      return "Completed";
    case "skipped":
      return "Skipped";
    case "in_progress":
      return "In Progress";
    default:
      return "Not Started";
  }
}

function getStatusBadgeVariant(status: WorkoutSessionStatus) {
  switch (status) {
    case "completed":
      return "success";
    case "skipped":
      return "warning";
    default:
      return "outline";
  }
}

function getStatusMessage(day: HomeWorkoutDayPreview) {
  switch (day.status) {
    case "completed":
      return "This workout was completed.";
    case "skipped":
      return "This workout was skipped. The plan remains unchanged and the record is saved.";
    case "in_progress":
      return `${day.completedExercises} of ${day.totalExercises} exercises completed.`;
    default:
      return "This workout has not been started yet.";
  }
}

function getPrimaryActionLabel(day: HomeWorkoutDayPreview) {
  switch (day.status) {
    case "completed":
      return "View Completed Workout";
    case "skipped":
      return "View Workout";
    case "in_progress":
      return "Continue Workout";
    default:
      return "Start Workout";
  }
}

function formatExercisePrescription(exercise: HomeWorkoutExercisePreview) {
  if (exercise.sets !== null && exercise.repetitions) {
    return `${exercise.sets} sets × ${exercise.repetitions} reps`;
  }

  if (exercise.sets !== null) {
    return `${exercise.sets} sets`;
  }

  if (exercise.repetitions) {
    return `${exercise.repetitions} reps`;
  }

  return null;
}

function getWorkoutFocus(day: HomeWorkoutDayPreview) {
  if (day.dayType === "rest") {
    return "Rest Day";
  }

  return day.focusCategory?.trim() || "Workout Day";
}

const primaryLinkClassName =
  "inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-6 text-base font-medium text-white shadow-[var(--shadow-soft)] transition-all duration-200 hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]";

function SetupStepRow({ step }: { step: HomeSetupStepState }) {
  if (step.status === "complete") {
    return (
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-5 shrink-0 text-[var(--color-success)]" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text)]">{step.title}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{step.description}</p>
        </div>
      </div>
    );
  }

  if (step.status === "current") {
    return (
      <div className="flex items-center gap-3">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]">
          <span className="size-2 rounded-full bg-white" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-primary)]">{step.title}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{step.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Circle className="size-5 shrink-0 text-[var(--color-text-secondary)]" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text)]">{step.title}</p>
        <p className="text-xs text-[var(--color-text-secondary)]">{step.description}</p>
      </div>
    </div>
  );
}

function OnboardingHome({
  firstName,
  setupState,
}: {
  firstName: string;
  setupState: Extract<HomeSetupState, { kind: "first_time_setup" }>;
}) {
  const benefits = [
    { label: "Personalized Workout", icon: Dumbbell },
    { label: "Nutrition Guidance", icon: Salad },
    { label: "Progress Tracking", icon: Sparkles },
  ];

  return (
    <ClientShell
      title={`Welcome, ${firstName}`}
      subtitle="Set up your fitness profile to receive your personalized plan."
      currentPath="/home"
    >
      <ClientPage className="space-y-4 pb-24">
        <ClientCard className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Your Setup</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Complete each step in order.
              </p>
            </div>
            <Badge variant="outline">Setup</Badge>
          </div>
          <div className="space-y-4">
            {setupState.steps.map((step) => (
              <SetupStepRow key={step.id} step={step} />
            ))}
          </div>
          <Link href={setupState.primaryActionHref} className={primaryLinkClassName}>
            <span>{setupState.primaryActionLabel}</span>
            <ChevronRight className="ml-2 size-4" />
          </Link>
        </ClientCard>

        <div className="grid grid-cols-3 gap-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <ClientCard key={benefit.label} className="space-y-2 px-3 py-4 text-center">
                <Icon className="mx-auto size-5 text-[var(--color-primary)]" />
                <p className="text-xs font-semibold leading-5 text-[var(--color-text)]">
                  {benefit.label}
                </p>
              </ClientCard>
            );
          })}
        </div>
      </ClientPage>
    </ClientShell>
  );
}

function ReturningStateHome({
  firstName,
  state,
}: {
  firstName: string;
  state:
    | Extract<HomeSetupState, { kind: "returning_assessment_only" }>
    | Extract<HomeSetupState, { kind: "returning_no_active_plan" }>;
}) {
  return (
    <ClientShell
      title={`Welcome back, ${firstName}`}
      subtitle="Pick up where your fitness journey left off."
      currentPath="/home"
    >
      <ClientPage className="space-y-4 pb-24">
        <ClientCard className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{state.title}</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">{state.description}</p>
            </div>
            <Badge variant="outline">Returning</Badge>
          </div>
          <Link href={state.primaryActionHref} className={primaryLinkClassName}>
            <span>{state.primaryActionLabel}</span>
            <ChevronRight className="ml-2 size-4" />
          </Link>
          {"secondaryActionHref" in state ? (
            <Link
              href={state.secondaryActionHref}
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]"
            >
              {state.secondaryActionLabel}
            </Link>
          ) : null}
        </ClientCard>
      </ClientPage>
    </ClientShell>
  );
}

function ExerciseRow({ exercise }: { exercise: HomeWorkoutExercisePreview }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-3">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted-bg)]">
        {exercise.imageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${exercise.imageUrl})` }}
          />
        ) : (
          <Dumbbell className="size-5 text-[var(--color-text-secondary)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-text)]">
              {exercise.exerciseName}
            </p>
            <p className="truncate text-xs text-[var(--color-text-secondary)]">
              {exercise.equipmentLabel}
            </p>
          </div>
          <div className="shrink-0 text-right">
            {formatExercisePrescription(exercise) ? (
              <p className="text-xs font-medium text-[var(--color-text)]">
                {formatExercisePrescription(exercise)}
              </p>
            ) : null}
            {exercise.completed ? (
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-success)]">
                <CheckCircle2 className="size-3.5" />
                Done
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeScreen({
  firstName,
  homeState,
  activePlanPreview,
  todayDateOnly,
}: HomeScreenProps) {
  if (homeState.kind === "first_time_setup") {
    return (
      <ClientAuthGate>
        <OnboardingHome firstName={firstName} setupState={homeState} />
      </ClientAuthGate>
    );
  }

  if (
    homeState.kind === "returning_assessment_only" ||
    homeState.kind === "returning_no_active_plan"
  ) {
    return (
      <ClientAuthGate>
        <ReturningStateHome firstName={firstName} state={homeState} />
      </ClientAuthGate>
    );
  }

  return (
    <CompletedHome
      firstName={firstName}
      homeState={homeState}
      activePlanPreview={activePlanPreview}
      todayDateOnly={todayDateOnly}
    />
  );
}

function CompletedHome({
  firstName,
  homeState,
  activePlanPreview,
  todayDateOnly,
}: {
  firstName: string;
  homeState: HomeActivePlanState;
  activePlanPreview: HomeWorkoutPlanPreview | null;
  todayDateOnly: string;
}) {
  const [selectedDate, setSelectedDate] = useState(
    getInitialSelectedDate(todayDateOnly, activePlanPreview),
  );

  const daysByDate = new Map<string, HomeWorkoutDayPreview>(
    (activePlanPreview?.days ?? []).map((day) => [day.planDate, day] as const),
  );
  const selectedDay = daysByDate.get(selectedDate) ?? null;
  const selectedDateItems = Array.from({ length: 7 }, (_, index) => {
    const date = addDaysDateOnly(selectedDate, index - 3);

    return {
      date,
      isEnabled: daysByDate.has(date),
      isSelected: sameDateOnly(date, selectedDate),
    };
  });
  const title = `Good Morning, ${firstName}`;

  return (
    <ClientAuthGate>
      <ClientShell title={title} subtitle="Stay consistent. Your next session is ready.">
        <ClientPage className="space-y-4 pb-24">
          {homeState.dashboardNotice ? (
            <ClientCard className="space-y-3">
              <p className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                <span className="min-w-0 flex-1">
                  လက်ရှိ Plan သည် ယခင် Profile အချက်အလက်များအပေါ် အခြေခံထားပါသည်။
                </span>
                <Link
                  href={homeState.dashboardNotice.actionHref}
                  aria-label={homeState.dashboardNotice.actionLabel}
                  title={homeState.dashboardNotice.actionLabel}
                  className="ml-auto inline-flex shrink-0 items-center justify-center text-[var(--color-text)] transition hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]"
                >
                  <Eye className="h-6 w-6" strokeWidth={2.5} />
                </Link>
              </p>
            </ClientCard>
          ) : null}
          {activePlanPreview ? (
            <>
              <div
                className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1"
                data-testid="home-date-selector"
              >
                {selectedDateItems.map((item) => (
                  <button
                    key={item.date}
                    type="button"
                    disabled={!item.isEnabled}
                    onClick={() => {
                      if (item.isEnabled) {
                        setSelectedDate(item.date);
                      }
                    }}
                    className={`min-w-[4.5rem] rounded-[1.35rem] border px-3 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)] disabled:cursor-not-allowed ${
                      item.isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]"
                        : item.isEnabled
                          ? "border-[var(--color-border)] bg-white text-[var(--color-text)]"
                          : "border-[var(--color-border)] bg-[var(--color-muted-bg)] text-[var(--color-text-secondary)] opacity-60"
                    }`}
                    aria-pressed={item.isSelected}
                  >
                    <p className="text-xs font-medium">{formatWeekday(item.date)}</p>
                    <p className="mt-1 text-lg font-semibold leading-none">
                      {formatDayNumber(item.date)}
                    </p>
                  </button>
                ))}
              </div>

              {selectedDay ? (
                <>
                  <ClientCard className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                          {formatDateLabel(selectedDay.planDate)}
                        </p>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
                            {getWorkoutFocus(selectedDay)}
                          </h2>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                            {selectedDay.dayType === "rest" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-muted-bg)] px-3 py-1">
                                <MoonStar className="size-3.5" />
                                Recovery Day
                              </span>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-muted-bg)] px-3 py-1">
                                  <Clock3 className="size-3.5" />
                                  {selectedDay.estimatedDurationMinutes === null
                                    ? "Duration not set"
                                    : `${selectedDay.estimatedDurationMinutes} min`}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-muted-bg)] px-3 py-1">
                                  <Dumbbell className="size-3.5" />
                                  {selectedDay.totalExercises} exercises
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(selectedDay.status)}>
                        {selectedDay.dayType === "rest" ? "Rest Day" : getStatusLabel(selectedDay.status)}
                      </Badge>
                    </div>

                    {selectedDay.dayType === "rest" ? (
                      <div className="rounded-2xl mt-2  border border-[var(--color-border)] bg-[var(--color-muted-bg)] px-4 py-4">
                        <p className="font-medium text-[var(--color-text)]">Take time to recover.</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                          Light stretching, walking, hydration, and sleep will support your next
                          training day.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div
                          className="max-h-[300px] overflow-y-auto overflow-x-hidden pr-2 [scrollbar-gutter:stable] [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
                          aria-label="Exercises for selected workout"
                          data-testid="selected-day-exercise-list"
                        >
                          {selectedDay.exercises.length ? (
                            <div className="space-y-3 mt-6">
                              {selectedDay.exercises.map((exercise) => (
                                <ExerciseRow
                                  key={exercise.generatedPlanExerciseId}
                                  exercise={exercise}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted-bg)] px-4 py-4">
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                No exercises are scheduled for this workout yet.
                              </p>
                            </div>
                          )}
                        </div>
                        <div
                          className="flex mt-4 items-center justify-between rounded-2xl bg-[var(--color-muted-bg)] px-4 py-3 text-sm"
                          data-testid="selected-day-progress-summary"
                        >
                          <span className="text-[var(--color-text-secondary)]">
                            Workout progress
                          </span>
                          <span className="font-semibold text-[var(--color-text)]">
                            {selectedDay.completedExercises} of {selectedDay.totalExercises} completed
                          </span>
                        </div>
                      </>
                    )}
                  </ClientCard>

                  <ClientCard className="space-y-3">
                    <div className="flex items-center gap-2">
                      {selectedDay.status === "completed" ? (
                        <CheckCircle2 className="size-4 text-[var(--color-success)]" />
                      ) : (
                        <CircleDashed className="size-4 text-[var(--color-primary)]" />
                      )}
                      <h3 className="font-semibold text-[var(--color-text)]">Workout Status</h3>
                    </div>
                    <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                      {selectedDay.dayType === "rest"
                        ? "This date is scheduled as recovery time. No workout."
                        : getStatusMessage(selectedDay)}
                    </p>
                  </ClientCard>

                  {selectedDay.dayType !== "rest" ? (
                    <Link
                      href={buildDailyPlanHref(selectedDay.planDate, "workout")}
                      className={primaryLinkClassName}
                    >
                      {getPrimaryActionLabel(selectedDay)}
                    </Link>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
        </ClientPage>
      </ClientShell>
    </ClientAuthGate>
  );
}
