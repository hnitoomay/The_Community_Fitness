"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

import {
  initialGenerateAssessmentActionState,
  initialGeneratePlanActionState,
} from "@/app/(client)/assessment/action-state";
import {
  generateAssessmentAction,
  generatePlanAction,
} from "@/app/(client)/assessment/actions";
import {
  assessmentGenerationStages,
  planGenerationStages,
} from "@/data/ai-assessment-content";
import {
  resolveAssessmentPrimaryAction,
  resolveAssessmentViewState,
} from "@/lib/assessment-view-state";
import {
  isCurrentAssessmentContent,
  type AssessmentProfileSummaryRow,
} from "@/lib/assessment-profile-summary";
import { ClientAuthGate } from "@/components/client/client-auth-gate";
import { ClientCard } from "@/components/client/client-card";
import { ClientPage } from "@/components/client/client-page";
import { ClientShell } from "@/components/client/client-shell";
import { GenerationProgress } from "@/components/client/generation-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AiAssessmentRecord,
  CurrentAiAssessmentContent,
} from "@/types/client-onboarding";

const STAGE_DELAY_MS = 650;
const OUTDATED_PLAN_MESSAGE =
  "ဒီ Plan သည် ယခင် Profile နှင့် Measurement အချက်အလက်များအပေါ် အခြေခံထားပါသည်။";

interface AssessmentScreenProps {
  profileSummaryRows: AssessmentProfileSummaryRow[];
  latestAssessment: AiAssessmentRecord | null;
  isOutdated: boolean;
  canGenerate: boolean;
  canGeneratePlan: boolean;
  isPlanOutdated: boolean;
  hasCurrentPlan: boolean;
  loadError?: string;
}

function formatGeneratedDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("my-MM", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function playStages(
  setActiveStageIndex: (value: number) => void,
  stageCount: number,
) {
  for (let index = 0; index < stageCount; index += 1) {
    setActiveStageIndex(index);
    await new Promise((resolve) => window.setTimeout(resolve, STAGE_DELAY_MS));
  }
}

export function AssessmentScreen({
  profileSummaryRows,
  latestAssessment,
  isOutdated,
  canGenerate,
  canGeneratePlan,
  isPlanOutdated,
  hasCurrentPlan,
  loadError,
}: AssessmentScreenProps) {
  const router = useRouter();
  const [assessmentActionState, setAssessmentActionState] = useState(
    initialGenerateAssessmentActionState,
  );
  const [planActionState, setPlanActionState] = useState(initialGeneratePlanActionState);
  const [isAssessmentPending, startAssessmentTransition] = useTransition();
  const [isPlanPending, startPlanTransition] = useTransition();
  const [loadingMode, setLoadingMode] = useState<"assessment" | "plan" | null>(null);
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  let currentAssessment: CurrentAiAssessmentContent | null = null;

  if (latestAssessment && isCurrentAssessmentContent(latestAssessment.assessment)) {
    currentAssessment = latestAssessment.assessment;
  }

  const hasCurrentAssessment = Boolean(currentAssessment);
  const viewState = resolveAssessmentViewState({
    latestAssessment,
    isOutdated,
    hasCurrentAssessment,
  });
  const primaryAction = resolveAssessmentPrimaryAction({
    viewState,
    canGenerateAssessment: canGenerate,
    canGeneratePlan,
    hasCurrentPlan,
    isPlanOutdated,
  });
  const isBusy = isAssessmentPending || isPlanPending;

  const handleGenerateAssessment = () => {
    if (primaryAction.kind !== "assessment" || isBusy) {
      return;
    }

    setAssessmentActionState(initialGenerateAssessmentActionState);
    setPlanActionState(initialGeneratePlanActionState);
    setLoadingMode("assessment");

    startAssessmentTransition(async () => {
      await playStages(setActiveStageIndex, assessmentGenerationStages.length);
      const result = await generateAssessmentAction();
      setAssessmentActionState(result);
      setLoadingMode(null);

      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleGeneratePlan = () => {
    if (primaryAction.kind !== "plan" || isBusy) {
      return;
    }

    setPlanActionState(initialGeneratePlanActionState);
    setAssessmentActionState(initialGenerateAssessmentActionState);
    setLoadingMode("plan");

    startPlanTransition(async () => {
      await playStages(setActiveStageIndex, planGenerationStages.length);
      const result = await generatePlanAction();
      setPlanActionState(result);
      setLoadingMode(null);

      if (result.success) {
        router.refresh();
        router.push("/calendar");
      }
    });
  };

  return (
    <ClientAuthGate>
      <ClientShell
        title="Assessment"
        subtitle="Review your latest inputs, assessment status, and next step."
      >
        <ClientPage className="space-y-4">
          {loadError ? (
            <p className="rounded-2xl border border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.06)] px-4 py-3 text-sm text-[var(--color-primary)]">
              {loadError}
            </p>
          ) : null}
          {assessmentActionState.message && !assessmentActionState.success ? (
            <p className="rounded-2xl border border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.06)] px-4 py-3 text-sm text-[var(--color-primary)]">
              {assessmentActionState.message}
            </p>
          ) : null}
          {planActionState.message && !planActionState.success ? (
            <p className="rounded-2xl border border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.06)] px-4 py-3 text-sm text-[var(--color-primary)]">
              {planActionState.message}
            </p>
          ) : null}

          {loadingMode ? (
            <ClientCard className="space-y-5">
              <div className="space-y-2">
                <Badge>{loadingMode === "plan" ? "Plan Generation" : "AI Generation"}</Badge>
                <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
                  {loadingMode === "plan"
                    ? "Generating your updated one-month plan"
                    : "Generating your updated assessment"}
                </h2>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  {loadingMode === "plan"
                    ? "The old active plan stays available until the new plan is saved successfully."
                    : "Workout, nutrition, and health recommendations are being prepared."}
                </p>
              </div>
              <GenerationProgress
                activeStageIndex={activeStageIndex}
                stages={
                  loadingMode === "plan"
                    ? planGenerationStages
                    : assessmentGenerationStages
                }
              />
            </ClientCard>
          ) : null}

          <ClientCard className="space-y-4">
            <div className="space-y-1 mb-2">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Your Profile Summary
              </h2>
            </div>
            <div className="space-y-3">
              {profileSummaryRows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                    {row.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text)]">{row.value}</p>
                </div>
              ))}
            </div>
          </ClientCard>

          <ClientCard className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[rgba(214,31,44,0.08)] text-[var(--color-primary)]">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  Assessment Status
                </h2>
                {viewState.message ? (
                  <div className=" mb-2 px-4 py-3 text-sm text-[var(--color-primary)]">
                    *{viewState.message}*
                  </div>
                ) : null}
                {latestAssessment ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <CalendarClock className="size-4" />
                    <span>Generated: {formatGeneratedDate(latestAssessment.createdAt)}</span>
                    {viewState.outdated ? (
                      <Badge variant="outline">Outdated</Badge>
                    ) : (
                      <Badge variant="success">Current</Badge>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {primaryAction.kind === "assessment" ? (
              <Button
                size="lg"
                className="w-full"
                onClick={handleGenerateAssessment}
                disabled={!canGenerate || isBusy}
                loading={isAssessmentPending}
              >
                {isAssessmentPending ? "Generating..." : primaryAction.label}
              </Button>
            ) : null}
          </ClientCard>

          {currentAssessment ? (
            <>
              <ClientCard className="space-y-3">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  Workout Advice
                </h2>
                <p className="whitespace-pre-line text-sm leading-6 text-[var(--color-text-secondary)]">
                  {currentAssessment.workoutAdvice}
                </p>
              </ClientCard>
              <ClientCard className="space-y-3">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  Nutrition Advice
                </h2>
                <p className="whitespace-pre-line text-sm leading-6 text-[var(--color-text-secondary)]">
                  {currentAssessment.nutritionAdvice}
                </p>
              </ClientCard>
              <ClientCard className="space-y-3">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  Health Advice
                </h2>
                <p className="whitespace-pre-line text-sm leading-6 text-[var(--color-text-secondary)]">
                  {currentAssessment.healthAdvice}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <span>Generated: {formatGeneratedDate(latestAssessment?.createdAt ?? "")}</span>
                  {viewState.outdated ? <Badge variant="outline">Outdated</Badge> : null}
                </div>
              </ClientCard>
            </>
          ) : null}

          {viewState.kind === "current" && isPlanOutdated ? (
            <ClientCard className="space-y-3 border-[rgba(214,31,44,0.18)] bg-[rgba(214,31,44,0.04)]">
              <Badge variant="outline">Outdated Plan</Badge>
              <p className="text-sm leading-6 text-[var(--color-text)]">
                {OUTDATED_PLAN_MESSAGE}
              </p>
            </ClientCard>
          ) : null}

          {primaryAction.kind === "plan" ? (
            <Button
              size="lg"
              className="w-full"
              onClick={handleGeneratePlan}
              disabled={!canGeneratePlan || isBusy}
              loading={isPlanPending}
            >
              {isPlanPending ? "Generating..." : primaryAction.label}
            </Button>
          ) : null}

          {primaryAction.kind === "calendar" ? (
            <Link href="/calendar">
              <Button size="lg" className="w-full">
                {primaryAction.label}
              </Button>
            </Link>
          ) : null}
        </ClientPage>
      </ClientShell>
    </ClientAuthGate>
  );
}
