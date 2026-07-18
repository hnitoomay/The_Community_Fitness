import "server-only";

import {
  createAssessmentInputHash,
  generateAiAssessment,
} from "@/lib/server/ai-assessment";
import {
  getAssessmentInputForUser,
  insertAiAssessment,
} from "@/lib/server/repositories/ai-assessment-repository";

interface AssessmentGenerationDependencies {
  getAssessmentInputForUser: typeof getAssessmentInputForUser;
  generateAiAssessment: typeof generateAiAssessment;
  insertAiAssessment: typeof insertAiAssessment;
}

const defaultDependencies: AssessmentGenerationDependencies = {
  getAssessmentInputForUser,
  generateAiAssessment,
  insertAiAssessment,
};

export async function generateAndStoreAssessment(
  userId: string,
  dependencies: AssessmentGenerationDependencies = defaultDependencies,
) {
  const assessmentInput = await dependencies.getAssessmentInputForUser(userId);

  if (!assessmentInput) {
    return {
      ok: false as const,
      reason: "missing-profile" as const,
    };
  }

  const { normalizedInput, inputHash } = createAssessmentInputHash(assessmentInput);
  const generated = await dependencies.generateAiAssessment(normalizedInput);

  await dependencies.insertAiAssessment({
    userId,
    bodyGoalId: normalizedInput.bodyGoal.id,
    profileSnapshot: normalizedInput,
    inputHash,
    assessment: generated.assessment,
    language: "my",
    modelName: generated.modelName,
  });

  return {
    ok: true as const,
  };
}
