import test from "node:test";
import assert from "node:assert/strict";

import {
  __testing__,
  assessmentSystemPrompt,
  buildAssessmentUserPrompt,
} from "@/lib/server/ai/assessment-prompt";

const { buildAssessmentPromptPayload } = __testing__;

test("user prompt includes only normalized assessment fields", () => {
  const prompt = buildAssessmentUserPrompt({
    age: 29,
    gender: "female",
    experienceLevel: null,
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

  assert.match(prompt, /currentLevel/);
  assert.doesNotMatch(prompt, /addressTerm/);
  assert.doesNotMatch(prompt, /fullName|email|userId|session/i);
});

test("no prompt instruction contains personal address terms", () => {
  assert.match(assessmentSystemPrompt, /Do not include personal address terms/i);
  assert.match(assessmentSystemPrompt, /Do not use အစ်ကို, အစ်မ, မောင်လေး, or ညီမလေး/i);
});

test("no prompt instruction repeatedly uses သင် or သင့်ရဲ့", () => {
  assert.match(assessmentSystemPrompt, /Avoid repeatedly using သင်, သင့်ရဲ့, or သင်၏/i);
});

test("nutrition advice prompt reflects actual disliked foods and restrictions", () => {
  assert.match(assessmentSystemPrompt, /mention actual allergies, restrictions, and disliked foods/i);
  assert.match(assessmentSystemPrompt, /say those items will be excluded from the future meal plan/i);
});

test("health advice prompt reflects only the supplied condition", () => {
  assert.match(assessmentSystemPrompt, /mention only conditions or injuries actually supplied/i);
  assert.match(assessmentSystemPrompt, /do not invent symptoms/i);
});

test("workout advice prompt requires recommendation plus reason", () => {
  assert.match(assessmentSystemPrompt, /begin with the selected Body Goal/i);
  assert.match(assessmentSystemPrompt, /explain why it suits the goal and current level/i);
});

test("unsupported body-composition claims are forbidden", () => {
  assert.match(assessmentSystemPrompt, /do not make unsupported body-composition claims from height and weight alone/i);
});

test("Burmese Unicode renders correctly in prompt payload", () => {
  const payload = buildAssessmentPromptPayload({
    age: 29,
    gender: "female",
    experienceLevel: null,
    measurements: {
      heightCm: "165",
      weightKg: "58.5",
      waistCm: "72",
      chestCm: "88",
      hipCm: "96",
      armCm: "29",
      thighCm: "54",
      bodyFatPercent: null,
    },
    bodyGoal: {
      id: 2,
      label: "Lean and Toned",
      description: "Build a leaner shape",
    },
    medicalConditions: ["asthma"],
    otherHealthCondition: "အစာအိမ်မကောင်းခြင်း",
    dislikedExercises: [],
    foodAllergies: [],
    foodRestrictions: [],
    dislikedFoods: ["Chocolate", "Milo"],
  });

  assert.equal(payload.medicalConditions[0], "ပန်းနာရင်ကျပ်");
  assert.equal(payload.otherHealthCondition, "အစာအိမ်မကောင်းခြင်း");
  assert.deepEqual(payload.dislikedFoods, ["Chocolate", "Milo"]);
});
