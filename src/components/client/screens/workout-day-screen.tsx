"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Dumbbell,
  Info,
  LoaderCircle,
  RotateCcw,
  Salad,
  SkipForward,
} from "lucide-react";

import type { WorkoutTrackingActionState } from "@/app/(client)/workout/[date]/action-state";
import {
  saveWorkoutFeedbackAction,
  skipWorkoutAction,
  toggleWorkoutExerciseCompletionAction,
  undoSkipWorkoutAction,
} from "@/app/(client)/workout/[date]/actions";
import { ClientAuthGate } from "@/components/client/client-auth-gate";
import { ClientCard } from "@/components/client/client-card";
import { ClientPage } from "@/components/client/client-page";
import { ClientShell } from "@/components/client/client-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import {
  buildDailyPlanHref,
  type DailyPlanTab,
} from "@/lib/client-navigation-state";
import { formatExercisePrescription } from "@/lib/format-exercise-prescription";
import type {
  ActiveGeneratedPlanCalendarData,
  GeneratedPlanDayDetails,
  GeneratedPlanExerciseDetail,
} from "@/types/generated-plan";
import type {
  WorkoutExerciseTrackingDetail,
  WorkoutSessionTrackingDetail,
} from "@/types/workout-tracking";

interface WorkoutDayScreenProps {
  dayDetails: GeneratedPlanDayDetails;
  calendarData: ActiveGeneratedPlanCalendarData;
  initialTracking: WorkoutSessionTrackingDetail | null;
  initialTab?: "workout" | "nutrition";
  isPlanReadOnly?: boolean;
}

const DAILY_NUTRITION_SUMMARY =
  "သင့်ရည်မှန်းချက်နှင့် ကိုက်ညီသော အစားအသောက်အစီအစဉ်။";

function groupMealsByType(dayDetails: GeneratedPlanDayDetails) {
  return dayDetails.meals.reduce<Record<string, typeof dayDetails.meals>>((acc, meal) => {
    const group = acc[meal.mealType] ?? [];
    group.push(meal);
    acc[meal.mealType] = group;
    return acc;
  }, {});
}

function createEmptyTracking(totalExercises: number): WorkoutSessionTrackingDetail {
  return {
    sessionId: null,
    status: "not_started",
    difficultyRating: null,
    painReported: false,
    feedbackNote: null,
    startedAt: null,
    completedAt: null,
    totalExercises,
    completedExercises: 0,
    completionPercent: 0,
    exerciseLogs: [],
  };
}

function getExerciseTracking(
  tracking: WorkoutSessionTrackingDetail,
  generatedPlanExerciseId: number,
): WorkoutExerciseTrackingDetail | null {
  return (
    tracking.exerciseLogs.find(
      (entry) => entry.generatedPlanExerciseId === generatedPlanExerciseId,
    ) ?? null
  );
}

function isReadOnlyStatus(status: WorkoutSessionTrackingDetail["status"]) {
  return status === "skipped";
}

function getStatusLabel(status: WorkoutSessionTrackingDetail["status"]) {
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

function getStatusVariant(status: WorkoutSessionTrackingDetail["status"]) {
  switch (status) {
    case "completed":
      return "success";
    case "skipped":
      return "warning";
    default:
      return "outline";
  }
}

function formatExerciseCategory(exercise: GeneratedPlanExerciseDetail) {
  const equipmentLabel =
    exercise.requiredEquipmentNames.length > 0
      ? exercise.requiredEquipmentNames.join(", ")
      : "Bodyweight";

  return `${equipmentLabel} - ${exercise.category}`;
}

function formatActionMessage(result: WorkoutTrackingActionState) {
  return {
    type: result.success ? ("success" as const) : ("error" as const),
    text: result.message,
  };
}

export function WorkoutDayScreen({
  dayDetails,
  calendarData,
  initialTracking,
  initialTab = "workout",
  isPlanReadOnly = false,
}: WorkoutDayScreenProps) {
  const resetKey = [
    dayDetails.day.planDate,
    initialTracking?.sessionId ?? "new",
    initialTracking?.status ?? "not_started",
    initialTracking?.completedExercises ?? 0,
    dayDetails.exercises.length,
    initialTab,
  ].join(":");

  return (
    <WorkoutDayScreenState
      key={resetKey}
      dayDetails={dayDetails}
      calendarData={calendarData}
      initialTracking={initialTracking}
      initialTab={initialTab}
      isPlanReadOnly={isPlanReadOnly}
    />
  );
}

function WorkoutDayScreenState({
  dayDetails,
  calendarData,
  initialTracking,
  initialTab,
  isPlanReadOnly = false,
}: WorkoutDayScreenProps) {
  const router = useRouter();
  const baseTracking = initialTracking ?? createEmptyTracking(dayDetails.exercises.length);

  const [selectedTab, setSelectedTab] = useState<"workout" | "nutrition">(
    initialTab ?? "workout",
  );
  const [instructionExercise, setInstructionExercise] =
    useState<GeneratedPlanExerciseDetail | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [feedbackDifficulty, setFeedbackDifficulty] = useState<number | null>(
    baseTracking.difficultyRating,
  );
  const [feedbackPain, setFeedbackPain] = useState<boolean>(baseTracking.painReported);
  const [feedbackNote, setFeedbackNote] = useState<string>(baseTracking.feedbackNote ?? "");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [pendingExerciseId, setPendingExerciseId] = useState<number | null>(null);
  const [tracking, setTracking] = useState<WorkoutSessionTrackingDetail>(baseTracking);
  const [isPending, startTransition] = useTransition();

  const horizontalDates = calendarData.days.filter(
    (day) => day.weekNumber === dayDetails.day.weekNumber,
  );
  const groupedMeals = useMemo(() => groupMealsByType(dayDetails), [dayDetails]);
  const isReadOnly = isPlanReadOnly || isReadOnlyStatus(tracking.status);
  const hasExercises = dayDetails.exercises.length > 0;
  const readOnlyPlanId = isPlanReadOnly ? dayDetails.plan.id : null;
  const calendarShortcut = (
    <Link
      href="/calendar"
      aria-label="Open workout calendar"
      className="flex size-10 items-center justify-center text-[var(--color-text)] transition hover:text-[rgba(214,31,44,0.16)] focus-visible:outline-none focus-visible:ring-4"
    >
      <CalendarDays className="size-5" />
    </Link>
  );

  const buildDayHref = (planDate: string, tab = selectedTab) =>
    buildDailyPlanHref(planDate, tab, readOnlyPlanId);

  const handleTabChange = (nextTab: DailyPlanTab) => {
    if (nextTab === selectedTab) {
      return;
    }

    setSelectedTab(nextTab);
    router.replace(buildDayHref(dayDetails.day.planDate, nextTab), { scroll: false });
  };

  const runTrackingAction = (
    callback: () => Promise<WorkoutTrackingActionState>,
    options?: { closeModal?: () => void },
  ) => {
    startTransition(async () => {
      const result = await callback();
      setMessage(formatActionMessage(result));

      if (result.success && result.tracking) {
        setTracking(result.tracking);
        setFeedbackDifficulty(result.tracking.difficultyRating);
        setFeedbackPain(result.tracking.painReported);
        setFeedbackNote(result.tracking.feedbackNote ?? "");
        options?.closeModal?.();
      }

      setPendingExerciseId(null);
    });
  };

  const handleExerciseCompletionToggle = (
    exercise: GeneratedPlanExerciseDetail,
    nextCompleted: boolean,
  ) => {
    if (isReadOnly) {
      setMessage({
        type: "error",
        text: "Skipped workouts are view-only until you undo skip.",
      });
      return;
    }

    const previousTracking = tracking;
    const optimisticTracking: WorkoutSessionTrackingDetail = {
      ...tracking,
      exerciseLogs: tracking.exerciseLogs.some(
        (entry) => entry.generatedPlanExerciseId === exercise.id,
      )
        ? tracking.exerciseLogs.map((entry) =>
            entry.generatedPlanExerciseId === exercise.id
              ? { ...entry, completed: nextCompleted }
              : entry,
          )
        : [
            ...tracking.exerciseLogs,
            {
              generatedPlanExerciseId: exercise.id,
              completed: nextCompleted,
              completedSets: null,
              actualRepetitions: null,
              note: null,
              completedAt: null,
            },
          ],
    };
    const optimisticCompletedExercises = optimisticTracking.exerciseLogs.filter(
      (entry) => entry.completed,
    ).length;
    optimisticTracking.completedExercises = optimisticCompletedExercises;
    optimisticTracking.totalExercises = tracking.totalExercises;
    optimisticTracking.completionPercent =
      tracking.totalExercises === 0
        ? 0
        : Math.round((optimisticCompletedExercises / tracking.totalExercises) * 100);
    optimisticTracking.status =
      optimisticCompletedExercises === 0
        ? "not_started"
        : optimisticCompletedExercises === tracking.totalExercises &&
            tracking.totalExercises > 0
          ? "completed"
          : "in_progress";

    setTracking(optimisticTracking);
    setPendingExerciseId(exercise.id);

    startTransition(async () => {
      const result = await toggleWorkoutExerciseCompletionAction({
        date: dayDetails.day.planDate,
        generatedPlanExerciseId: exercise.id,
        completed: nextCompleted,
      });
      setMessage(formatActionMessage(result));

      if (result.success && result.tracking) {
        setTracking(result.tracking);
        setFeedbackDifficulty(result.tracking.difficultyRating);
        setFeedbackPain(result.tracking.painReported);
        setFeedbackNote(result.tracking.feedbackNote ?? "");
      } else {
        setTracking(previousTracking);
      }

      setPendingExerciseId(null);
    });
  };

  const handleSkipWorkout = () => {
    if (!hasExercises) {
      setMessage({
        type: "error",
        text: "Rest days cannot be skipped as workouts.",
      });
      return;
    }

    runTrackingAction(
      () =>
        skipWorkoutAction({
          date: dayDetails.day.planDate,
        }),
      {
        closeModal: () => setSkipConfirmOpen(false),
      },
    );
  };

  const handleUndoSkip = () => {
    runTrackingAction(() =>
      undoSkipWorkoutAction({
        date: dayDetails.day.planDate,
      }),
    );
  };

  const handleSaveFeedback = () => {
    runTrackingAction(
      () =>
        saveWorkoutFeedbackAction({
          date: dayDetails.day.planDate,
          difficultyRating: feedbackDifficulty,
          painReported: feedbackPain,
          feedbackNote: feedbackNote.trim() || null,
        }),
      {
        closeModal: () => setReportOpen(false),
      },
    );
  };

  return (
    <ClientAuthGate>
      <ClientShell
        title={dayDetails.day.planDate}
        titleRowAction={calendarShortcut}
        headerTitleSize="compact"
      >
        <ClientPage className="space-y-4">
          {isPlanReadOnly ? (
            <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted-bg)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              Previous plans are read-only. Completion updates are disabled for this view.
            </p>
          ) : null}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1">
            {horizontalDates.map((day) => (
              <Link
                key={day.planDate}
                href={buildDayHref(day.planDate)}
                className={`min-w-[4.4rem] rounded-2xl border px-3 py-3 text-center ${
                  day.planDate === dayDetails.day.planDate
                    ? "border-[var(--color-primary)] bg-[rgba(214,31,44,0.08)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] bg-white text-[var(--color-text)]"
                }`}
              >
                <p className="text-xs font-medium">
                  {new Date(`${day.planDate}T00:00:00`).toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {new Date(`${day.planDate}T00:00:00`).getDate()}
                </p>
              </Link>
            ))}
          </div>

          <ClientCard className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {tracking.completedExercises} of {tracking.totalExercises} exercises completed
                </p>
                <Badge variant={getStatusVariant(tracking.status)}>
                  {getStatusLabel(tracking.status)}
                </Badge>
              </div>
              {!isPlanReadOnly && hasExercises ? (
                tracking.status === "skipped" ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)] disabled:opacity-50"
                    onClick={handleUndoSkip}
                    disabled={isPending}
                  >
                    <RotateCcw className="size-3.5 text-[var(--color-text-secondary)]" />
                    Undo Skip
                  </button>
                ) : tracking.status !== "completed" ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)] disabled:opacity-50"
                    onClick={() => setSkipConfirmOpen(true)}
                    disabled={isPending}
                  >
                    <SkipForward className="size-3.5 text-[var(--color-text-secondary)]" />
                    Skip Today
                  </button>
                ) : null
              ) : null}
            </div>
            <div className="mb-2 mt-2 h-2 rounded-full bg-[var(--color-muted-bg)]">
              <div
                className="h-2 rounded-full bg-[var(--color-primary)] transition-all"
                style={{ width: `${tracking.completionPercent}%` }}
              />
            </div>
            {tracking.status === "skipped" ? (
              <p className="text-sm text-[var(--color-text-secondary)]">
                Exercise controls are disabled until you undo skip.
              </p>
            ) : null}
            {dayDetails.day.workoutNotes ? (
              <p className="whitespace-pre-line text-sm text-[var(--color-text-secondary)]">
                {dayDetails.day.workoutNotes}
              </p>
            ) : null}
          </ClientCard>

          {message?.text ? (
            <p
              className={`rounded-2xl border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-[rgba(21,128,61,0.18)] bg-[rgba(21,128,61,0.08)] text-[var(--color-success)]"
                  : "border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.06)] text-[var(--color-primary)]"
              }`}
            >
              {message.text}
            </p>
          ) : null}

          <div
            role="tablist"
            aria-label="Daily plan sections"
            className="border-b border-[var(--color-border)] bg-white"
          >
            <div className="grid grid-cols-2">
              {(["workout", "nutrition"] as const).map((tabValue) => {
                const selected = selectedTab === tabValue;

                return (
                  <button
                    key={tabValue}
                    id={`${tabValue}-tab`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`${tabValue}-panel`}
                    onClick={() => handleTabChange(tabValue)}
                    className={`relative flex h-12 items-center justify-center px-4 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)] sm:h-14 ${
                      selected ? "font-semibold" : "font-medium"
                    }`}
                  >
                    <span>{tabValue === "workout" ? "Workout" : "Nutrition"}</span>
                    {selected ? (
                      <span className="absolute inset-x-5 bottom-0 h-[3px] rounded-full bg-[var(--color-primary)]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTab === "workout" ? (
            <div
              id="workout-panel"
              role="tabpanel"
              aria-labelledby="workout-tab"
              className="space-y-4"
            >
              {!hasExercises ? (
                <ClientCard className="space-y-2">
                  <h3 className="font-semibold text-[var(--color-text)]">Rest Day</h3>
                  <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                    No workout is scheduled for this day, so tracking controls are unavailable.
                  </p>
                </ClientCard>
              ) : (
                dayDetails.exercises.map((exercise) => {
                  const exerciseTracking = getExerciseTracking(tracking, exercise.id);
                  const completed = exerciseTracking?.completed ?? false;
                  const isExercisePending = isPending && pendingExerciseId === exercise.id;
                  const prescription = formatExercisePrescription(
                    exercise.defaultSets,
                    exercise.defaultRepetitionsOrDuration,
                  );

                  return (
                    <ClientCard
                      key={exercise.id}
                      className={`space-y-4 border ${
                        completed
                          ? "border-[rgba(21,128,61,0.24)] bg-[rgba(21,128,61,0.04)]"
                          : "border-[var(--color-border)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-16 shrink-0 items-center justify-center bg-[var(--color-muted-bg)]">
                          <div className="text-center">
                            <Dumbbell className="mx-auto size-5 text-[var(--color-primary)]" />
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                              {exercise.sequenceNumber}
                            </p>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-[var(--color-text)]">
                                {exercise.exerciseName}
                              </h3>
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                {formatExerciseCategory(exercise)}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-center gap-2">
                              <button
                                type="button"
                                aria-label={
                                  completed
                                    ? `Mark ${exercise.exerciseName} incomplete`
                                    : `Mark ${exercise.exerciseName} complete`
                                }
                                onClick={() =>
                                  handleExerciseCompletionToggle(exercise, !completed)
                                }
                                disabled={isReadOnly || isExercisePending || isPending}
                                className={`flex h-4 w-4 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)] ${
                                  completed
                                    ? "border-[var(--color-success)] bg-[var(--color-success)] text-white"
                                    : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]"
                                }`}
                              >
                                {isExercisePending ? (
                                  <LoaderCircle className="size-4 animate-spin" />
                                ) : completed ? (
                                  <CheckCircle2 className="size-4" />
                                ) : (
                                  <CircleDashed className="size-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                aria-label={`View instructions for ${exercise.exerciseName}`}
                                onClick={() => setInstructionExercise(exercise)}
                                className="flex bg-white text-[var(--color-text-secondary)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]"
                              >
                                <Info className="size-4" />
                              </button>
                            </div>
                          </div>
                          {prescription ? (
                            <Badge variant="outline">{prescription}</Badge>
                          ) : null}
                        </div>
                      </div>
                    </ClientCard>
                  );
                })
              )}
            </div>
          ) : (
            <div
              id="nutrition-panel"
              role="tabpanel"
              aria-labelledby="nutrition-tab"
              className="space-y-4"
            >
              <ClientCard className="space-y-3">
                <div className="flex items-center gap-2">
                  <Salad className="size-4 text-[var(--color-primary)]" />
                  <h3 className="font-semibold text-[var(--color-text)]">Daily Summary</h3>
                </div>
                <p className="whitespace-pre-line text-sm leading-6 text-[var(--color-text-secondary)]">
                  {DAILY_NUTRITION_SUMMARY}
                </p>
                {dayDetails.allergyRestrictionReminder ? (
                  <p className="whitespace-pre-line text-sm text-[var(--color-text-secondary)]">
                    {`ရှောင်ရန်:\n${dayDetails.allergyRestrictionReminder}`}
                  </p>
                ) : null}
              </ClientCard>

              {Object.entries(groupedMeals).map(([mealType, items]) => (
                <ClientCard key={mealType} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                    {mealType}
                  </p>
                  <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-[var(--color-muted-bg)] px-4 py-3"
                      >
                        <p className="font-medium text-[var(--color-text)]">{item.foodName}</p>
                        {item.servingDescription ? <p>{item.servingDescription}</p> : null}
                      </div>
                    ))}
                  </div>
                </ClientCard>
              ))}
            </div>
          )}
        </ClientPage>
      </ClientShell>
      <Modal
        open={Boolean(instructionExercise)}
        title={instructionExercise?.exerciseName || "Exercise instructions"}
        description="Stored workout instructions and database prescription"
        onClose={() => setInstructionExercise(null)}
      >
        <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
          <p className="whitespace-pre-line leading-6 text-[var(--color-text-secondary)]">
            {instructionExercise?.defaultInstructions}
          </p>
          <div className="space-y-2 rounded-2xl bg-[var(--color-muted-bg)] p-4">
            <p>
              Category: {instructionExercise ? formatExerciseCategory(instructionExercise) : "-"}
            </p>
            {instructionExercise ? (
              <p>
                Prescription:{" "}
                {formatExercisePrescription(
                  instructionExercise.defaultSets,
                  instructionExercise.defaultRepetitionsOrDuration,
                ) ?? "-"}
              </p>
            ) : null}
          </div>
        </div>
      </Modal>
      <Modal
        open={reportOpen}
        title="Report Difficulty or Pain"
        description="Save optional workout feedback for this day."
        onClose={() => setReportOpen(false)}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" className="w-full" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button className="w-full" onClick={handleSaveFeedback} disabled={isPending}>
              Save Feedback
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--color-text)]">Difficulty rating</p>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFeedbackDifficulty(value)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${
                    feedbackDifficulty === value
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-border)] bg-white text-[var(--color-text)]"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] p-4">
            <input
              type="checkbox"
              checked={feedbackPain}
              onChange={(event) => setFeedbackPain(event.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            <span className="text-sm font-medium text-[var(--color-text)]">
              Pain was reported during this workout
            </span>
          </label>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text)]">Feedback note</label>
            <Textarea
              value={feedbackNote}
              onChange={(event) => setFeedbackNote(event.target.value)}
              placeholder="Optional workout feedback"
            />
          </div>
        </div>
      </Modal>
      <Modal
        open={skipConfirmOpen}
        title="Skip Today?"
        description="This keeps the generated plan unchanged and records the day as skipped."
        onClose={() => setSkipConfirmOpen(false)}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setSkipConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="w-full"
              onClick={handleSkipWorkout}
              disabled={isPending}
            >
              Confirm Skip
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          Skipping today will save a workout session with skipped status and keep your generated
          plan intact.
        </p>
      </Modal>
    </ClientAuthGate>
  );
}
