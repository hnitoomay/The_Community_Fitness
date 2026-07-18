import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { assessmentSystemPrompt } from "@/lib/server/ai/assessment-prompt";
import { __testing__ } from "@/lib/server/ai-assessment";

const { createAssessmentInputHash, isLegacyAssessmentContent, normalizeAssessmentInput } =
  __testing__;
const projectRoot = process.cwd();

test("assessment input normalization trims, deduplicates, and sorts arrays", () => {
  const normalized = normalizeAssessmentInput({
    age: 29,
    gender: " female ",
    experienceLevel: " beginner ",
    measurements: {
      heightCm: "170.00",
      weightKg: "81.0",
      waistCm: "84",
      chestCm: "98.0",
      hipCm: "95",
      armCm: "33.00",
      thighCm: "56",
      bodyFatPercent: "",
    },
    bodyGoal: {
      id: 3,
      label: " General Fitness ",
      description: " Improve energy ",
    },
    medicalConditions: ["asthma", "asthma", " diabetes "],
    otherHealthCondition: " ",
    dislikedExercises: ["Burpee", " burpee ", "Squat Jump"],
    foodAllergies: ["Egg", " egg "],
    foodRestrictions: [" Halal ", "halal"],
    dislikedFoods: ["Mayo", "mayo", " Soda "],
  });

  assert.equal(normalized.experienceLevel, "beginner");
  assert.deepEqual(normalized.medicalConditions, ["asthma", "diabetes"]);
  assert.equal(normalized.measurements.weightKg, "81");
});

test("assessment input hash is stable for equivalent normalized values", () => {
  const first = createAssessmentInputHash({
    age: 29,
    gender: "female",
    experienceLevel: null,
    measurements: {
      heightCm: "170",
      weightKg: "81.00",
      waistCm: "84",
      chestCm: "98",
      hipCm: "95",
      armCm: "33",
      thighCm: "56",
      bodyFatPercent: "",
    },
    bodyGoal: {
      id: 3,
      label: "General Fitness",
      description: "Improve energy",
    },
    medicalConditions: ["diabetes", "asthma"],
    otherHealthCondition: null,
    dislikedExercises: ["Burpee", "Squat Jump"],
    foodAllergies: ["Egg"],
    foodRestrictions: ["Halal"],
    dislikedFoods: ["Soda"],
  });
  const second = createAssessmentInputHash({
    age: 29,
    gender: " female ",
    experienceLevel: "",
    measurements: {
      heightCm: "170.0",
      weightKg: "81",
      waistCm: "84.00",
      chestCm: "98.0",
      hipCm: "95",
      armCm: "33.00",
      thighCm: "56",
      bodyFatPercent: null,
    },
    bodyGoal: {
      id: 3,
      label: " General Fitness ",
      description: "Improve energy",
    },
    medicalConditions: ["asthma", "diabetes", "asthma"],
    otherHealthCondition: "",
    dislikedExercises: ["Squat Jump", "Burpee"],
    foodAllergies: ["Egg", "Egg"],
    foodRestrictions: ["Halal", " Halal "],
    dislikedFoods: ["Soda"],
  });

  assert.equal(first.inputHash, second.inputHash);
});

test("structured output validates all three fields", () => {
  const source = readFileSync(
    path.join(projectRoot, "src/lib/server/ai-assessment.ts"),
    "utf8",
  );

  assert.match(source, /required:\s*\["workoutAdvice", "nutritionAdvice", "healthAdvice"\]/);
  assert.match(source, /workoutAdvice:\s*z\.string\(\)\.trim\(\)\.min\(1\)/);
  assert.match(source, /nutritionAdvice:\s*z\.string\(\)\.trim\(\)\.min\(1\)/);
  assert.match(source, /healthAdvice:\s*z\.string\(\)\.trim\(\)\.min\(1\)/);
});

test("legacy coachingAdvice records are recognized safely", () => {
  assert.equal(isLegacyAssessmentContent({ coachingAdvice: "old" }), true);
  assert.equal(
    isLegacyAssessmentContent({
      workoutAdvice: "a",
      nutritionAdvice: "b",
      healthAdvice: "c",
    }),
    false,
  );
});

test("system prompt forbids unsupported body composition claims", () => {
  assert.match(
    assessmentSystemPrompt,
    /do not make unsupported body-composition claims from height and weight alone/i,
  );
});

test("profile refresh does not call OpenRouter automatically", () => {
  const pageSource = readFileSync(
    path.join(projectRoot, "src/app/(client)/assessment/page.tsx"),
    "utf8",
  );
  const screenSource = readFileSync(
    path.join(projectRoot, "src/components/client/screens/assessment-screen.tsx"),
    "utf8",
  );

  assert.doesNotMatch(pageSource, /generateAiAssessment\(/);
  assert.doesNotMatch(pageSource, /generateAssessmentAction\(/);
  assert.doesNotMatch(screenSource, /useEffect\(/);
});
