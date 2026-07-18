import { notFound } from "next/navigation";

import { CalendarScreen } from "@/components/client/screens/calendar-screen";
import { createAssessmentInputHash } from "@/lib/server/ai-assessment";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getAssessmentInputForUser } from "@/lib/server/repositories/ai-assessment-repository";
import { getActiveGeneratedPlanCalendarForUser } from "@/lib/server/repositories/generated-plan-repository";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>;
}) {
  const authUser = await requireAuthenticatedUser();
  const { planId } = await searchParams;
  const parsedPlanId =
    planId && Number.isInteger(Number(planId)) && Number(planId) > 0
      ? Number(planId)
      : null;
  const [planData, assessmentInput] = await Promise.all([
    getActiveGeneratedPlanCalendarForUser(authUser.userId, parsedPlanId ?? undefined),
    getAssessmentInputForUser(authUser.userId),
  ]);

  if (parsedPlanId !== null && !planData) {
    notFound();
  }

  const currentInputHash = assessmentInput
    ? createAssessmentInputHash(assessmentInput).inputHash
    : null;
  const isPlanOutdated = Boolean(
    currentInputHash &&
      planData?.plan.status === "active" &&
      planData.plan.sourceInputHash !== currentInputHash,
  );
  return (
    <CalendarScreen
      planData={planData}
      isPlanOutdated={isPlanOutdated}
    />
  );
}
