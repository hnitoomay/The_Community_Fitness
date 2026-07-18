"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, CircleAlert, History, Pencil, Ruler } from "lucide-react";

import { getMeasurementProgressTone, formatSignedDifference } from "@/lib/measurement-progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ClientAuthGate } from "@/components/client/client-auth-gate";
import { ClientCard } from "@/components/client/client-card";
import { ClientPage } from "@/components/client/client-page";
import { ClientShell } from "@/components/client/client-shell";
import { HistoryTabButton } from "@/components/client/history-tab-button";
import type {
  GeneratedPlanHistoryEntry,
  MeasurementHistoryEntry,
  MeasurementProgressSummary,
} from "@/types/progress-history";
import type { WorkoutHistoryEntry } from "@/types/workout-tracking";

type HistoryTab = "workouts" | "plans" | "measurements";

interface HistoryScreenProps {
  workoutHistory: WorkoutHistoryEntry[];
  planHistory: GeneratedPlanHistoryEntry[];
  measurementHistory: {
    goalLabel: string | null;
    entries: MeasurementHistoryEntry[];
    summary: MeasurementProgressSummary | null;
  };
}

function formatWorkoutStatus(status: WorkoutHistoryEntry["status"]) {
  switch (status) {
    case "completed":
      return "Completed";
    case "skipped":
      return "Skipped";
    default:
      return "In progress";
  }
}

function formatPlanStatus(status: GeneratedPlanHistoryEntry["status"]) {
  switch (status) {
    case "active":
      return "Active";
    case "archived":
      return "Previous";
    default:
      return "Failed";
  }
}

function formatDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateRange(startDate: string, endDate: string) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function getChangeClassName(tone: "positive" | "negative" | "neutral") {
  switch (tone) {
    case "positive":
      return "text-[var(--color-success)]";
    case "negative":
      return "text-[var(--color-primary)]";
    default:
      return "text-[var(--color-text-secondary)]";
  }
}

export function HistoryScreen({
  workoutHistory,
  planHistory,
  measurementHistory,
}: HistoryScreenProps) {
  const [tab, setTab] = useState<HistoryTab>("workouts");
  const [showFailedPlans, setShowFailedPlans] = useState(false);
  const failedPlanCount = useMemo(
    () => planHistory.filter((record) => record.status === "failed").length,
    [planHistory],
  );

  const visiblePlanHistory = useMemo(
    () =>
      planHistory.filter((record) => showFailedPlans || record.status !== "failed"),
    [planHistory, showFailedPlans],
  );

  return (
    <ClientAuthGate>
      <ClientShell title="History" subtitle="Workout records, plan versions, and measurements.">
        <ClientPage className="space-y-4">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[var(--color-muted-bg)] p-1">
            <HistoryTabButton
              label="Workout History"
              selected={tab === "workouts"}
              onClick={() => setTab("workouts")}
            />
            <HistoryTabButton
              label="Plan History"
              selected={tab === "plans"}
              onClick={() => setTab("plans")}
            />
            <HistoryTabButton
              label="Measurement History"
              selected={tab === "measurements"}
              onClick={() => setTab("measurements")}
            />
          </div>

          {tab === "workouts" ? (
            workoutHistory.length ? (
              <div className="space-y-3">
                {workoutHistory.map((record) => (
                  <ClientCard key={`${record.sessionId}-${record.planDate}`} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">
                          {record.workoutFocusCategory}
                        </p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {record.planDate}
                        </p>
                      </div>
                      <Badge
                        variant={
                          record.status === "completed"
                            ? "success"
                            : record.status === "skipped"
                              ? "warning"
                              : "outline"
                        }
                      >
                        {formatWorkoutStatus(record.status)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-[var(--color-text-secondary)]">
                      <p>
                        Progress: {record.completedExercises} of {record.totalExercises}
                      </p>
                      <p>
                        Duration:{" "}
                        {record.estimatedDurationMinutes === null
                          ? "Not specified"
                          : `${record.estimatedDurationMinutes} mins`}
                      </p>
                      <p>
                        Difficulty:{" "}
                        {record.difficultyRating === null
                          ? "Not rated"
                          : `${record.difficultyRating}/5`}
                      </p>
                      <p>Pain reported: {record.painReported ? "Yes" : "No"}</p>
                    </div>
                  </ClientCard>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={History}
                title="No workout history yet"
                description="Completed or skipped sessions will appear here once tracking starts."
              />
            )
          ) : null}

          {tab === "plans" ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Generated plans are preserved by version. Previous plans stay read-only.
                </p>
                <button
                  type="button"
                  onClick={() => setShowFailedPlans((current) => !current)}
                  className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center  transition focus-visible:outline-none ${
                    showFailedPlans
                      ? "border-[rgba(214,31,44,0.28)] bg-[rgba(214,31,44,0.08)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]"
                  }`}
                  aria-label={
                    showFailedPlans
                      ? "Hide failed plan attempts"
                      : "Show failed plan attempts"
                  }
                  title={
                    showFailedPlans
                      ? "Hide failed plan attempts"
                      : "Show failed plan attempts"
                  }
                >
                  <CircleAlert className="size-5" />
                  {failedPlanCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-semibold leading-4 text-white">
                      {failedPlanCount}
                    </span>
                  ) : null}
                </button>
              </div>
              {visiblePlanHistory.length ? (
                <div className="space-y-3">
                  {visiblePlanHistory.map((record) => (
                    <ClientCard key={record.planId} className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--color-text)]">
                            {formatDateRange(record.startDate, record.endDate)}
                          </p>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            Goal: {record.bodyGoalLabel}
                          </p>
                        </div>
                        <Badge
                          variant={
                            record.status === "active"
                              ? "success"
                              : record.status === "failed"
                                ? "warning"
                                : "outline"
                          }
                        >
                          {formatPlanStatus(record.status)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-[var(--color-text-secondary)]">
                        <p>Created: {formatDate(record.createdAt)}</p>
                        <p>
                          Completed workouts: {record.completedWorkoutCount} of{" "}
                          {record.totalScheduledWorkoutCount}
                        </p>
                      </div>
                      {record.status === "failed" ? (
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          Failed attempts are preserved for history but cannot be opened as active
                          calendars.
                        </p>
                      ) : (
                        <Link
                          href={
                            record.status === "active"
                              ? "/calendar"
                              : `/calendar?planId=${record.planId}`
                          }
                          className="text-sm font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
                        >
                          View Plan
                        </Link>
                      )}
                    </ClientCard>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Activity}
                  title="No stored plans yet"
                  description="Generated monthly plans will appear here as active, previous, or failed versions."
                />
              )}
            </>
          ) : null}

          {tab === "measurements" ? (
            measurementHistory.entries.length ? (
              <div className="space-y-3">
                {measurementHistory.summary ? (
                  <ClientCard className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                          Progress Summary
                        </p>
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                          {measurementHistory.summary.measurementCount} measurement records
                        </h2>
                      </div>
                      <Link
                        href="/measurements/new"
                        aria-label="Update Measurements"
                        className="flex h-7 w-7 items-center justify-center rounded bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]"
                      >
                        <Pencil className="size-4 text-white" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-[var(--color-muted-bg)] p-4">
                        <p className="text-[var(--color-text-secondary)]">Weight</p>
                        <p className="mt-1 font-medium text-[var(--color-text)]">
                          {measurementHistory.summary.firstWeightKg} kg →{" "}
                          {measurementHistory.summary.latestWeightKg} kg
                        </p>
                        <p
                          className={`mt-1 ${getChangeClassName(
                            getMeasurementProgressTone({
                              goalLabel: measurementHistory.goalLabel,
                              metric: "weight",
                              change: measurementHistory.summary.totalWeightChangeKg,
                            }),
                          )}`}
                        >
                          {formatSignedDifference(
                            measurementHistory.summary.totalWeightChangeKg,
                            "kg",
                          )}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[var(--color-muted-bg)] p-4">
                        <p className="text-[var(--color-text-secondary)]">Waist</p>
                        <p className="mt-1 font-medium text-[var(--color-text)]">
                          {measurementHistory.summary.firstWaistCm} cm →{" "}
                          {measurementHistory.summary.latestWaistCm} cm
                        </p>
                        <p
                          className={`mt-1 ${getChangeClassName(
                            getMeasurementProgressTone({
                              goalLabel: measurementHistory.goalLabel,
                              metric: "waist",
                              change: measurementHistory.summary.totalWaistChangeCm,
                            }),
                          )}`}
                        >
                          {formatSignedDifference(
                            measurementHistory.summary.totalWaistChangeCm,
                            "cm",
                          )}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[var(--color-muted-bg)] p-4">
                        <p className="text-[var(--color-text-secondary)]">Body Fat</p>
                        <p className="mt-1 font-medium text-[var(--color-text)]">
                          {measurementHistory.summary.firstBodyFatPercentage === null
                            ? "Not available"
                            : `${measurementHistory.summary.firstBodyFatPercentage}%`}{" "}
                          →{" "}
                          {measurementHistory.summary.latestBodyFatPercentage === null
                            ? "Not available"
                            : `${measurementHistory.summary.latestBodyFatPercentage}%`}
                        </p>
                        <p
                          className={`mt-1 ${getChangeClassName(
                            getMeasurementProgressTone({
                              goalLabel: measurementHistory.goalLabel,
                              metric: "bodyFat",
                              change: measurementHistory.summary.totalBodyFatChangePercent,
                            }),
                          )}`}
                        >
                          {formatSignedDifference(
                            measurementHistory.summary.totalBodyFatChangePercent,
                            "%",
                          ) ?? "No comparable body-fat change"}
                        </p>
                      </div>
                    </div>
                  </ClientCard>
                ) : null}

                {measurementHistory.entries.map((record) => (
                  <ClientCard key={record.id} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">
                          {formatDate(record.measuredAt)}
                        </p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          Weight: {record.weightKg} kg
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-[var(--color-text-secondary)]">
                      <p>Waist: {record.waistCm} cm</p>
                      <p>Chest: {record.chestCm} cm</p>
                      <p>Hip: {record.hipCm} cm</p>
                      <p>Arm: {record.armCm} cm</p>
                      <p>Thigh: {record.thighCm} cm</p>
                      <p>
                        Body Fat:{" "}
                        {record.bodyFatPercentage === null
                          ? "Not available"
                          : `${record.bodyFatPercentage}%`}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <p
                        className={getChangeClassName(
                          getMeasurementProgressTone({
                            goalLabel: measurementHistory.goalLabel,
                            metric: "weight",
                            change: record.weightChangeKg,
                          }),
                        )}
                      >
                        Weight: {formatSignedDifference(record.weightChangeKg, "kg") ?? "N/A"}
                      </p>
                      <p
                        className={getChangeClassName(
                          getMeasurementProgressTone({
                            goalLabel: measurementHistory.goalLabel,
                            metric: "waist",
                            change: record.waistChangeCm,
                          }),
                        )}
                      >
                        Waist: {formatSignedDifference(record.waistChangeCm, "cm") ?? "N/A"}
                      </p>
                      <p
                        className={getChangeClassName(
                          getMeasurementProgressTone({
                            goalLabel: measurementHistory.goalLabel,
                            metric: "bodyFat",
                            change: record.bodyFatChangePercent,
                          }),
                        )}
                      >
                        Body Fat:{" "}
                        {formatSignedDifference(record.bodyFatChangePercent, "%") ?? "N/A"}
                      </p>
                    </div>
                  </ClientCard>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Ruler}
                title="No measurement history yet"
                description="Measurement snapshots will appear here as the client continues checking progress."
              />
            )
          ) : null}
        </ClientPage>
      </ClientShell>
    </ClientAuthGate>
  );
}
