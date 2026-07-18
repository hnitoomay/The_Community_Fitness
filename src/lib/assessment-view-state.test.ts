import assert from "node:assert/strict";
import test from "node:test";

import { __testing__ } from "@/lib/assessment-view-state";

const {
  resolveAssessmentPrimaryAction,
  resolveAssessmentViewState,
} = __testing__;

test("no assessment state shows the initial message and assessment action", () => {
  const viewState = resolveAssessmentViewState({
    latestAssessment: null,
    isOutdated: false,
    hasCurrentAssessment: false,
  });
  const primaryAction = resolveAssessmentPrimaryAction({
    viewState,
    canGenerateAssessment: true,
    canGeneratePlan: false,
    hasCurrentPlan: false,
    isPlanOutdated: false,
  });

  assert.equal(viewState.kind, "none");
  assert.equal(viewState.message, "AI အကြံပြုချက် မရှိသေးပါ။");
  assert.equal(primaryAction.kind, "assessment");
  assert.equal(primaryAction.label, "AI အကြံပြုချက် ရယူမည်");
});

test("current assessment state removes duplicate assessment regeneration actions", () => {
  const viewState = resolveAssessmentViewState({
    latestAssessment: {
      id: 1,
      userId: "user_1234",
      bodyGoalId: 2,
      profileSnapshot: {
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
        medicalConditions: [],
        otherHealthCondition: null,
        dislikedExercises: [],
        foodAllergies: [],
        foodRestrictions: [],
        dislikedFoods: [],
      },
      inputHash: "same-hash",
      assessment: {
        workoutAdvice: "a",
        nutritionAdvice: "b",
        healthAdvice: "c",
      },
      language: "my",
      modelName: "model",
      createdAt: "2026-07-10T00:00:00.000Z",
    },
    isOutdated: false,
    hasCurrentAssessment: true,
  });

  const primaryAction = resolveAssessmentPrimaryAction({
    viewState,
    canGenerateAssessment: true,
    canGeneratePlan: true,
    hasCurrentPlan: false,
    isPlanOutdated: true,
  });

  assert.equal(viewState.kind, "current");
  assert.equal(viewState.message, null);
  assert.equal(viewState.actionLabel, null);
  assert.equal(primaryAction.kind, "plan");
  assert.equal(primaryAction.label, "Generate Updated One-Month Plan");
});

test("outdated assessment state keeps the previous assessment but makes regeneration the next step", () => {
  const viewState = resolveAssessmentViewState({
    latestAssessment: {
      id: 1,
      userId: "user_1234",
      bodyGoalId: 2,
      profileSnapshot: {
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
        medicalConditions: [],
        otherHealthCondition: null,
        dislikedExercises: [],
        foodAllergies: [],
        foodRestrictions: [],
        dislikedFoods: [],
      },
      inputHash: "old-hash",
      assessment: {
        workoutAdvice: "a",
        nutritionAdvice: "b",
        healthAdvice: "c",
      },
      language: "my",
      modelName: "model",
      createdAt: "2026-07-10T00:00:00.000Z",
    },
    isOutdated: true,
    hasCurrentAssessment: true,
  });
  const primaryAction = resolveAssessmentPrimaryAction({
    viewState,
    canGenerateAssessment: true,
    canGeneratePlan: false,
    hasCurrentPlan: true,
    isPlanOutdated: true,
  });

  assert.equal(viewState.kind, "outdated");
  assert.equal(
    viewState.message,
    "Get new AI assessment for updated measurement",
  );
  assert.equal(primaryAction.kind, "assessment");
  assert.equal(primaryAction.label, "AI အကြံပြုချက်အသစ် ရယူမည်");
});

test("current assessment with a current plan prefers viewing the current plan", () => {
  const primaryAction = resolveAssessmentPrimaryAction({
    viewState: {
      kind: "current",
      message: null,
      actionLabel: null,
      outdated: false,
    },
    canGenerateAssessment: true,
    canGeneratePlan: true,
    hasCurrentPlan: true,
    isPlanOutdated: false,
  });

  assert.equal(primaryAction.kind, "calendar");
  assert.equal(primaryAction.label, "View Current Plan");
});
