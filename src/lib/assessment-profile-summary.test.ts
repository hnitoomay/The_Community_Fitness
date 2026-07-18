import test from "node:test";
import assert from "node:assert/strict";

import { __testing__ } from "@/lib/assessment-profile-summary";

const {
  EMPTY_VALUE_LABEL,
  buildAssessmentProfileSummary,
  getAssessmentAddressTerm,
  getAssessmentPrimaryActionLabel,
  isAssessmentOutdated,
  isCurrentAssessmentContent,
} = __testing__;

test("profile summary uses saved database-shaped assessment input and shows latest measurement values", () => {
  const rows = buildAssessmentProfileSummary({
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
  });

  assert.equal(rows[0]?.label, "အရပ်နှင့် ကိုယ်အလေးချိန်");
  assert.match(rows[0]?.value ?? "", /165 cm/);
  assert.match(rows[0]?.value ?? "", /58.5 kg/);
  assert.equal(rows[1]?.label, "Body Fat Percentage");
  assert.equal(rows[1]?.value, "24.5%");
});

test("empty optional health and preference values display မရှိ", () => {
  const rows = buildAssessmentProfileSummary({
    age: 34,
    gender: "male",
    measurements: {
      heightCm: "170",
      weightKg: "81",
      waistCm: "84",
      chestCm: "98",
      hipCm: "95",
      armCm: "33",
      thighCm: "56",
      bodyFatPercent: null,
    },
    bodyGoal: {
      id: 6,
      label: "Strength Focus",
      description: "Increase force output",
    },
    medicalConditions: [],
    otherHealthCondition: null,
    dislikedExercises: [],
    foodAllergies: [],
    foodRestrictions: [],
    dislikedFoods: [],
  });

  assert.equal(rows.find((row) => row.label === "ကျန်းမာရေးအခြေအနေ")?.value, EMPTY_VALUE_LABEL);
  assert.equal(
    rows.find((row) => row.label === "မကြိုက်သော လေ့ကျင့်ခန်းများ")?.value,
    EMPTY_VALUE_LABEL,
  );
  assert.equal(
    rows.find((row) => row.label === "အစားအသောက်ဓာတ်မတည့်မှု")?.value,
    EMPTY_VALUE_LABEL,
  );
});

test("profile changes mark an old assessment as outdated", () => {
  assert.equal(isAssessmentOutdated("old-hash", "new-hash"), true);
  assert.equal(isAssessmentOutdated("same-hash", "same-hash"), false);
});

test("primary action labels match the assessment state", () => {
  assert.equal(getAssessmentPrimaryActionLabel(false, false), "AI အကြံပြုချက် ရယူမည်");
  assert.equal(getAssessmentPrimaryActionLabel(true, true), "AI အကြံပြုချက် ပြန်လည်ရယူမည်");
});

test("unknown gender falls back to သင်", () => {
  assert.equal(getAssessmentAddressTerm("male"), "အစ်ကို");
  assert.equal(getAssessmentAddressTerm("female"), "အစ်မ");
  assert.equal(getAssessmentAddressTerm("other"), "သင်");
});

test("current assessment content type guard accepts the new three-card shape only", () => {
  assert.equal(
    isCurrentAssessmentContent({
      workoutAdvice: "a",
      nutritionAdvice: "b",
      healthAdvice: "c",
    }),
    true,
  );
  assert.equal(isCurrentAssessmentContent({ coachingAdvice: "old" }), false);
});
