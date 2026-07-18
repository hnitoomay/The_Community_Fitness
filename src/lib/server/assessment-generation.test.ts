import test from "node:test";
import assert from "node:assert/strict";

import type { ClientAssessmentInput } from "@/types/client-onboarding";
import { generateAndStoreAssessment } from "@/lib/server/assessment-generation";

const baseInput: ClientAssessmentInput = {
  age: 29,
  gender: "female",
  measurements: {
    heightCm: "165",
    weightKg: "58.5",
    waistCm: "72",
    chestCm: "88",
    hipCm: "96",
    armCm: "29",
    thighCm: "54",
    bodyFatPercent: "24.5",
  },
  bodyGoal: {
    id: 2,
    label: "Lean and Toned",
    description: "Build a leaner shape",
  },
  medicalConditions: ["asthma"],
  otherHealthCondition: null,
  dislikedExercises: ["Burpee"],
  foodAllergies: ["Egg"],
  foodRestrictions: ["Halal"],
  dislikedFoods: ["Soda"],
};

test("invalid AI output is not saved", async () => {
  let insertCallCount = 0;

  await assert.rejects(
    generateAndStoreAssessment("user_1234", {
      getAssessmentInputForUser: async () => baseInput,
      generateAiAssessment: async () => {
        throw new Error("INVALID_AI_OUTPUT");
      },
      insertAiAssessment: async () => {
        insertCallCount += 1;
        throw new Error("should not run");
      },
    }),
  );

  assert.equal(insertCallCount, 0);
});
