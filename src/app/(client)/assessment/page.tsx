import { AssessmentScreen } from "@/components/client/screens/assessment-screen";
import {
  buildAssessmentProfileSummary,
  isAssessmentOutdated,
} from "@/lib/assessment-profile-summary";
import { createAssessmentInputHash } from "@/lib/server/ai-assessment";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  getAssessmentInputForUser,
  getLatestAiAssessmentForUser,
} from "@/lib/server/repositories/ai-assessment-repository";
import {
  getActiveGeneratedPlanCalendarForUser,
  getPlanGenerationContext,
} from "@/lib/server/repositories/generated-plan-repository";

export default async function AssessmentPage() {
  const authUser = await requireAuthenticatedUser();
  const [assessmentInput, latestAssessment, planContext, activePlan] = await Promise.all([
    getAssessmentInputForUser(authUser.userId),
    getLatestAiAssessmentForUser(authUser.userId),
    getPlanGenerationContext(authUser.userId),
    getActiveGeneratedPlanCalendarForUser(authUser.userId),
  ]);
  const hasOpenRouterConfig = Boolean(
    process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL,
  );

  if (!assessmentInput) {
    return (
      <AssessmentScreen
        profileSummaryRows={[]}
        latestAssessment={latestAssessment}
        isOutdated={false}
        canGenerate={false}
        canGeneratePlan={false}
        isPlanOutdated={false}
        hasCurrentPlan={false}
        loadError="Profile data is incomplete."
      />
    );
  }

  const { normalizedInput, inputHash } = createAssessmentInputHash(assessmentInput);
  const isAssessmentCurrent = latestAssessment?.inputHash === inputHash;
  const hasPlanPrerequisites = Boolean(
    planContext?.bodyGoal.id &&
      planContext.workoutTemplate.id &&
      planContext.nutritionTemplate.id &&
      planContext.workoutTemplate.days.length === 7,
  );
  const isPlanOutdated = Boolean(
    activePlan?.plan.sourceInputHash && activePlan.plan.sourceInputHash !== inputHash,
  );
  const hasCurrentPlan = Boolean(
    activePlan?.plan.sourceInputHash && activePlan.plan.sourceInputHash === inputHash,
  );

  return (
    <AssessmentScreen
      profileSummaryRows={buildAssessmentProfileSummary(normalizedInput)}
      latestAssessment={latestAssessment}
      isOutdated={isAssessmentOutdated(latestAssessment?.inputHash, inputHash)}
      canGenerate={hasOpenRouterConfig}
      canGeneratePlan={hasOpenRouterConfig && hasPlanPrerequisites && isAssessmentCurrent}
      isPlanOutdated={isPlanOutdated}
      hasCurrentPlan={hasCurrentPlan}
      loadError={hasOpenRouterConfig ? undefined : "OpenRouter AI is not configured."}
    />
  );
}
